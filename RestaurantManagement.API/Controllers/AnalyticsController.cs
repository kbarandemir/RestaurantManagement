using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _service;

    public AnalyticsController(IAnalyticsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string period = "30d", CancellationToken ct = default)
    {
        var data = await _service.GetAnalyticsAsync(period, ct);
        return Ok(data);
    }
}
