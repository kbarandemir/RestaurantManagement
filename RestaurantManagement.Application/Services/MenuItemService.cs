using RestaurantManagement.Application.DTOs.MenuItems;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace RestaurantManagement.Application.Services;

public sealed class MenuItemService : IMenuItemService
{
    private readonly IAppDbContext _db;
    public MenuItemService(IAppDbContext db) {
        _db = db;
    }

    public async Task<List<MenuItemListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var q = _db.MenuItems.AsNoTracking();
        if (!includeInactive) q = q.Where(x => x.IsActive);

        return await q.OrderBy(x => x.Name)
            .Select(x => new MenuItemListItemDto(x.MenuItemId, x.Name, x.Price, x.IsActive, x.CategoryId, x.Category.Name))
            .ToListAsync(ct);
    }

    public async Task<MenuItemDetailDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.MenuItems.AsNoTracking()
            .Where(x => x.MenuItemId == id)
            .Select(x => new MenuItemDetailDto(x.MenuItemId, x.Name, x.Price, x.CreatedAt, x.IsActive, x.CategoryId))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> CreateAsync(CreateMenuItemDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name is required.");
        if (dto.Name.Length > 100) throw new ArgumentException("Name is too long (max 100).");
        if (dto.Price < 0) throw new ArgumentException("Price cannot be negative.");

        var entity = new MenuItem
        {
            Name = dto.Name.Trim(),
            Price = dto.Price,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            CategoryId = dto.CategoryId
        };

        _db.MenuItems.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.MenuItemId;
    }

    public async Task<bool> UpdateAsync(int id, UpdateMenuItemDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name is required.");
        if (dto.Name.Length > 100) throw new ArgumentException("Name is too long (max 100).");
        if (dto.Price < 0) throw new ArgumentException("Price cannot be negative.");

        var entity = await _db.MenuItems.FirstOrDefaultAsync(x => x.MenuItemId == id, ct);
        if (entity is null) return false;

        entity.Name = dto.Name.Trim();
        entity.Price = dto.Price;
        entity.IsActive = dto.IsActive;
        entity.CategoryId = dto.CategoryId;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeactivateAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.MenuItems.FirstOrDefaultAsync(x => x.MenuItemId == id, ct);
        if (entity is null) return false;

        entity.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}