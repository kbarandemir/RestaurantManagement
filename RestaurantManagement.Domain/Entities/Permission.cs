namespace RestaurantManagement.Domain.Entities;

public class Permission
{
    public int PermissionId { get; set; }
    public string PermissionKey { get; set; } = null!;
    public string? Description { get; set; } = null!;
    public string? ModuleName { get; set; } = null!;
    public ICollection<RolePermission> RolePermissions { get; set;} = new List<RolePermission>();
}
