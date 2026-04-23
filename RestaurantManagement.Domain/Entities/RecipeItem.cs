namespace RestaurantManagement.Domain.Entities;

public class RecipeItem
{
    public int RecipeItemId { get; set; }

    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;

    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;

    // Quantity of this ingredient consumed per 1 unit of the MenuItem
    public decimal QuantityPerUnit { get; set; }
}
