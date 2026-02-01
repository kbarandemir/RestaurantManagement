namespace RestaurantManagement.Domain.Entities;

public class RecipeItem
{
    public int RecipeItemId { get; set; }

    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;

    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;

    // 1 adet MenuItem için tüketim miktarı
    public decimal QuantityPerUnit { get; set; }
}
