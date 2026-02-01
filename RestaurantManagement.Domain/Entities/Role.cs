namespace RestaurantManagement.Domain.Entities;

public class Role
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
