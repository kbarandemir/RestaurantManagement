
using RestaurantManagement.Application.DTOs.MenuItems;

namespace RestaurantManagement.Application.Interfaces;

public interface IMenuItemService 
{
    Task<List<MenuItemListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<MenuItemDetailDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(CreateMenuItemDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateMenuItemDto dto, CancellationToken ct = default);
    Task<bool> DeactivateAsync(int id, CancellationToken ct = default);
}