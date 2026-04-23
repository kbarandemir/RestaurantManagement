namespace RestaurantManagement.Domain.Entities;

public class Invoice
{
    public int InvoiceId { get; set; }
    public DateTime Date { get; set; }
    public decimal TotalCost { get; set; }
    public string? SupplierName { get; set; }
    public ICollection<IngredientBatch> IngredientBatches { get; set; } = new List<IngredientBatch>();
}
