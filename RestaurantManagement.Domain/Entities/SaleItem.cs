namespace RestaurantManagement.Domain.Entities;

public class SaleItem
{
    public int SaleItemId { get; set; }

    public int SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public int MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;

    public int Quantity { get; set; }
}
