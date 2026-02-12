using RestaurantManagement.Application.DTOs.Users;

namespace RestaurantManagement.Application.Interfaces;

public interface IUserService
{
    Task<List<UserListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<UserDetailDto?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<int> CreateAsync(CreateUserDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateUserDto dto, CancellationToken ct = default);

    Task<bool> ChangeRoleAsync(int id, ChangeUserRoleDto dto, CancellationToken ct = default);
    Task<bool> DeactivateAsync(int id, CancellationToken ct = default);
}
