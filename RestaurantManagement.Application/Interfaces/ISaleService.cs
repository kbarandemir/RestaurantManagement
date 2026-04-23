using RestaurantManagement.Application.DTOs.Sales;

namespace RestaurantManagement.Application.Interfaces;

public interface ISaleService
{
    Task<int> CreateSaleAsync(CreateSaleDto dto, CancellationToken ct = default);
    Task<List<SaleListItemDto>> GetAllAsync(CancellationToken ct = default);
    Task<SaleDetailDto?> GetByIdAsync(int saleId, CancellationToken ct = default);
    Task<bool> UpdateSaleStatusAsync(int saleId, string status, CancellationToken ct = default);
}
