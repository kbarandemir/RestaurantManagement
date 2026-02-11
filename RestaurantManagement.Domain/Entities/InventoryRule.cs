namespace RestaurantManagement.Domain.Entities;

public class InventoryRule
{
    public int InventoryRuleId { get; set; }
    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
    public decimal ReorderLevel { get; set; }
    public int ExpiryAlertDays { get; set; }
}
