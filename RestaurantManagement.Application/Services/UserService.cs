using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Users;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class UserService : IUserService
{
    private readonly IAppDbContext _db;
    public UserService(IAppDbContext db) => _db = db;

    public async Task<List<UserListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var q = _db.Users.AsNoTracking();

        if (!includeInactive)
            q = q.Where(u => u.IsActive);

        return await q
            .OrderBy(u => u.FullName)
            .Select(u => new UserListItemDto(u.UserId, u.FullName, u.Email, u.RoleId, u.IsActive))
            .ToListAsync(ct);
    }

    public async Task<UserDetailDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Users.AsNoTracking()
            .Where(u => u.UserId == id)
            .Select(u => new UserDetailDto(u.UserId, u.FullName, u.Email, u.RoleId, u.IsActive))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> CreateAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        ValidateNameEmail(dto.FullName, dto.Email);

        // Role exists?
        var roleOk = await _db.Roles.AnyAsync(r => r.RoleId == dto.RoleId, ct);
        if (!roleOk) throw new ArgumentException("RoleId not found.");

        // Email unique?
        var emailLower = dto.Email.Trim().ToLowerInvariant();
        var emailUsed = await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct);
        if (emailUsed) throw new ArgumentException("Email already exists.");

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            RoleId = dto.RoleId,
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user.UserId;
    }

    public async Task<bool> UpdateAsync(int id, UpdateUserDto dto, CancellationToken ct = default)
    {
        ValidateNameEmail(dto.FullName, dto.Email);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user is null) return false;

        var emailLower = dto.Email.Trim().ToLowerInvariant();
        var emailUsed = await _db.Users.AnyAsync(u => u.UserId != id && u.Email.ToLower() == emailLower, ct);
        if (emailUsed) throw new ArgumentException("Email already exists.");

        user.FullName = dto.FullName.Trim();
        user.Email = dto.Email.Trim();
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

    private static void ValidateNameEmail(string fullName, string email)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("FullName is required.");

        if (fullName.Length > 120)
            throw new ArgumentException("FullName is too long (max 120).");

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.");

        if (email.Length > 200)
            throw new ArgumentException("Email is too long (max 200).");

        // MVP email check
        if (!email.Contains('@') || !email.Contains('.'))
            throw new ArgumentException("Email format is invalid.");
    }
}
