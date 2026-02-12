using RestaurantManagement.Application.DTOs.Batches;

namespace RestaurantManagement.Application.Interfaces;

public interface IIngredientBatchService
{
    Task<List<IngredientBatchDto>> GetAllAsync(int? ingredientId = null, bool activeOnly = true, CancellationToken ct = default);
    Task<int> CreateAsync(CreateIngredientBatchDto dto, CancellationToken ct = default);
}