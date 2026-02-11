namespace RestaurantManagement.Domain.Entities;

public class Ingredient
{
    public int IngredientId { get; set; }
    public string Name { get; set; } = null!;
    public string BaseUnit { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public InventoryRule? InventoryRule { get; set; }
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<RecipeItem> RecipeItems { get; set; } = new List<RecipeItem>();
    public ICollection<IngredientBatch> Batches { get; set; } = new List<IngredientBatch>();


}
