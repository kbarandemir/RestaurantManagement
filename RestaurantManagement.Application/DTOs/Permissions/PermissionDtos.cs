namespace RestaurantManagement.Application.DTOs.Permissions;

public sealed record PermissionDto(int PermissionId, string PermissionKey);

public sealed class CreatePermissionDto
{
    public string PermissionKey { get; set; } = null!;
}

public sealed class UpdatePermissionDto
{
    public string PermissionKey { get; set; } = null!;
}
