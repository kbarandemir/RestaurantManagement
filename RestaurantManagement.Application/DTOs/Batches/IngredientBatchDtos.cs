namespace RestaurantManagement.Application.DTOs.Batches;

public sealed record IngredientBatchDto(
    int BatchId,
    int IngredientId,
    int? InvoiceId,
    decimal QuantityOnHand,
    decimal? UnitCost,
    DateTime ReceivedDate,
    DateTime ExpiryDate,
    bool IsActive
);

public sealed class CreateIngredientBatchDto
{
    public int IngredientId { get; set; }
    public int? InvoiceId { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal? UnitCost { get; set; }
    public DateTime ReceivedDate { get; set; }
    public DateTime ExpiryDate { get; set; }
}
