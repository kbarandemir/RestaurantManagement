namespace RestaurantManagement.Application.DTOs.Auth;

public sealed record RegisterRequestDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? RoleName // Optional — defaults to "Waiter" if not specified
);

public sealed record LoginRequestDto(
    string Email,
    string Password
);

public sealed record AuthUserDto(
    int UserId,
    string FirstName,
    string LastName,
    string Email,
    string RoleName,
    string? PhoneNumber,
    string? Country,
    string? City,
    string? PostalCode,
    string? TaxId
);

public sealed record AuthResponseDto(
    string AccessToken,
    AuthUserDto User
);

// Returned from /api/auth/login — discriminates on RequiresPasswordChange
public sealed record LoginResult(
    bool RequiresPasswordChange,
    AuthResponseDto? Auth,       // populated on normal login
    string? ActivationCode,      // populated when RequiresPasswordChange = true
    string? Email                // echoed back for the change-password form
);

// Sent to /api/auth/change-password
public sealed record ChangePasswordRequestDto(
    string Email,
    string ActivationCode,   // the temporary password shown to the admin
    string NewPassword,
    string ConfirmPassword
);

public sealed record UpdatePasswordRequestDto(
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword
);