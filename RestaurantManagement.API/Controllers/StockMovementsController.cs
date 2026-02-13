using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class StockMovementsController : ControllerBase
{
    private readonly IStockMovementService _service;
    public StockMovementsController(IStockMovementService service) {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int? ingredientId,
        [FromQuery] string? referenceType,
        [FromQuery] int? referenceId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
        => Ok(await _service.GetAsync(ingredientId, referenceType, referenceId, from, to, ct));
}
