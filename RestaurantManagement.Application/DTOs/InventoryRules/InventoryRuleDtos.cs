namespace RestaurantManagement.Application.DTOs.InventoryRules;

public sealed record InventoryRuleDto(int InventoryRulesId, int IngredientId, decimal ReorderLevel, int ExpiryAlertDays);

public sealed class UpsertInventoryRuleDto
{
    public int IngredientId { get; set; }
    public decimal ReorderLevel { get; set; }
    public int ExpiryAlertDays { get; set; }
}
