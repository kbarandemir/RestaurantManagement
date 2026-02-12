using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.InventoryRules;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class InventoryRulesController : ControllerBase
{
    private readonly IInventoryRuleService _service;
    public InventoryRulesController(IInventoryRuleService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) => Ok(await _service.GetAllAsync(ct));

    [HttpGet("by-ingredient/{ingredientId:int}")]
    public async Task<IActionResult> GetByIngredientId(int ingredientId, CancellationToken ct)
        => (await _service.GetByIngredientIdAsync(ingredientId, ct)) is { } r ? Ok(r) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertInventoryRuleDto dto, CancellationToken ct)
    {
        try
        {
            var id = await _service.UpsertAsync(dto, ct);
            return Ok(new { inventoryRulesId = id });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{inventoryRulesId:int}")]
    public async Task<IActionResult> Delete(int inventoryRulesId, CancellationToken ct)
        => await _service.DeleteAsync(inventoryRulesId, ct) ? NoContent() : NotFound();
}
