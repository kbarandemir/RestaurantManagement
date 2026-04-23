using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Reservations;
using RestaurantManagement.Application.Interfaces;
using System;
using System.Threading.Tasks;

namespace RestaurantManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService _reservationService;

        public ReservationsController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Chef,Waiter,Head Chef,Staff")]
        public async Task<IActionResult> GetAll()
        {
            var reservations = await _reservationService.GetAllAsync();
            return Ok(reservations);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Chef,Waiter,Head Chef,Staff")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var reservation = await _reservationService.GetByIdAsync(id);
            if (reservation == null) return NotFound();
            return Ok(reservation);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _reservationService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReservationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var updated = await _reservationService.UpdateAsync(id, dto);
            if (updated == null) return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _reservationService.DeleteAsync(id);
            if (!deleted) return NotFound();

            return NoContent();
        }
    }
}
