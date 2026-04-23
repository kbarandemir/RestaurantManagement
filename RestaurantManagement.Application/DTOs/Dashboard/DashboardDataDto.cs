namespace RestaurantManagement.Application.DTOs.Dashboard;

public class DashboardDataDto {
    public decimal TodaySales { get; set; }
    public decimal YesterdaySales { get; set; }

    public decimal ThisWeekSales { get; set; }
    public decimal LastWeekSales { get; set; }

    public decimal ThisMonthSales { get; set; }
    public decimal LastMonthSales { get; set; }

    public decimal YearlySales { get; set; }
    public decimal LastYearSales { get; set; }

    public List<DailySaleTrendDto> DailyTrend { get; set; } = new();
    public List<TrendingItemDto> TrendingItems { get; set; } = new();
}

public class DailySaleTrendDto {
    public string Day { get; set; } = "";
    public decimal Sales { get; set; }
}

public class MonthlySaleDto {
    public string Month { get; set; } = "";
    public decimal Sales { get; set; }
    public decimal PrevYear { get; set; }
}

public class TrendingItemDto {
    public int Rank { get; set; }
    public string Name { get; set; } = "";
    public int Orders { get; set; }
    public decimal Revenue { get; set; }
    public decimal Change { get; set; }
}
