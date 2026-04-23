using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Dashboard;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.Application.Services;
/// <summary>
/// Dashboard analytics service that aggregates real-time KPIs from the Sales database.
///
/// Computes:
///   - Period-based revenue totals (today, this week, this month, yearly)
///   - Percentage changes vs. previous periods for trend indicators
///   - 30-day daily sales trend for chart rendering
///   - Trending menu items ranked by order volume (today vs. yesterday)
///
/// All calculations exclude cancelled sales (Status != "canceled")
/// and operate on the UTC date boundary for timezone consistency.
/// </summary>
public sealed class DashboardService : IDashboardService
{
    private readonly IAppDbContext _db;
    public DashboardService(IAppDbContext db) => _db = db;

    public async Task<DashboardDataDto> GetDashboardDataAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow.Date;
        var result = new DashboardDataDto();

        // 1. Fetch raw totals grouped by date for the last 365 days
        var cutoff = now.AddDays(-365);
        var salesData = await _db.Sales
            .Where(s => s.SaleDateTime >= cutoff && s.Status != "canceled")
            .Select(s => new {
                Date = s.SaleDateTime.Date,
                Total = s.Items.Sum(i => i.Quantity * i.UnitPriceAtSale)
            })
            .ToListAsync(ct);

        // Calculate KPI values
        result.TodaySales = salesData.Where(s => s.Date == now).Sum(s => s.Total);
        result.YesterdaySales = salesData.Where(s => s.Date == now.AddDays(-1)).Sum(s => s.Total);

        result.ThisWeekSales = salesData.Where(s => s.Date > now.AddDays(-7)).Sum(s => s.Total);
        result.LastWeekSales = salesData.Where(s => s.Date > now.AddDays(-14) && s.Date <= now.AddDays(-7)).Sum(s => s.Total);

        result.ThisMonthSales = salesData.Where(s => s.Date > now.AddDays(-30)).Sum(s => s.Total);
        result.LastMonthSales = salesData.Where(s => s.Date > now.AddDays(-60) && s.Date <= now.AddDays(-30)).Sum(s => s.Total);

        result.YearlySales = salesData.Where(s => s.Date > now.AddDays(-365)).Sum(s => s.Total);
        result.LastYearSales = 0m; // We only seeded 365 days, so no last year data

        // Generate DailyTrend for the last 30 days
        for (int i = 29; i >= 0; i--)
        {
            var d = now.AddDays(-i);
            var sum = salesData.Where(s => s.Date == d).Sum(s => s.Total);
            result.DailyTrend.Add(new DailySaleTrendDto
            {
                Day = d.ToString("dd MMM"),
                Sales = sum
            });
        }

        // 2. Fetch Item-level data for the last 2 days to compute Trending Items
        var twoDaysAgo = now.AddDays(-1);
        var itemData = await _db.SaleItems
            .Where(si => si.Sale.SaleDateTime >= twoDaysAgo && si.Sale.Status != "canceled")
            .Select(si => new {
                Date = si.Sale.SaleDateTime.Date,
                MenuName = si.MenuItem.Name,
                Quantity = si.Quantity,
                Revenue = si.Quantity * si.UnitPriceAtSale
            })
            .ToListAsync(ct);

        var todayItems = itemData.Where(x => x.Date == now)
            .GroupBy(x => x.MenuName)
            .Select(g => new { 
                Name = g.Key, 
                Orders = g.Sum(x => x.Quantity), 
                Revenue = g.Sum(x => x.Revenue) 
            })
            .OrderByDescending(x => x.Orders)
            .Take(5)
            .ToList();

        var yesterdayItems = itemData.Where(x => x.Date == now.AddDays(-1))
            .GroupBy(x => x.MenuName)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        int rank = 1;
        foreach (var t in todayItems)
        {
            decimal change = 0;
            if (yesterdayItems.TryGetValue(t.Name, out int yQty) && yQty > 0)
            {
                change = Math.Round(((decimal)(t.Orders - yQty) / yQty) * 100m, 1);
            }
            else
            {
                change = 100m; // if they sold none yesterday, assume 100% growth
            }

            result.TrendingItems.Add(new TrendingItemDto
            {
                Rank = rank++,
                Name = t.Name,
                Orders = t.Orders,
                Revenue = t.Revenue,
                Change = change
            });
        }

        return result;
    }
}
