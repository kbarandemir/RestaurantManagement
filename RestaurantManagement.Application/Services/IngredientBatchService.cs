using RestaurantManagement.Application.DTOs.Batches;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace RestaurantManagement.Application.Services;

public sealed class IngredientBatchService : IIngredientBatchService
{
    private readonly IAppDbContext _db;
    public IngredientBatchService(IAppDbContext db) {
        _db = db;
    } 

    public async Task<List<IngredientBatchDto>> GetAllAsync(int? ingredientId = null, bool activeOnly = true, CancellationToken ct = default)
    {
        var q = _db.IngredientBatches.AsNoTracking();

        if (ingredientId.HasValue)
            q = q.Where(b => b.IngredientId == ingredientId.Value);

        if (activeOnly)
            q = q.Where(b => b.IsActive);

        return await q
            .OrderBy(b => b.ExpiryDate)
            .ThenBy(b => b.ReceivedDate)
            .Select(b => new IngredientBatchDto(
                b.BatchId, b.IngredientId, b.InvoiceId, b.QuantityOnHand, b.UnitCost,
                b.ReceivedDate, b.ExpiryDate, b.IsActive
            ))
            .ToListAsync(ct);
    }

    public async Task<int> CreateAsync(CreateIngredientBatchDto dto, CancellationToken ct = default)
    {
        if (dto.QuantityOnHand <= 0) throw new ArgumentException("QuantityOnHand must be > 0.");
        if (dto.ExpiryDate.Date < dto.ReceivedDate.Date) throw new ArgumentException("ExpiryDate cannot be before ReceivedDate.");

        var ingredientExists = await _db.Ingredients.AnyAsync(i => i.IngredientId == dto.IngredientId, ct);
        if (!ingredientExists) throw new ArgumentException("IngredientId not found.");

        if (dto.InvoiceId.HasValue)
        {
            var invoiceExists = await _db.Invoices.AnyAsync(i => i.InvoiceId == dto.InvoiceId.Value, ct);
            if (!invoiceExists) throw new ArgumentException("InvoiceId not found.");
        }

        var entity = new IngredientBatch
        {
            IngredientId = dto.IngredientId,
            InvoiceId = dto.InvoiceId,
            QuantityOnHand = dto.QuantityOnHand,
            UnitCost = dto.UnitCost,
            ReceivedDate = dto.ReceivedDate.Date,
            ExpiryDate = dto.ExpiryDate.Date,
            IsActive = true
        };

        _db.IngredientBatches.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.BatchId;
    }
}