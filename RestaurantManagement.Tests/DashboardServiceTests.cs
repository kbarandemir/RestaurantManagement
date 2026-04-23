using Xunit;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.Services;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Tests;

/// <summary>
/// Unit tests for the DashboardService — validates that the KPI aggregation
/// engine computes correct revenue totals from the Sales and SaleItems tables.
///
/// The dashboard needs:
///   - Today's sales total
///   - This week's sales total
///   - This month's sales total
///   - Year-to-date total
///   - Daily trend data for the last 30 days
///   - Trending items ranked by order quantity
/// </summary>
public class DashboardServiceTests
{
    /// <summary>
    /// Creates an isolated in-memory database for each test.
    /// </summary>
    private static RestaurantManagement.Infrastructure.Data.AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<RestaurantManagement.Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new RestaurantManagement.Infrastructure.Data.AppDbContext(options);
    }

    /// <summary>
    /// Seeds sales data for specific days with known amounts.
    /// This allows us to validate exact KPI calculations.
    /// </summary>
    private static async Task SeedSalesData(RestaurantManagement.Infrastructure.Data.AppDbContext db)
    {
        // Category and MenuItem for sale items
        var category = new Category { Name = "Test" };
        db.Set<Category>().Add(category);
        await db.SaveChangesAsync();

        var menuItem = new MenuItem { Name = "Test Dish", Price = 25m, CategoryId = category.CategoryId };
        db.MenuItems.Add(menuItem);
        await db.SaveChangesAsync();

        var now = DateTime.UtcNow.Date;

        // Create 3 sales today: €25 × 2 items each = €50 per sale, €150 total
        for (int i = 0; i < 3; i++)
        {
            var sale = new Sale { SaleDateTime = now.AddHours(10 + i), Status = "paidbycash" };
            db.Sales.Add(sale);
            await db.SaveChangesAsync();

            db.SaleItems.Add(new SaleItem
            {
                SaleId = sale.SaleId,
                MenuItemId = menuItem.MenuItemId,
                Quantity = 2,
                UnitPriceAtSale = 25m
            });
        }

        // Create 1 sale yesterday: €50
        var yestSale = new Sale { SaleDateTime = now.AddDays(-1).AddHours(12), Status = "paidbycard" };
        db.Sales.Add(yestSale);
        await db.SaveChangesAsync();
        db.SaleItems.Add(new SaleItem
        {
            SaleId = yestSale.SaleId,
            MenuItemId = menuItem.MenuItemId,
            Quantity = 2,
            UnitPriceAtSale = 25m
        });

        // Create 1 cancelled sale today — should NOT be counted
        var cancelledSale = new Sale { SaleDateTime = now.AddHours(14), Status = "canceled" };
        db.Sales.Add(cancelledSale);
        await db.SaveChangesAsync();
        db.SaleItems.Add(new SaleItem
        {
            SaleId = cancelledSale.SaleId,
            MenuItemId = menuItem.MenuItemId,
            Quantity = 10,
            UnitPriceAtSale = 25m
        });

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Validates that TodaySales correctly sums only today's non-cancelled sales.
    /// </summary>
    [Fact]
    public async Task GetDashboardData_ShouldCalculateTodaySales()
    {
        using var db = CreateInMemoryDb();
        await SeedSalesData(db);

        var service = new DashboardService(db);
        var result = await service.GetDashboardDataAsync();

        // 3 sales today × (2 items × €25) = €150
        Assert.Equal(150m, result.TodaySales);
    }

    /// <summary>
    /// Validates that yesterday's sales are correctly isolated.
    /// </summary>
    [Fact]
    public async Task GetDashboardData_ShouldCalculateYesterdaySales()
    {
        using var db = CreateInMemoryDb();
        await SeedSalesData(db);

        var service = new DashboardService(db);
        var result = await service.GetDashboardDataAsync();

        // 1 sale yesterday: 2 × €25 = €50
        Assert.Equal(50m, result.YesterdaySales);
    }

    /// <summary>
    /// Validates that cancelled sales are excluded from all KPI calculations.
    /// </summary>
    [Fact]
    public async Task GetDashboardData_ShouldExcludeCancelledSales()
    {
        using var db = CreateInMemoryDb();
        await SeedSalesData(db);

        var service = new DashboardService(db);
        var result = await service.GetDashboardDataAsync();

        // Cancelled sale was for 10 items × €25 = €250
        // If included, TodaySales would be €400 instead of €150
        Assert.Equal(150m, result.TodaySales);
    }

    /// <summary>
    /// Validates that the DailyTrend list contains exactly 30 entries
    /// (one per day for the last 30 days).
    /// </summary>
    [Fact]
    public async Task GetDashboardData_ShouldReturnThirtyDayTrend()
    {
        using var db = CreateInMemoryDb();
        await SeedSalesData(db);

        var service = new DashboardService(db);
        var result = await service.GetDashboardDataAsync();

        Assert.Equal(30, result.DailyTrend.Count);
    }
}
