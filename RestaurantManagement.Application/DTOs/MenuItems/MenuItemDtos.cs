namespace RestaurantManagement.Application.DTOs.MenuItems;

public sealed record MenuItemListItemDto(int MenuItemId, string Name, decimal Price, bool IsActive, int CategoryId, string Category);

public sealed record MenuItemDetailDto(int MenuItemId, string Name, decimal Price, DateTime CreatedAt, bool IsActive, int CategoryId);

public sealed class CreateMenuItemDto
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
}

public sealed class UpdateMenuItemDto
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MenuItemPosDto
{
    public int MenuItemId { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public bool IsAvailable { get; set; } = true;
}