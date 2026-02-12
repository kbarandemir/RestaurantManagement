namespace RestaurantManagement.Application.DTOs.Sales;

public sealed class CreateSaleDto
{
    public int? CreatedByUserId { get; set; }
    public List<CreateSaleItemDto> Items { get; set; } = new();
}

public sealed class CreateSaleItemDto
{
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
}

public sealed record SaleListItemDto(int SaleId, DateTime SaleDateTime, int? CreatedByUserId, int ItemCount);

public sealed record SaleItemDto(int SaleItemId, int MenuItemId, int Quantity, decimal UnitPriceAtSale);

public sealed record SaleDetailDto(
    int SaleId,
    DateTime SaleDateTime,
    int? CreatedByUserId,
    List<SaleItemDto> Items
);
