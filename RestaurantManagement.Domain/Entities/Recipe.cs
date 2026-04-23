namespace RestaurantManagement.Domain.Entities;

public class Recipe
{
    public int RecipeId { get; set; }

    public int MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    // Additional Frontend Display Details
    public string? PrepTime { get; set; }
    public int? Servings { get; set; }
    public string? Instructions { get; set; } // Stored as a JSON array string typically

    public ICollection<RecipeItem> Items { get; set; } = new List<RecipeItem>();
    public DateTime CreatedAt { get; set; }
}
