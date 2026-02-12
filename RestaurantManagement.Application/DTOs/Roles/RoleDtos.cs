namespace RestaurantManagement.Application.DTOs.Roles;

public sealed record RoleDto(int RoleId, string RoleName);

public sealed class CreateRoleDto
{
    public string RoleName { get; set; } = null!;
}

public sealed class UpdateRoleDto
{
    public string RoleName { get; set; } = null!;
}
