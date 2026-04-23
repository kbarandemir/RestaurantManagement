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

    public async Task<List<MenuItemPosDto>> GetActiveForPosAsync(CancellationToken ct = default)
    {
        // 1. Get all active menu items
        var items = await _db.MenuItems.AsNoTracking()
            .Where(x => x.IsActive)
            .Include(x => x.Category)
            .ToListAsync(ct);

        // 2. Get all active recipes + recipe items
        var activeRecipes = await _db.Recipes.AsNoTracking()
            .Where(r => r.IsActive)
            .Include(r => r.Items)
            .ToListAsync(ct);

        // 3. Get current available (active & non-expired) stock per ingredient
        var rawStock = await _db.IngredientBatches.AsNoTracking()
            .Where(b => b.IsActive && b.QuantityOnHand > 0 && b.ExpiryDate > DateTime.UtcNow)
            .Select(b => new { b.IngredientId, b.QuantityOnHand })
            .ToListAsync(ct);

        var stockPerIngredient = rawStock
            .GroupBy(b => b.IngredientId)
            .ToDictionary(g => g.Key, g => g.Sum(b => b.QuantityOnHand));

        // 4. Map to DTO and calculate availability
        var recipeLookup = activeRecipes
            .GroupBy(r => r.MenuItemId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.CreatedAt).First());

        return items.Select(m => {
            bool isAvailable = true;
            
            if (recipeLookup.TryGetValue(m.MenuItemId, out var recipe))
            {
                foreach (var ri in recipe.Items)
                {
                    var available = stockPerIngredient.GetValueOrDefault(ri.IngredientId, 0m);
                    if (available < ri.QuantityPerUnit)
                    {
                        isAvailable = false;
                        break;
                    }
                }
            }

            return new MenuItemPosDto
            {
                MenuItemId = m.MenuItemId,
                Name = m.Name,
                Price = m.Price,
                CategoryId = m.CategoryId,
                CategoryName = m.Category?.Name ?? "General",
                IsAvailable = isAvailable
            };
        }).ToList();
    }
}