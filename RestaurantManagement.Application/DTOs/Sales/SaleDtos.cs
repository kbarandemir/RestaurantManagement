namespace RestaurantManagement.Application.DTOs.Sales;

public sealed class CreateSaleDto
{
    public string? TableNo { get; set; }
    public int? CreatedByUserId { get; set; }
    public List<CreateSaleItemDto> Items { get; set; } = new();
}

public sealed class CreateSaleItemDto
{
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
}

public sealed class SaleListItemDto
{
    public int SaleId { get; set; }
    public DateTime SaleDateTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? TableNo { get; set; }
    public int? CreatedByUserId { get; set; }
    public int ItemCount { get; set; }
    public decimal TotalAmount { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
}

public sealed class SaleItemDto
{
    public int SaleItemId { get; set; }
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPriceAtSale { get; set; }
}

public sealed record SaleDetailDto(
    int SaleId,
    DateTime SaleDateTime,
    string Status,
    string? TableNo,
    int? CreatedByUserId,
    List<SaleItemDto> Items,
    decimal TotalAmount
);
