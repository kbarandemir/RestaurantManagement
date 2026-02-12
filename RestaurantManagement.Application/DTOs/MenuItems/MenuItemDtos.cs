namespace RestaurantManagement.Application.DTOs.MenuItems;

public sealed record MenuItemListItemDto(int MenuItemId, string Name, decimal Price, bool IsActive);

public sealed record MenuItemDetailDto(int MenuItemId, string Name, decimal Price, DateTime CreatedAt, bool IsActive);

public sealed class CreateMenuItemDto
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
}

public sealed class UpdateMenuItemDto
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
}
