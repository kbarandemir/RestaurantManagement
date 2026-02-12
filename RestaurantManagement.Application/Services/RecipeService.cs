using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Recipes;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class RecipeService : IRecipeService
{
    private readonly IAppDbContext _db;
    public RecipeService(IAppDbContext db) {
        _db = db;
    } 

    public async Task<List<RecipeListItemDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Recipes.AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecipeListItemDto(r.RecipeId, r.MenuItemId, r.IsActive, r.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<RecipeDetailDto?> GetByIdAsync(int recipeId, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes.AsNoTracking()
            .Where(r => r.RecipeId == recipeId)
            .Select(r => new { r.RecipeId, r.MenuItemId, r.IsActive, r.CreatedAt })
            .FirstOrDefaultAsync(ct);

        if (recipe is null) return null;

        var items = await _db.RecipeItems.AsNoTracking()
            .Where(ri => ri.RecipeId == recipeId)
            .OrderBy(ri => ri.RecipeItemId)
            .Select(ri => new RecipeItemDto(ri.RecipeItemId, ri.IngredientId, ri.QuantityPerUnit))
            .ToListAsync(ct);

        return new RecipeDetailDto(recipe.RecipeId, recipe.MenuItemId, recipe.IsActive, recipe.CreatedAt, items);
    }

    public async Task<RecipeDetailDto?> GetActiveByMenuItemIdAsync(int menuItemId, CancellationToken ct = default)
    {
        // Latest active recipe for a menu item
        var recipeId = await _db.Recipes.AsNoTracking()
            .Where(r => r.MenuItemId == menuItemId && r.IsActive)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => (int?)r.RecipeId)
            .FirstOrDefaultAsync(ct);

        return recipeId.HasValue ? await GetByIdAsync(recipeId.Value, ct) : null;
    }

    public async Task<int> CreateAsync(CreateRecipeDto dto, CancellationToken ct = default)
    {
        ValidateItems(dto.Items);

        // Menu item exists + active?
        var menuOk = await _db.MenuItems.AnyAsync(m => m.MenuItemId == dto.MenuItemId && m.IsActive, ct);
        if (!menuOk) throw new ArgumentException("MenuItemId not found or inactive.");

        // Validate ingredient ids
        var ingredientIds = dto.Items.Select(x => x.IngredientId).Distinct().ToList();
        var existingCount = await _db.Ingredients.CountAsync(i => ingredientIds.Contains(i.IngredientId) && i.IsActive, ct);
        if (existingCount != ingredientIds.Count) throw new ArgumentException("One or more IngredientId values are invalid/inactive.");

        // If you want "only one active recipe per menu item", deactivate others
        await using var tx = await (_db as DbContext)!.Database.BeginTransactionAsync(ct);

        var toDeactivate = await _db.Recipes
            .Where(r => r.MenuItemId == dto.MenuItemId && r.IsActive)
            .ToListAsync(ct);

        foreach (var r in toDeactivate)
            r.IsActive = false;

        var recipe = new Recipe
        {
            MenuItemId = dto.MenuItemId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync(ct);

        foreach (var item in dto.Items)
        {
            _db.RecipeItems.Add(new RecipeItem
            {
                RecipeId = recipe.RecipeId,
                IngredientId = item.IngredientId,
                QuantityPerUnit = item.QuantityPerUnit
            });
        }

        await _db.SaveChangesAsync(ct);
        await (_db as DbContext)!.Database.CommitTransactionAsync(ct);

        return recipe.RecipeId;
    }

    public async Task<bool> UpdateAsync(int recipeId, UpdateRecipeDto dto, CancellationToken ct = default)
    {
        ValidateItems(dto.Items);

        var recipe = await _db.Recipes.FirstOrDefaultAsync(r => r.RecipeId == recipeId, ct);
        if (recipe is null) return false;

        // Validate ingredients
        var ingredientIds = dto.Items.Select(x => x.IngredientId).Distinct().ToList();
        var existingCount = await _db.Ingredients.CountAsync(i => ingredientIds.Contains(i.IngredientId) && i.IsActive, ct);
        if (existingCount != ingredientIds.Count) throw new ArgumentException("One or more IngredientId values are invalid/inactive.");

        await using var tx = await (_db as DbContext)!.Database.BeginTransactionAsync(ct);

        recipe.IsActive = dto.IsActive;

        // Replace strategy: delete old items then insert new items
        var oldItems = await _db.RecipeItems.Where(x => x.RecipeId == recipeId).ToListAsync(ct);
        _db.RecipeItems.RemoveRange(oldItems);
        await _db.SaveChangesAsync(ct);

        foreach (var item in dto.Items)
        {
            _db.RecipeItems.Add(new RecipeItem
            {
                RecipeId = recipeId,
                IngredientId = item.IngredientId,
                QuantityPerUnit = item.QuantityPerUnit
            });
        }

        await _db.SaveChangesAsync(ct);
        await (_db as DbContext)!.Database.CommitTransactionAsync(ct);

        return true;
    }

    public async Task<bool> DeactivateAsync(int recipeId, CancellationToken ct = default)
    {
        var recipe = await _db.Recipes.FirstOrDefaultAsync(r => r.RecipeId == recipeId, ct);
        if (recipe is null) return false;

        recipe.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static void ValidateItems(List<CreateRecipeItemDto> items)
    {
        if (items is null || items.Count == 0)
            throw new ArgumentException("Recipe must contain at least one ingredient item.");

        if (items.Any(i => i.QuantityPerUnit <= 0))
            throw new ArgumentException("QuantityPerUnit must be > 0.");

        var dup = items.GroupBy(i => i.IngredientId).Any(g => g.Count() > 1);
        if (dup)
            throw new ArgumentException("IngredientId must be unique within the recipe.");
    }
}
