using RestaurantManagement.Application.DTOs.Dashboard;

namespace RestaurantManagement.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardDataDto> GetDashboardDataAsync(CancellationToken ct = default);
}
