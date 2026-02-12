using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Roles;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class RoleService : IRoleService
{
    private readonly IAppDbContext _db;
    public RoleService(IAppDbContext db) => _db = db;

    public async Task<List<RoleDto>> GetAllAsync(CancellationToken ct = default)
        => await _db.Roles.AsNoTracking()
            .OrderBy(r => r.RoleName)
            .Select(r => new RoleDto(r.RoleId, r.RoleName))
            .ToListAsync(ct);

    public async Task<RoleDto?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _db.Roles.AsNoTracking()
            .Where(r => r.RoleId == id)
            .Select(r => new RoleDto(r.RoleId, r.RoleName))
            .FirstOrDefaultAsync(ct);

    public async Task<int> CreateAsync(CreateRoleDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.RoleName)) throw new ArgumentException("RoleName is required.");
        var name = dto.RoleName.Trim();

        var exists = await _db.Roles.AnyAsync(r => r.RoleName == name, ct);
        if (exists) throw new ArgumentException("RoleName already exists.");

        var role = new Role { RoleName = name };
        _db.Roles.Add(role);
        await _db.SaveChangesAsync(ct);
        return role.RoleId;
    }

    public async Task<bool> UpdateAsync(int id, UpdateRoleDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.RoleName)) throw new ArgumentException("RoleName is required.");
        var name = dto.RoleName.Trim();

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleId == id, ct);
        if (role is null) return false;

        var exists = await _db.Roles.AnyAsync(r => r.RoleId != id && r.RoleName == name, ct);
        if (exists) throw new ArgumentException("RoleName already exists.");

        role.RoleName = name;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleId == id, ct);
        if (role is null) return false;

        // Eğer bu role bağlı user varsa silme (güvenli)
        var used = await _db.Users.AnyAsync(u => u.RoleId == id, ct);
        if (used) throw new ArgumentException("Role is assigned to users. Remove users from this role first.");

        _db.Roles.Remove(role);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
