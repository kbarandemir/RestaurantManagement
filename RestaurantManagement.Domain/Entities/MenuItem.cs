namespace RestaurantManagement.Domain.Entities;

public class MenuItem
{
    public int MenuItemId { get; set; }
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}
