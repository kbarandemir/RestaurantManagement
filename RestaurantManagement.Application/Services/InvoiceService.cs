using RestaurantManagement.Application.DTOs.Invoices;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace RestaurantManagement.Application.Services;

public sealed class InvoiceService : IInvoiceService
{
    private readonly IAppDbContext _db;
    public InvoiceService(IAppDbContext db){
        _db = db;
    }

    public async Task<List<InvoiceDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Invoices.AsNoTracking()
            .OrderByDescending(x => x.Date)
            .Select(x => new InvoiceDto
            {
                InvoiceId = x.InvoiceId,
                InvoiceDate = x.Date,
                TotalCost = x.TotalCost,
                SupplierName = x.SupplierName,
                Items = x.IngredientBatches.Select(b => new InvoiceItemDto
                {
                    IngredientId = b.IngredientId,
                    IngredientName = b.Ingredient.Name,
                    Quantity = b.QuantityOnHand,
                    UnitCost = b.UnitCost ?? 0,
                    ExpiryDate = b.ExpiryDate
                }).ToList()
            })
            .ToListAsync(ct);
    }

    public async Task<InvoiceDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Invoices.AsNoTracking()
            .Where(x => x.InvoiceId == id)
            .Select(x => new InvoiceDto
            {
                InvoiceId = x.InvoiceId,
                InvoiceDate = x.Date,
                TotalCost = x.TotalCost,
                SupplierName = x.SupplierName,
                Items = x.IngredientBatches.Select(b => new InvoiceItemDto
                {
                    IngredientId = b.IngredientId,
                    IngredientName = b.Ingredient.Name,
                    Quantity = b.QuantityOnHand,
                    UnitCost = b.UnitCost ?? 0,
                    ExpiryDate = b.ExpiryDate
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> CreateAsync(CreateInvoiceDto dto, CancellationToken ct = default)
    {
        if (dto.TotalCost < 0) throw new ArgumentException("TotalCost cannot be negative.");

        var entity = new Invoice
        {
            Date = dto.Date.Date,
            TotalCost = dto.TotalCost,
            SupplierName = dto.SupplierName ?? "Unknown"
        };

        _db.Invoices.Add(entity);
        await _db.SaveChangesAsync(ct);

        if (dto.Batches != null && dto.Batches.Any())
        {
            foreach (var b in dto.Batches)
            {
                _db.IngredientBatches.Add(new IngredientBatch
                {
                    InvoiceId = entity.InvoiceId,
                    IngredientId = b.IngredientId,
                    QuantityOnHand = b.QuantityOnHand,
                    UnitCost = b.UnitCost,
                    ReceivedDate = entity.Date,
                    ExpiryDate = b.ExpiryDate,
                    IsActive = true
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        return entity.InvoiceId;
    }
}