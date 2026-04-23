using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Roster;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[Microsoft.AspNetCore.Authorization.Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class RosterController : ControllerBase
{
    private readonly IRosterService _service;
    public RosterController(IRosterService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetWeek([FromQuery] DateTime weekStart, CancellationToken ct)
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value 
            ?? User.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
        
        var includeUnpublished = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) 
                              || string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase);
        
        return Ok(await _service.GetWeekAsync(DateOnly.FromDateTime(weekStart), includeUnpublished, ct));
    }

    [HttpPost("publish")]
    public async Task<IActionResult> PublishWeek([FromQuery] DateTime weekStart, CancellationToken ct)
    {
        var count = await _service.PublishWeekAsync(DateOnly.FromDateTime(weekStart), ct);
        return Ok(new { publishedCount = count });
    }

    [HttpPost("unpublish")]
    public async Task<IActionResult> UnpublishWeek([FromQuery] DateTime weekStart, CancellationToken ct)
    {
        var count = await _service.UnpublishWeekAsync(DateOnly.FromDateTime(weekStart), ct);
        return Ok(new { unpublishedCount = count });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShiftDto dto, CancellationToken ct)
    {
        try
        {
            var id = await _service.CreateShiftAsync(dto, ct);
            return CreatedAtAction(nameof(GetWeek), null, new { shiftId = id });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateShiftDto dto, CancellationToken ct)
    {
        try
        {
            var ok = await _service.UpdateShiftAsync(id, dto, ct);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteShiftAsync(id, ct) ? NoContent() : NotFound();
}
