using RestaurantManagement.Application.DTOs.Recipes;

namespace RestaurantManagement.Application.Interfaces;

public interface IRecipeService
{
    Task<List<RecipeListItemDto>> GetAllAsync(CancellationToken ct = default);
    Task<RecipeDetailDto?> GetByIdAsync(int recipeId, CancellationToken ct = default);
    Task<RecipeDetailDto?> GetActiveByMenuItemIdAsync(int menuItemId, CancellationToken ct = default);

    Task<int> CreateAsync(CreateRecipeDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int recipeId, UpdateRecipeDto dto, CancellationToken ct = default);
    Task<bool> DeactivateAsync(int recipeId, CancellationToken ct = default);
}
