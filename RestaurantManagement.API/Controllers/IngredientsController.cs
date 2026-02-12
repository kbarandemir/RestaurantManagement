using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Ingredients;
using RestaurantManagement.Application.Services;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class IngredientsController : ControllerBase
{
    private readonly IngredientService _service;

    public IngredientsController(IngredientService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<IngredientListItemDto>>> GetAll([FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var items = await _service.GetAllAsync(includeInactive, ct);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IngredientDetailDto>> GetById(int id, CancellationToken ct = default)
    {
        var item = await _service.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIngredientDto dto, CancellationToken ct = default)
    {
        try
        {
            var id = await _service.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id }, new { ingredientId = id });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateIngredientDto dto, CancellationToken ct = default)
    {
        try
        {
            var ok = await _service.UpdateAsync(id, dto, ct);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct = default)
    {
        var ok = await _service.DeactivateAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}
