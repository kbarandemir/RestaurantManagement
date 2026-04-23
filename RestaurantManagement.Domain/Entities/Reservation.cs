using System;
using System.ComponentModel.DataAnnotations;

namespace RestaurantManagement.Domain.Entities
{
    public class Reservation
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string CustomerName { get; set; } = null!;

        [Required]
        public string CustomerPhone { get; set; } = null!;

        public string? CustomerEmail { get; set; }

        public DateTime ReservationDate { get; set; }

        public int NumberOfGuests { get; set; }

        public string? TableNumber { get; set; }

        // "Pending", "Confirmed", "Cancelled", "Completed"
        public string Status { get; set; } = "Pending";

        public string? SpecialRequests { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
