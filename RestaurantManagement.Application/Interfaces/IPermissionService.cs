using RestaurantManagement.Application.DTOs.Permissions;

namespace RestaurantManagement.Application.Interfaces;

public interface IPermissionService
{
    Task<List<PermissionDto>> GetAllAsync(CancellationToken ct = default);
    Task<PermissionDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(CreatePermissionDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdatePermissionDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
