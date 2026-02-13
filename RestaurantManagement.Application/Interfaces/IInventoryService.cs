using RestaurantManagement.Application.DTOs.Inventory;

namespace RestaurantManagement.Application.Interfaces;

public interface IInventoryService
{
    Task<InventoryIngredientDto?> GetIngredientInventoryAsync(int ingredientId, CancellationToken ct = default);
}
