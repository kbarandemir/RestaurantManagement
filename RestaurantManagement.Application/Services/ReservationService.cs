using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Reservations;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services
{
    /// <summary>
    /// Reservation management service providing CRUD operations for table bookings.
    ///
    /// Reservation statuses: Pending → Confirmed → Completed (or Cancelled)
    ///   - New reservations default to "Pending" status
    ///   - Admin/Manager can update status through the lifecycle
    ///   - Each reservation tracks customer name, phone, email, guest count,
    ///     table number, and optional special requests
    ///   - Reservations use GUID primary keys for global uniqueness
    /// </summary>
    public class ReservationService : IReservationService
    {
        private readonly IAppDbContext _context;

        public ReservationService(IAppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ReservationDto>> GetAllAsync()
        {
            var reservations = await _context.Reservations
                .OrderBy(r => r.ReservationDate)
                .ToListAsync();

            return reservations.Select(MapToDto);
        }

        public async Task<ReservationDto?> GetByIdAsync(Guid id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null) return null;

            return MapToDto(reservation);
        }

        public async Task<ReservationDto> CreateAsync(CreateReservationDto dto)
        {
            var reservation = new Reservation
            {
                Id = Guid.NewGuid(),
                CustomerName = dto.CustomerName,
                CustomerPhone = dto.CustomerPhone,
                CustomerEmail = dto.CustomerEmail,
                ReservationDate = dto.ReservationDate,
                NumberOfGuests = dto.NumberOfGuests,
                TableNumber = dto.TableNumber,
                SpecialRequests = dto.SpecialRequests,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            return MapToDto(reservation);
        }

        public async Task<ReservationDto?> UpdateAsync(Guid id, UpdateReservationDto dto)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null) return null;

            reservation.CustomerName = dto.CustomerName;
            reservation.CustomerPhone = dto.CustomerPhone;
            reservation.CustomerEmail = dto.CustomerEmail;
            reservation.ReservationDate = dto.ReservationDate;
            reservation.NumberOfGuests = dto.NumberOfGuests;
            reservation.TableNumber = dto.TableNumber;
            reservation.Status = dto.Status;
            reservation.SpecialRequests = dto.SpecialRequests;
            reservation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(reservation);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null) return false;

            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync();

            return true;
        }

        private static ReservationDto MapToDto(Reservation reservation)
        {
            return new ReservationDto
            {
                Id = reservation.Id,
                CustomerName = reservation.CustomerName,
                CustomerPhone = reservation.CustomerPhone,
                CustomerEmail = reservation.CustomerEmail,
                ReservationDate = reservation.ReservationDate,
                NumberOfGuests = reservation.NumberOfGuests,
                TableNumber = reservation.TableNumber,
                Status = reservation.Status,
                SpecialRequests = reservation.SpecialRequests,
                CreatedAt = reservation.CreatedAt,
                UpdatedAt = reservation.UpdatedAt
            };
        }
    }
}
