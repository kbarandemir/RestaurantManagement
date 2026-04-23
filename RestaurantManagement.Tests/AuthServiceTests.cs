using Xunit;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.Services;
using RestaurantManagement.Application.DTOs.Auth;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Tests;

/// <summary>
/// Unit tests for the AuthService — focuses on JWT token generation,
/// login flow, first-login password change, and security validation.
///
/// The JWT implementation must:
///   1. Include sub (userId), email, and role claims
///   2. Use HMAC-SHA256 signing with a configurable secret key
///   3. Set correct issuer, audience, and expiration
///   4. Force first-login users to change their password before getting a token
///   5. Reject incorrect passwords with UnauthorizedAccessException
/// </summary>
public class AuthServiceTests
{
    /// <summary>
    /// Creates a mock IConfiguration that provides JWT settings matching
    /// what the AuthService expects from appsettings.json:
    ///   Jwt:Key, Jwt:Issuer, Jwt:Audience, Jwt:ExpiresMinutes
    /// </summary>
    private static IConfiguration CreateTestConfig()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSecretKeyForUnitTests_MustBe256Bit!",
                ["Jwt:Issuer"] = "RestaurantManagement.Tests",
                ["Jwt:Audience"] = "RestaurantManagement.Tests",
                ["Jwt:ExpiresMinutes"] = "60"
            })
            .Build();
        return config;
    }

    /// <summary>
    /// Creates a fresh in-memory DbContext for test isolation.
    /// </summary>
    private static RestaurantManagement.Infrastructure.Data.AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<RestaurantManagement.Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new RestaurantManagement.Infrastructure.Data.AppDbContext(options);
    }

    /// <summary>
    /// Verifies that RegisterAsync creates a new user and returns a
    /// valid JWT token containing the correct claims.
    /// </summary>
    [Fact]
    public async Task Register_ShouldReturnJwtToken_WithCorrectClaims()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var config = CreateTestConfig();

        // Seed a role for the registration to assign
        db.Roles.Add(new Role { RoleName = "Waiter" });
        await db.SaveChangesAsync();

        var service = new AuthService(db, config);

        // Act
        var result = await service.RegisterAsync(new RegisterRequestDto(
            "John", "Doe", "john@test.com", "Password123", null
        ));

        // Assert: token should be non-empty and decodable
        Assert.False(string.IsNullOrEmpty(result.AccessToken));

        // Decode and verify claims
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.AccessToken);

        Assert.Equal("john@test.com", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("Waiter", jwt.Claims.First(c => c.Type == "role").Value);
    }

    /// <summary>
    /// Verifies that JWT tokens are signed with HMAC-SHA256 and can be
    /// validated using the same key, proving the signature is authentic.
    /// </summary>
    [Fact]
    public async Task Register_ShouldGenerateToken_WithValidSignature()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var config = CreateTestConfig();
        db.Roles.Add(new Role { RoleName = "Waiter" });
        await db.SaveChangesAsync();

        var service = new AuthService(db, config);

        // Act
        var result = await service.RegisterAsync(new RegisterRequestDto(
            "Jane", "Doe", "jane@test.com", "Pass1234", null
        ));

        // Assert: validate the token signature using the same key
        var handler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("TestSecretKeyForUnitTests_MustBe256Bit!"));

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "RestaurantManagement.Tests",
            ValidAudience = "RestaurantManagement.Tests",
            IssuerSigningKey = key
        };

        // This will throw if the signature is invalid
        var principal = await handler.ValidateTokenAsync(result.AccessToken, validationParams);
        Assert.True(principal.IsValid);
    }

    /// <summary>
    /// Verifies that duplicate email registration throws an appropriate error.
    /// </summary>
    [Fact]
    public async Task Register_ShouldThrow_WhenDuplicateEmail()
    {
        using var db = CreateInMemoryDb();
        var config = CreateTestConfig();
        db.Roles.Add(new Role { RoleName = "Waiter" });
        await db.SaveChangesAsync();

        var service = new AuthService(db, config);

        // Register once
        await service.RegisterAsync(new RegisterRequestDto(
            "John", "Doe", "duplicate@test.com", "Pass123", null
        ));

        // Register again with same email — should throw
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterAsync(new RegisterRequestDto(
                "Jane", "Smith", "duplicate@test.com", "Pass456", null
            ))
        );
    }

    /// <summary>
    /// Verifies that the login flow returns RequiresPasswordChange=true
    /// when the user has IsFirstLogin=true, preventing token issuance
    /// until they set a new password via the activation code flow.
    /// </summary>
    [Fact]
    public async Task Login_ShouldRequirePasswordChange_WhenFirstLogin()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var config = CreateTestConfig();

        db.Roles.Add(new Role { RoleName = "Staff" });
        await db.SaveChangesAsync();
        var role = await db.Roles.FirstAsync();

        // Create a first-login user (simulates admin-created account)
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        var user = new User
        {
            FirstName = "New",
            LastName = "Employee",
            Email = "new@test.com",
            RoleId = role.RoleId,
            IsFirstLogin = true,
            ActivationCode = "TEMP123",
            ActivationCodeExpiry = DateTime.UtcNow.AddHours(24),
            PasswordHash = ""
        };
        user.PasswordHash = hasher.HashPassword(user, "tempPass1");

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AuthService(db, config);

        // Act
        var result = await service.LoginAsync(new LoginRequestDto("new@test.com", "tempPass1"));

        // Assert: should not return a token, but flag password change required
        Assert.True(result.RequiresPasswordChange);
        Assert.Null(result.Auth);
        Assert.Equal("TEMP123", result.ActivationCode);
    }

    /// <summary>
    /// Verifies that an incorrect password throws UnauthorizedAccessException.
    /// </summary>
    [Fact]
    public async Task Login_ShouldThrow_WhenPasswordIncorrect()
    {
        using var db = CreateInMemoryDb();
        var config = CreateTestConfig();

        db.Roles.Add(new Role { RoleName = "Waiter" });
        await db.SaveChangesAsync();

        var service = new AuthService(db, config);

        // Register a user
        await service.RegisterAsync(new RegisterRequestDto(
            "Test", "User", "login@test.com", "CorrectPassword", null
        ));

        // Make sure the user isn't flagged for first login
        var user = await db.Users.FirstAsync(u => u.Email == "login@test.com");
        user.IsFirstLogin = false;
        await db.SaveChangesAsync();

        // Act & Assert: wrong password should throw
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.LoginAsync(new LoginRequestDto("login@test.com", "WrongPassword"))
        );
    }
}
