using RestaurantManagement.Application.DTOs.RolePermissions;

namespace RestaurantManagement.Application.Interfaces;

public interface IRolePermissionService
{
    Task<List<RolePermissionDto>> GetByRoleIdAsync(int roleId, CancellationToken ct = default);
    Task<bool> AssignAsync(int roleId, int permissionId, CancellationToken ct = default);
    Task<bool> RemoveAsync(int roleId, int permissionId, CancellationToken ct = default);
}
