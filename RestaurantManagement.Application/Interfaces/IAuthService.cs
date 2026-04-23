using RestaurantManagement.Application.DTOs.Auth;

namespace RestaurantManagement.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default);
    Task<LoginResult> LoginAsync(LoginRequestDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> ChangePasswordAsync(ChangePasswordRequestDto dto, CancellationToken ct = default);
    Task<bool> UpdatePasswordAsync(int userId, UpdatePasswordRequestDto dto, CancellationToken ct = default);
}
