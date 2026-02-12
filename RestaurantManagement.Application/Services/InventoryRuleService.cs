using RestaurantManagement.Application.DTOs.InventoryRules;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace RestaurantManagement.Application.Services;

public sealed class InventoryRuleService : IInventoryRuleService
{
    private readonly IAppDbContext _db;
    public InventoryRuleService(IAppDbContext db) => _db = db;

    public async Task<List<InventoryRuleDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.InventoryRules.AsNoTracking()
            .OrderBy(x => x.IngredientId)
            .Select(x => new InventoryRuleDto(x.InventoryRuleId, x.IngredientId, x.ReorderLevel, x.ExpiryAlertDays))
            .ToListAsync(ct);
    }

    public async Task<InventoryRuleDto?> GetByIngredientIdAsync(int ingredientId, CancellationToken ct = default)
    {
        return await _db.InventoryRules.AsNoTracking()
            .Where(x => x.IngredientId == ingredientId)
            .Select(x => new InventoryRuleDto(x.InventoryRuleId, x.IngredientId, x.ReorderLevel, x.ExpiryAlertDays))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> UpsertAsync(UpsertInventoryRuleDto dto, CancellationToken ct = default)
    {
        if (dto.ReorderLevel < 0) throw new ArgumentException("ReorderLevel cannot be negative.");
        if (dto.ExpiryAlertDays < 0) throw new ArgumentException("ExpiryAlertDays cannot be negative.");

        var ingredientExists = await _db.Ingredients.AnyAsync(i => i.IngredientId == dto.IngredientId, ct);
        if (!ingredientExists) throw new ArgumentException("IngredientId not found.");

        var rule = await _db.InventoryRules.FirstOrDefaultAsync(x => x.IngredientId == dto.IngredientId, ct);

        if (rule is null)
        {
            rule = new InventoryRule
            {
                IngredientId = dto.IngredientId,
                ReorderLevel = dto.ReorderLevel,
                ExpiryAlertDays = dto.ExpiryAlertDays
            };
            _db.InventoryRules.Add(rule);
        }
        else
        {
            rule.ReorderLevel = dto.ReorderLevel;
            rule.ExpiryAlertDays = dto.ExpiryAlertDays;
        }

        await _db.SaveChangesAsync(ct);
        return rule.InventoryRuleId;
    }

    public async Task<bool> DeleteAsync(int inventoryRulesId, CancellationToken ct = default)
    {
        var rule = await _db.InventoryRules.FirstOrDefaultAsync(x => x.InventoryRuleId == inventoryRulesId, ct);
        if (rule is null) return false;

        _db.InventoryRules.Remove(rule);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}