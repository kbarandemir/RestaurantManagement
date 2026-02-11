namespace RestaurantManagement.Domain.Entities;

public class User
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public bool IsActive { get; set; } = true;
    public ICollection<Sale> SalesCreated { get; set; } = new List<Sale>();
    public ICollection<IngredientBatch> CreatedBatches { get; set; } = new List<IngredientBatch>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();

}
