namespace RestaurantManagement.Application.DTOs.RolePermissions;

public sealed record RolePermissionDto(int RoleId, int PermissionId);

public sealed class AssignPermissionDto
{
    public int PermissionId { get; set; }
}
