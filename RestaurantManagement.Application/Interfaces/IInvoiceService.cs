using RestaurantManagement.Application.DTOs.Invoices;

namespace RestaurantManagement.Application.Interfaces;

public interface IInvoiceService
{
    Task<List<InvoiceDto>> GetAllAsync(CancellationToken ct = default);
    Task<InvoiceDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(CreateInvoiceDto dto, CancellationToken ct = default);

}