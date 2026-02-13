using RestaurantManagement.Application.DTOs.StockMovements;

namespace RestaurantManagement.Application.Interfaces;

public interface IStockMovementService
{
    Task<List<StockMovementDto>> GetAsync(
        int? ingredientId = null,
        string? referenceType = null,
        int? referenceId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default);
}
