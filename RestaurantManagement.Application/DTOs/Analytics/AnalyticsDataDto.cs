namespace RestaurantManagement.Application.DTOs.Analytics;

public class AnalyticsDataDto
{
    public List<ProductPerformanceDto> Products { get; set; } = new();
    public List<StaffPerformanceDto> Staff { get; set; } = new();
    public List<HourlyRevenueDto> HourlyRevenue { get; set; } = new();
    public List<ForecastDto> Forecast { get; set; } = new();
    public List<ChannelDataDto> Channels { get; set; } = new();
}

public class ProductPerformanceDto
{
    public string Name { get; set; } = "";
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
    public int Margin { get; set; }
}

public class StaffPerformanceDto
{
    public string Name { get; set; } = "";
    public int Tables { get; set; }
    public decimal Revenue { get; set; }
    public string Rating { get; set; } = "0.0";
}

public class HourlyRevenueDto
{
    public string Hour { get; set; } = "";
    public decimal Revenue { get; set; }
}

public class ForecastDto
{
    public string Month { get; set; } = "";
    public decimal? Actual { get; set; }
    public decimal Forecast { get; set; }
}

public class ChannelDataDto
{
    public string Name { get; set; } = "";
    public int Value { get; set; }
}
