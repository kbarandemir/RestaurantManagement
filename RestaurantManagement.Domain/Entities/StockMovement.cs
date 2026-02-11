namespace RestaurantManagement.Domain.Entities;

public class StockMovement
{
    public int MovementId { get; set; }

    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;

    public int BatchId { get; set; }
    public IngredientBatch Batch { get; set; } = null!;

    // IN / OUT / ADJUSTMENT
    public string MovementType { get; set; } = null!;

    public decimal Quantity { get; set; }

    // SALE / DELIVERY / MANUAL
    public string ReferenceType { get; set; } = null!;
    public int ReferenceId { get; set; }

    public DateTime MovementDateTime { get; set; } = DateTime.UtcNow;
    
}
