namespace RestaurantManagement.Application.DTOs.Invoices;

public sealed class InvoiceItemDto
{
    public int IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public DateTime ExpiryDate { get; set; }
}

public sealed class InvoiceDto
{
    public int InvoiceId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal TotalCost { get; set; }
    public string? SupplierName { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public sealed class CreateInvoiceDto
{
    public DateTime Date { get; set; }
    public decimal TotalCost { get; set; }
    public string? SupplierName { get; set; }
    public List<IngredientBatchInput>? Batches { get; set; }
}

public sealed class IngredientBatchInput
{
    public int IngredientId { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal? UnitCost { get; set; }
    public DateTime ExpiryDate { get; set; }
}
