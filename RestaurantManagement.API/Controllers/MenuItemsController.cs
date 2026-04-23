using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.MenuItems;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MenuItemsController : ControllerBase
{
    private readonly IMenuItemService _service;
    public MenuItemsController(IMenuItemService service) {
        _service = service;
    } 

    [HttpGet]
    public async Task<ActionResult<List<MenuItemListItemDto>>> GetAll([FromQuery] bool includeInactive = false, CancellationToken ct = default)
        => Ok(await _service.GetAllAsync(includeInactive, ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
        => (await _service.GetByIdAsync(id, ct)) is { } item ? Ok(item) : NotFound();

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemDto dto, CancellationToken ct = default)
    {
        try
        {
            var id = await _service.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id }, new { menuItemId = id });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuItemDto dto, CancellationToken ct = default)
    {
        try { return await _service.UpdateAsync(id, dto, ct) ? NoContent() : NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct = default)
        => await _service.DeactivateAsync(id, ct) ? NoContent() : NotFound();

    [HttpGet("pos")]
    public async Task<ActionResult<List<MenuItemPosDto>>> GetActiveForPos(CancellationToken ct = default)
        => Ok(await _service.GetActiveForPosAsync(ct));
}
