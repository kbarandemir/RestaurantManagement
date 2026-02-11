namespace RestaurantManagement.Domain.Entities;

public class IngredientBatch
{
    public int BatchId { get; set; }

    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
    public int? InvoiceId { get; set; }
    public Invoice? Invoice { get; set; } = null!;

    public decimal QuantityOnHand { get; set; }
    public decimal? UnitCost { get; set; }

    public DateTime ReceivedDate { get; set; }
    public DateTime ExpiryDate { get; set; }

    public bool IsActive { get; set; } = true;
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public int? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; } = null!;

}
