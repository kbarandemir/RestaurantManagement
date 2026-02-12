using RestaurantManagement.Application.DTOs.Ingredients;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace RestaurantManagement.Application.Services;

public sealed class IngredientService : IIngredientService
{
    private readonly IAppDbContext _db;

    private static readonly HashSet<string> AllowedUnits = new(StringComparer.OrdinalIgnoreCase)
    {
        "PCS", "ML", "G"
    };

    public IngredientService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<IngredientListItemDto>> GetAllAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var q = _db.Ingredients.AsNoTracking();

        if (!includeInactive)
            q = q.Where(x => x.IsActive);

        return await q
            .OrderBy(x => x.Name)
            .Select(x => new IngredientListItemDto(x.IngredientId, x.Name, x.BaseUnit, x.IsActive))
            .ToListAsync(ct);
    }

    public async Task<IngredientDetailDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Ingredients.AsNoTracking()
            .Where(x => x.IngredientId == id)
            .Select(x => new IngredientDetailDto(x.IngredientId, x.Name, x.BaseUnit, x.IsActive))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> CreateAsync(CreateIngredientDto dto, CancellationToken ct = default)
    {
        Validate(dto.Name, dto.BaseUnit);

        var entity = new Ingredient
        {
            Name = dto.Name.Trim(),
            BaseUnit = dto.BaseUnit.Trim().ToUpperInvariant(),
            IsActive = true
        };

        _db.Ingredients.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.IngredientId;
    }

    public async Task<bool> UpdateAsync(int id, UpdateIngredientDto dto, CancellationToken ct = default)
    {
        Validate(dto.Name, dto.BaseUnit);

        var entity = await _db.Ingredients.FirstOrDefaultAsync(x => x.IngredientId == id, ct);
        if (entity is null) return false;

        entity.Name = dto.Name.Trim();
        entity.BaseUnit = dto.BaseUnit.Trim().ToUpperInvariant();
        entity.IsActive = dto.IsActive;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>
    /// Soft delete: IsActive = false.
    /// </summary>
    public async Task<bool> DeactivateAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Ingredients.FirstOrDefaultAsync(x => x.IngredientId == id, ct);
        if (entity is null) return false;

        entity.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static void Validate(string name, string baseUnit)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.");

        if (name.Length > 100)
            throw new ArgumentException("Name is too long (max 100).");

        if (string.IsNullOrWhiteSpace(baseUnit))
            throw new ArgumentException("BaseUnit is required (PCS/ML/G).");

        var unit = baseUnit.Trim().ToUpperInvariant();
        if (!AllowedUnits.Contains(unit))
            throw new ArgumentException("BaseUnit must be one of: PCS, ML, G.");
    }
}
