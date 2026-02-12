namespace RestaurantManagement.Application.DTOs.Invoices;

public sealed record InvoiceDto(int InvoiceId, DateTime InvoiceDate, decimal TotalCost, string? InvoicePictureUrl, string? SupplierName);

public sealed class CreateInvoiceDto
{
    public DateTime Date { get; set; }
    public decimal TotalCost { get; set; }
    public string? InvoicePictureUrl { get; set; }
    public string? SupplierName { get; set; }
}
