namespace RestaurantManagement.Application.DTOs.Ingredients;

public sealed record IngredientListItemDto(
    int IngredientId,
    string Name,
    string BaseUnit,
    bool IsActive
);

public sealed record IngredientDetailDto(
    int IngredientId,
    string Name,
    string BaseUnit,
    bool IsActive
);

// 
public sealed class CreateIngredientDto
{
    public string Name { get; set; } = null!;
    public string BaseUnit { get; set; } = null!; // PCS / ML / G
}

public sealed class UpdateIngredientDto
{
    public string Name { get; set; } = null!;
    public string BaseUnit { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}
