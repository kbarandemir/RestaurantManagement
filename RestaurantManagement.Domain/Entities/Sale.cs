namespace RestaurantManagement.Domain.Entities;

public class Sale
{
    public int SaleId { get; set; }

    public DateTime SaleDateTime { get; set; } = DateTime.UtcNow;

    public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
    public int? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; } = null!;
}
