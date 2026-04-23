using System;
using System.ComponentModel.DataAnnotations;

namespace RestaurantManagement.Application.DTOs.Reservations
{
    public class ReservationDto
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CustomerEmail { get; set; }
        public DateTime ReservationDate { get; set; }
        public int NumberOfGuests { get; set; }
        public string? TableNumber { get; set; }
        public string Status { get; set; } = "Pending";
        public string? SpecialRequests { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateReservationDto
    {
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string CustomerPhone { get; set; } = string.Empty;

        [EmailAddress]
        public string? CustomerEmail { get; set; }

        [Required]
        public DateTime ReservationDate { get; set; }

        [Range(1, 100)]
        public int NumberOfGuests { get; set; }

        public string? TableNumber { get; set; }

        public string? SpecialRequests { get; set; }
    }

    public class UpdateReservationDto
    {
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string CustomerPhone { get; set; } = string.Empty;

        [EmailAddress]
        public string? CustomerEmail { get; set; }

        [Required]
        public DateTime ReservationDate { get; set; }

        [Range(1, 100)]
        public int NumberOfGuests { get; set; }

        public string? TableNumber { get; set; }

        public string Status { get; set; } = "Pending";

        public string? SpecialRequests { get; set; }
    }
}
