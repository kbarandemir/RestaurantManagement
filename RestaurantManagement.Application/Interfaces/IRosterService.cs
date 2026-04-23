using RestaurantManagement.Application.DTOs.Roster;

namespace RestaurantManagement.Application.Interfaces;

public interface IRosterService
{
    Task<List<ShiftDto>> GetWeekAsync(DateOnly weekStart, bool includeUnpublished = false, CancellationToken ct = default);
    Task<int> PublishWeekAsync(DateOnly weekStart, CancellationToken ct = default);
    Task<int> CreateShiftAsync(CreateShiftDto dto, CancellationToken ct = default);
    Task<bool> UpdateShiftAsync(int id, UpdateShiftDto dto, CancellationToken ct = default);
    Task<bool> DeleteShiftAsync(int id, CancellationToken ct = default);
    Task<int> UnpublishWeekAsync(DateOnly weekStart, CancellationToken ct = default);
}
