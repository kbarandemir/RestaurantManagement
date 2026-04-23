namespace RestaurantManagement.Application.DTOs.Users;

public sealed record UserListItemDto(
    int UserId,
    string FirstName,
    string LastName,
    string Email,
    int RoleId,
    string RoleName,
    bool IsActive,
    bool IsFirstLogin,
    DateTime CreatedAt
);

public sealed record UserDetailDto(
    int UserId,
    string FirstName,
    string LastName,
    string Email,
    int RoleId,
    string RoleName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

public sealed class CreateUserDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int RoleId { get; set; }
}

public sealed class UpdateUserDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? TaxId { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class ChangeUserRoleDto
{
    public int RoleId { get; set; }
}

public sealed record GeneratePasswordResponseDto(string TemporaryPassword);
