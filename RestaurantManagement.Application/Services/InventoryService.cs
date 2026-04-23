using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Inventory;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.Application.Services;

public sealed class InventoryService : IInventoryService
{
    private readonly IAppDbContext _db;
    public InventoryService(IAppDbContext db) {
        _db = db;
    } 

    public async Task<InventoryIngredientDto?> GetIngredientInventoryAsync(int ingredientId, CancellationToken ct = default)
    {
        var ingredient = await _db.Ingredients.AsNoTracking()
            .Where(i => i.IngredientId == ingredientId)
            .Select(i => new { i.IngredientId, i.Name, i.BaseUnit })
            .FirstOrDefaultAsync(ct);

        if (ingredient is null) return null;

        var batches = await _db.IngredientBatches.AsNoTracking()
            .Where(b => b.IngredientId == ingredientId)
            .OrderBy(b => b.ExpiryDate)
            .Select(b => new InventoryBatchDto(b.BatchId, b.QuantityOnHand, b.ReceivedDate, b.ExpiryDate, b.IsActive))
            .ToListAsync(ct);

        var total = batches.Sum(b => b.QuantityOnHand);

        return new InventoryIngredientDto(ingredient.IngredientId, ingredient.Name, ingredient.BaseUnit, total, batches);
    }
}
