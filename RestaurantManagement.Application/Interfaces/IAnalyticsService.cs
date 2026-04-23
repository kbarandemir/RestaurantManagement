using RestaurantManagement.Application.DTOs.Analytics;

namespace RestaurantManagement.Application.Interfaces;

public interface IAnalyticsService
{
    Task<AnalyticsDataDto> GetAnalyticsAsync(string period, CancellationToken ct = default);
}
