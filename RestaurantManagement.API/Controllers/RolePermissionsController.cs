using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.RolePermissions;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/roles/{roleId:int}/permissions")]
public sealed class RolePermissionsController : ControllerBase
{
    private readonly IRolePermissionService _service;
    public RolePermissionsController(IRolePermissionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetByRole(int roleId, CancellationToken ct)
        => Ok(await _service.GetByRoleIdAsync(roleId, ct));

    [HttpPost("{permissionId:int}")]
    public async Task<IActionResult> Assign(int roleId, int permissionId, CancellationToken ct)
    {
        try
        {
            var created = await _service.AssignAsync(roleId, permissionId, ct);
            return created ? StatusCode(201) : NoContent(); // already existed
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{permissionId:int}")]
    public async Task<IActionResult> Remove(int roleId, int permissionId, CancellationToken ct)
        => await _service.RemoveAsync(roleId, permissionId, ct) ? NoContent() : NotFound();
}
