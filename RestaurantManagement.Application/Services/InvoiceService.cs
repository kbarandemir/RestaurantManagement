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
            .Select(x => new InvoiceDto(x.InvoiceId, x.Date, x.TotalCost, x.InvoicePictureUrl, x.SupplierName))
            .ToListAsync(ct);
    }

    public async Task<InvoiceDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Invoices.AsNoTracking()
            .Where(x => x.InvoiceId == id)
            .Select(x => new InvoiceDto(x.InvoiceId, x.Date, x.TotalCost, x.InvoicePictureUrl, x.SupplierName))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> CreateAsync(CreateInvoiceDto dto, CancellationToken ct = default)
    {
        if (dto.TotalCost < 0) throw new ArgumentException("TotalCost cannot be negative.");

        var entity = new Invoice
        {
            Date = dto.Date.Date,
            TotalCost = dto.TotalCost,
            InvoicePictureUrl = dto.InvoicePictureUrl,
            SupplierName = dto.SupplierName
        };

        _db.Invoices.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.InvoiceId;
    }
}