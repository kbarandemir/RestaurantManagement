namespace RestaurantManagement.Application.DTOs.Roster;

public sealed record ShiftDto(
    int ShiftId,
    int UserId,
    string FirstName,
    string LastName,
    string RoleName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Note,
    bool IsPublished
);

public sealed class CreateShiftDto
{
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Note { get; set; }
}

public sealed class UpdateShiftDto
{
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Note { get; set; }
}
