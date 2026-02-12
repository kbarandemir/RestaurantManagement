namespace RestaurantManagement.Application.DTOs.Users;

public sealed record UserListItemDto(
    int UserId,
    string FullName,
    string Email,
    int RoleId,
    bool IsActive
);

public sealed record UserDetailDto(
    int UserId,
    string FullName,
    string Email,
    int RoleId,
    bool IsActive
);

public sealed class CreateUserDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int RoleId { get; set; }
}

public sealed class UpdateUserDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}

public sealed class ChangeUserRoleDto
{
    public int RoleId { get; set; }
}
