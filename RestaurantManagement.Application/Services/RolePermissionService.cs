using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.RolePermissions;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class RolePermissionService : IRolePermissionService
{
    private readonly IAppDbContext _db;
    public RolePermissionService(IAppDbContext db) => _db = db;

    public async Task<List<RolePermissionDto>> GetByRoleIdAsync(int roleId, CancellationToken ct = default)
    {
        return await _db.RolePermissions.AsNoTracking()
            .Where(rp => rp.RoleId == roleId)
            .OrderBy(rp => rp.PermissionId)
            .Select(rp => new RolePermissionDto(rp.RoleId, rp.PermissionId))
            .ToListAsync(ct);
    }

    public async Task<bool> AssignAsync(int roleId, int permissionId, CancellationToken ct = default)
    {
        var roleOk = await _db.Roles.AnyAsync(r => r.RoleId == roleId, ct);
        if (!roleOk) throw new ArgumentException("RoleId not found.");

        var permOk = await _db.Permissions.AnyAsync(p => p.PermissionId == permissionId, ct);
        if (!permOk) throw new ArgumentException("PermissionId not found.");

        var exists = await _db.RolePermissions.AnyAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, ct);
        if (exists) return false;

        _db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveAsync(int roleId, int permissionId, CancellationToken ct = default)
    {
        var rp = await _db.RolePermissions.FirstOrDefaultAsync(x => x.RoleId == roleId && x.PermissionId == permissionId, ct);
        if (rp is null) return false;

        _db.RolePermissions.Remove(rp);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
