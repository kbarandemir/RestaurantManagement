using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Roster;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.Application.Services;

/// <summary>
/// Staff roster management service handling weekly shift scheduling.
///
/// Workflow:
///   1. Admin/Manager creates shifts for staff members on specific dates
///   2. Shifts are initially created as drafts (IsPublished = false)
///   3. When ready, the manager publishes the entire week's roster
///   4. Published shifts become visible to all staff via their profile
///   5. Editing a published shift resets it to draft status (requires re-publishing)
///
/// Key design decisions:
///   - Shifts belong to a specific User and Date (DateOnly for date-only storage)
///   - Time is stored as TimeOnly (StartTime/EndTime) for clean time-only representation
///   - The includeUnpublished flag in GetWeekAsync controls visibility by role
/// </summary>

public sealed class RosterService : IRosterService
{
    private readonly IAppDbContext _db;
    public RosterService(IAppDbContext db) => _db = db;

    public async Task<List<ShiftDto>> GetWeekAsync(DateOnly weekStart, bool includeUnpublished = false, CancellationToken ct = default)
    {
        var weekEnd = weekStart.AddDays(6);
        
        var query = _db.Shifts
            .Include(s => s.User)
            .ThenInclude(u => u.Role)
            .Where(s => s.Date >= weekStart && s.Date <= weekEnd);

        if (!includeUnpublished)
        {
            query = query.Where(s => s.IsPublished);
        }

        var shifts = await query
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .ToListAsync(ct);

        return shifts.Select(s => new ShiftDto(
            s.ShiftId,
            s.UserId,
            s.User.FirstName,
            s.User.LastName,
            s.User.Role.RoleName,
            s.Date,
            s.StartTime,
            s.EndTime,
            s.Note,
            s.IsPublished
        )).ToList();
    }

    public async Task<int> PublishWeekAsync(DateOnly weekStart, CancellationToken ct = default)
    {
        var weekEnd = weekStart.AddDays(6);
        var drafts = await _db.Shifts
            .Where(s => s.Date >= weekStart && s.Date <= weekEnd && !s.IsPublished)
            .ToListAsync(ct);

        foreach (var shift in drafts)
        {
            shift.IsPublished = true;
        }

        await _db.SaveChangesAsync(ct);
        return drafts.Count;
    }

    public async Task<int> CreateShiftAsync(CreateShiftDto dto, CancellationToken ct = default)
    {
        // Validate user exists
        var userExists = await _db.Users.AnyAsync(u => u.UserId == dto.UserId, ct);
        if (!userExists)
            throw new ArgumentException("User not found.");

        if (dto.EndTime <= dto.StartTime)
            throw new ArgumentException("End time must be after start time.");

        var shift = new Domain.Entities.Shift
        {
            UserId = dto.UserId,
            Date = dto.Date,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Note = dto.Note
        };

        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync(ct);
        return shift.ShiftId;
    }

    public async Task<bool> UpdateShiftAsync(int id, UpdateShiftDto dto, CancellationToken ct = default)
    {
        var shift = await _db.Shifts.FindAsync(new object[] { id }, ct);
        if (shift is null) return false;

        if (dto.EndTime <= dto.StartTime)
            throw new ArgumentException("End time must be after start time.");

        shift.StartTime = dto.StartTime;
        shift.EndTime = dto.EndTime;
        shift.Note = dto.Note;
        shift.IsPublished = false;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteShiftAsync(int id, CancellationToken ct = default)
    {
        var shift = await _db.Shifts.FindAsync(new object[] { id }, ct);
        if (shift is null) return false;

        _db.Shifts.Remove(shift);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> UnpublishWeekAsync(DateOnly weekStart, CancellationToken ct = default)
    {
        var weekEnd = weekStart.AddDays(6);
        var published = await _db.Shifts
            .Where(s => s.Date >= weekStart && s.Date <= weekEnd && s.IsPublished)
            .ToListAsync(ct);

        foreach (var shift in published)
        {
            shift.IsPublished = false;
        }

        await _db.SaveChangesAsync(ct);
        return published.Count;
    }
}
