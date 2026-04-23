using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RestaurantManagement.Application.DTOs.Reservations;

namespace RestaurantManagement.Application.Interfaces
{
    public interface IReservationService
    {
        Task<IEnumerable<ReservationDto>> GetAllAsync();
        Task<ReservationDto?> GetByIdAsync(Guid id);
        Task<ReservationDto> CreateAsync(CreateReservationDto dto);
        Task<ReservationDto?> UpdateAsync(Guid id, UpdateReservationDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
