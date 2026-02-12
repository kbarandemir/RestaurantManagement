using RestaurantManagement.Application.DTOs.Ingredients;

namespace RestaurantManagement.Application.Interfaces;

public interface IIngredientService
{
    Task<List<IngredientListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<IngredientDetailDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(CreateIngredientDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateIngredientDto dto, CancellationToken ct = default);
    Task<bool> DeactivateAsync(int id, CancellationToken ct = default);
}
