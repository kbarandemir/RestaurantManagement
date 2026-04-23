namespace RestaurantManagement.Application.DTOs.Recipes;

public sealed record RecipeItemDto(int RecipeItemId, int IngredientId, string IngredientName, decimal QuantityPerUnit, decimal UnitCost);

public sealed record RecipeDetailDto(
    int RecipeId,
    int MenuItemId,
    string MenuItemName,
    string CategoryName,
    bool IsActive,
    DateTime CreatedAt,
    string? PrepTime,
    int? Servings,
    string? Instructions,
    List<RecipeItemDto> Items
);

public sealed record RecipeListItemDto(
    int RecipeId, 
    int MenuItemId, 
    string MenuItemName, 
    string CategoryName, 
    bool IsActive, 
    DateTime CreatedAt,
    string? PrepTime,
    int? Servings
);

public sealed class CreateRecipeDto
{
    public int MenuItemId { get; set; }
    public List<CreateRecipeItemDto> Items { get; set; } = new();
}

public sealed class CreateRecipeItemDto
{
    public int IngredientId { get; set; }
    public decimal QuantityPerUnit { get; set; }
}

public sealed class UpdateRecipeDto
{
    public bool IsActive { get; set; } = true;
    public List<CreateRecipeItemDto> Items { get; set; } = new(); // replace strategy
}
