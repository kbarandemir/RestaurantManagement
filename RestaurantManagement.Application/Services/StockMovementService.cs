using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.StockMovements;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.Application.Services;

public sealed class StockMovementService : IStockMovementService
{
    private readonly IAppDbContext _db;
    public StockMovementService(IAppDbContext db) {
        _db = db;
    } 

    public async Task<List<StockMovementDto>> GetAsync(
        int? ingredientId = null,
        string? referenceType = null,
        int? referenceId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default)
    {
        var q = _db.StockMovements.AsNoTracking();

        if (ingredientId.HasValue) q = q.Where(x => x.IngredientId == ingredientId.Value);
        if (!string.IsNullOrWhiteSpace(referenceType)) q = q.Where(x => x.ReferenceType == referenceType.Trim());
        if (referenceId.HasValue) q = q.Where(x => x.ReferenceId == referenceId.Value);
        if (from.HasValue) q = q.Where(x => x.MovementDateTime >= from.Value);
        if (to.HasValue) q = q.Where(x => x.MovementDateTime <= to.Value);

        return await q.OrderByDescending(x => x.MovementDateTime)
            .Take(500)
            .Select(x => new StockMovementDto(
                x.MovementId, x.IngredientId, x.BatchId, x.MovementType, x.Quantity,
                x.ReferenceType, x.ReferenceId, x.MovementDateTime, x.CreatedByUserId
            ))
            .ToListAsync(ct);
    }
}
