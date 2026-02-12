using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Recipes;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RecipesController : ControllerBase
{
    private readonly IRecipeService _service;
    public RecipesController(IRecipeService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => (await _service.GetByIdAsync(id, ct)) is { } r ? Ok(r) : NotFound();

    [HttpGet("by-menuitem/{menuItemId:int}")]
    public async Task<IActionResult> GetActiveByMenuItemId(int menuItemId, CancellationToken ct)
        => (await _service.GetActiveByMenuItemIdAsync(menuItemId, ct)) is { } r ? Ok(r) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRecipeDto dto, CancellationToken ct)
    {
        try
        {
            var id = await _service.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id }, new { recipeId = id });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRecipeDto dto, CancellationToken ct)
    {
        try
        {
            var ok = await _service.UpdateAsync(id, dto, ct);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct)
        => await _service.DeactivateAsync(id, ct) ? NoContent() : NotFound();
}
