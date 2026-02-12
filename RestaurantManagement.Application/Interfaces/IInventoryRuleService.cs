using RestaurantManagement.Application.DTOs.InventoryRules;

namespace RestaurantManagement.Application.Interfaces;

public interface IInventoryRuleService
{
    Task<List<InventoryRuleDto>> GetAllAsync(CancellationToken ct = default);
    Task<InventoryRuleDto?> GetByIngredientIdAsync(int ingredientId, CancellationToken ct = default);
    Task<int> UpsertAsync(UpsertInventoryRuleDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int inventoryRulesId, CancellationToken ct = default);   
}