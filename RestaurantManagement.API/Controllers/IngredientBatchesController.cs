using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Batches;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class IngredientBatchesController : ControllerBase
{
    private readonly IIngredientBatchService _service;
    public IngredientBatchesController(IIngredientBatchService service)
    {
        _service = service;
    } 

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? ingredientId = null, [FromQuery] bool activeOnly = true, CancellationToken ct = default)
        => Ok(await _service.GetAllAsync(ingredientId, activeOnly, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIngredientBatchDto dto, CancellationToken ct)
    {
        try
        {
            var id = await _service.CreateAsync(dto, ct);
            return Ok(new { batchId = id });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
