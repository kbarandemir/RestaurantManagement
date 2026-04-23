namespace RestaurantManagement.Domain.Entities;

public class User
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? TaxId { get; set; }
    public string? PasswordHash { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public bool IsFirstLogin {get; set;} = true;
    public string? ActivationCode {get; set;}
    public DateTime? ActivationCodeExpiry {get; set;}
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    
    public ICollection<Sale> SalesCreated { get; set; } = new List<Sale>();
    public ICollection<IngredientBatch> CreatedBatches { get; set; } = new List<IngredientBatch>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();

}
