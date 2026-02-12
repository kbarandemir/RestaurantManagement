namespace RestaurantManagement.Application.DTOs.Recipes;

public sealed record RecipeItemDto(int RecipeItemId, int IngredientId, decimal QuantityPerUnit);

public sealed record RecipeDetailDto(
    int RecipeId,
    int MenuItemId,
    bool IsActive,
    DateTime CreatedAt,
    List<RecipeItemDto> Items
);

public sealed record RecipeListItemDto(int RecipeId, int MenuItemId, bool IsActive, DateTime CreatedAt);

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
