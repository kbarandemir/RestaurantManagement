namespace RestaurantManagement.Domain.Entities;

public class Recipe
{
    public int RecipeId { get; set; }

    public int MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public ICollection<RecipeItem> Items { get; set; } = new List<RecipeItem>();
    public DateTime CreatedAt { get; set; }
}
