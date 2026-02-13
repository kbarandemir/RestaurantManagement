namespace RestaurantManagement.Application.DTOs.Auth;

public sealed record RegisterRequestDto(
    string FullName,
    string Email,
    string Password,
    string? RoleName // optional, default role verilecek
);

public sealed record LoginRequestDto(
    string Email,
    string Password
);

public sealed record AuthUserDto(
    int UserId,
    string FullName,
    string Email,
    string RoleName
);

public sealed record AuthResponseDto(
    string AccessToken,
    AuthUserDto User
);
