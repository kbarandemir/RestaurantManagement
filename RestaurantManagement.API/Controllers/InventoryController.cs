using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class InventoryController : ControllerBase
{
    private readonly IInventoryService _service;
    public InventoryController(IInventoryService service) => _service = service;

    [HttpGet("ingredient/{ingredientId:int}")]
    public async Task<IActionResult> GetIngredient(int ingredientId, CancellationToken ct)
        => (await _service.GetIngredientInventoryAsync(ingredientId, ct)) is { } inv ? Ok(inv) : NotFound();
}
