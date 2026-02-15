namespace RestaurantManagement.Domain.Entities;

public class MenuItem
{
    public int MenuItemId { get; set; }
    public string Name { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    
}
