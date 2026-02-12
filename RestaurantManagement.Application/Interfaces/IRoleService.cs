using RestaurantManagement.Application.DTOs.Roles;

namespace RestaurantManagement.Application.Interfaces;

public interface IRoleService
{
    Task<List<RoleDto>> GetAllAsync(CancellationToken ct = default);
    Task<RoleDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(CreateRoleDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateRoleDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
