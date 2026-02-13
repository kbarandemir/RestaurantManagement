using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RestaurantManagement.Application.DTOs.Auth;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly IAppDbContext _db;
    private readonly IConfiguration _config;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthService(IAppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct);
        if (exists) throw new InvalidOperationException("Email is already registered.");

        // Default role
        var roleName = string.IsNullOrWhiteSpace(dto.RoleName) ? "Waiter" : dto.RoleName.Trim();
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName, ct);

        // Role yoksa fallback
        role ??= await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == "Waiter", ct)
                 ?? throw new InvalidOperationException("Default role not found (Waiter). Seed roles first.");

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            RoleId = role.RoleId,
            IsActive = true,
            PasswordHash = "" // aşağıda set edilecek
        };

        user.PasswordHash = _hasher.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        // RoleName'i dönerken net alalım
        var accessToken = GenerateJwt(user.UserId, user.Email, role.RoleName);

        return new AuthResponseDto(
            accessToken,
            new AuthUserDto(user.UserId, user.FullName, user.Email, role.RoleName)
        );
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, ct);

        if (user is null) throw new UnauthorizedAccessException("Invalid credentials.");
        if (!user.IsActive) throw new UnauthorizedAccessException("User is inactive.");

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid credentials.");

        var roleName = user.Role?.RoleName ?? "Unknown";
        var accessToken = GenerateJwt(user.UserId, user.Email, roleName);

        return new AuthResponseDto(
            accessToken,
            new AuthUserDto(user.UserId, user.FullName, user.Email, roleName)
        );
    }

    private string GenerateJwt(int userId, string email, string roleName)
    {
        var jwtSection = _config.GetSection("Jwt");
        var key = jwtSection["Key"]!;
        var issuer = jwtSection["Issuer"]!;
        var audience = jwtSection["Audience"]!;
        var expiresMinutes = int.Parse(jwtSection["ExpiresMinutes"] ?? "120");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Role, roleName),
            new("role", roleName) // frontend kolay okusun diye
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
