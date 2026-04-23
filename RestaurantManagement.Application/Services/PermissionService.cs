using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Permissions;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class PermissionService : IPermissionService
{
    private readonly IAppDbContext _db;
    public PermissionService(IAppDbContext db) {
         _db = db;
    }
    public async Task<List<PermissionDto>> GetAllAsync(CancellationToken ct = default)
        => await _db.Permissions.AsNoTracking()
            .OrderBy(p => p.PermissionKey)
            .Select(p => new PermissionDto(p.PermissionId, p.PermissionKey))
            .ToListAsync(ct);

    public async Task<PermissionDto?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _db.Permissions.AsNoTracking()
            .Where(p => p.PermissionId == id)
            .Select(p => new PermissionDto(p.PermissionId, p.PermissionKey))
            .FirstOrDefaultAsync(ct);

    public async Task<int> CreateAsync(CreatePermissionDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.PermissionKey)) throw new ArgumentException("PermissionKey is required.");
        var key = dto.PermissionKey.Trim();

        var exists = await _db.Permissions.AnyAsync(p => p.PermissionKey == key, ct);
        if (exists) throw new ArgumentException("PermissionKey already exists.");

        var p = new Permission { PermissionKey = key };
        _db.Permissions.Add(p);
        await _db.SaveChangesAsync(ct);
        return p.PermissionId;
    }

    public async Task<bool> UpdateAsync(int id, UpdatePermissionDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.PermissionKey)) throw new ArgumentException("PermissionKey is required.");
        var key = dto.PermissionKey.Trim();

        var p = await _db.Permissions.FirstOrDefaultAsync(x => x.PermissionId == id, ct);
        if (p is null) return false;

        var exists = await _db.Permissions.AnyAsync(x => x.PermissionId != id && x.PermissionKey == key, ct);
        if (exists) throw new ArgumentException("PermissionKey already exists.");

        p.PermissionKey = key;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var p = await _db.Permissions.FirstOrDefaultAsync(x => x.PermissionId == id, ct);
        if (p is null) return false;

        // Cannot delete a permission that is currently in use
        var used = await _db.RolePermissions.AnyAsync(rp => rp.PermissionId == id, ct);
        if (used) throw new ArgumentException("Permission is assigned to roles. Remove assignments first.");

        _db.Permissions.Remove(p);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
