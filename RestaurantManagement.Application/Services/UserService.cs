using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Users;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class UserService : IUserService
{
    private readonly IAppDbContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public UserService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<UserListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var q = _db.Users.Include(u => u.Role).AsNoTracking();

        if (!includeInactive)
            q = q.Where(u => u.IsActive);

        return await q
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Select(u => new UserListItemDto(
                u.UserId,
                u.FirstName,
                u.LastName,
                u.Email,
                u.RoleId,
                u.Role.RoleName,
                u.IsActive,
                u.IsFirstLogin,
                u.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<UserDetailDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Users.AsNoTracking()
            .Include(u => u.Role)
            .Where(u => u.UserId == id)
            .Select(u => new UserDetailDto(
                u.UserId,
                u.FirstName,
                u.LastName,
                u.Email,
                u.RoleId,
                u.Role.RoleName,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> CreateAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        ValidateNameEmail(dto.FirstName, dto.LastName, dto.Email);

        // Role exists?
        var roleOk = await _db.Roles.AnyAsync(r => r.RoleId == dto.RoleId, ct);
        if (!roleOk) throw new ArgumentException("RoleId not found.");

        // Email unique?
        var emailLower = dto.Email.Trim().ToLowerInvariant();
        var emailUsed = await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct);
        if (emailUsed) throw new ArgumentException("Email already exists.");

        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            RoleId = dto.RoleId,
            IsActive = true,
            IsFirstLogin = true,
            CreatedAt = DateTime.UtcNow,
            // No password yet — admin must click "Generate First-Time Password"
            PasswordHash = null
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user.UserId;
    }

    public async Task<GeneratePasswordResponseDto> GenerateTempPasswordAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null) throw new ArgumentException("User not found.");

        // Generate a short, readable temp password (8 chars, alphanumeric)
        var temporaryPassword = GenerateAlphanumeric(8);

        // Store the plain-text temp password as the ActivationCode (visible to admin)
        user.ActivationCode = temporaryPassword;
        user.ActivationCodeExpiry = DateTime.UtcNow.AddHours(24);
        user.IsFirstLogin = true;

        // Hash the same temp password so the user can authenticate with it
        user.PasswordHash = _hasher.HashPassword(user, temporaryPassword);

        await _db.SaveChangesAsync(ct);

        return new GeneratePasswordResponseDto(temporaryPassword);
    }

    public async Task<bool> UpdateAsync(int id, UpdateUserDto dto, CancellationToken ct = default)
    {
        ValidateNameEmail(dto.FirstName, dto.LastName, dto.Email);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null) return false;

        var emailLower = dto.Email.Trim().ToLowerInvariant();
        var emailUsed = await _db.Users.AnyAsync(u => u.UserId != id && u.Email.ToLower() == emailLower, ct);
        if (emailUsed) throw new ArgumentException("Email already exists.");

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.Email = dto.Email.Trim().ToLowerInvariant();
        user.PhoneNumber = dto.PhoneNumber?.Trim();
        user.Country = dto.Country?.Trim();
        user.City = dto.City?.Trim();
        user.PostalCode = dto.PostalCode?.Trim();
        user.TaxId = dto.TaxId?.Trim();
        user.IsActive = dto.IsActive;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ChangeRoleAsync(int id, ChangeUserRoleDto dto, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null) return false;

        var roleOk = await _db.Roles.AnyAsync(r => r.RoleId == dto.RoleId, ct);
        if (!roleOk) throw new ArgumentException("RoleId not found.");

        user.RoleId = dto.RoleId;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeactivateAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null) return false;

        user.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static string GenerateAlphanumeric(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        return RandomNumberGenerator.GetString(chars, length);
    }

    private static void ValidateNameEmail(string firstName, string lastName, string email)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("FirstName is required.");

        if (firstName.Length > 60)
            throw new ArgumentException("FirstName is too long (max 60).");

        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("LastName is required.");

        if (lastName.Length > 60)
            throw new ArgumentException("LastName is too long (max 60).");

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.");

        if (email.Length > 200)
            throw new ArgumentException("Email is too long (max 200).");

        if (!email.Contains('@') || !email.Contains('.'))
            throw new ArgumentException("Email format is invalid.");
    }
}
