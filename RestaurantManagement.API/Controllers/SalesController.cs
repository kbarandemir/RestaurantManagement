using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Sales;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class SalesController : ControllerBase
{
    private readonly ISaleService _service;
    public SalesController(ISaleService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => (await _service.GetByIdAsync(id, ct)) is { } s ? Ok(s) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSaleDto dto, CancellationToken ct)
    {
        try
        {
            var saleId = await _service.CreateAsync(dto, ct);
            return Ok(new { saleId });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        
    }
}
