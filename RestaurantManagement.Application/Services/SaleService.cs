using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Sales;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

public sealed class SaleService : ISaleService
{
    private readonly IAppDbContext _db;

    public SaleService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SaleListItemDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Sales.AsNoTracking()
            .OrderByDescending(s => s.SaleDateTime)
            .Select(s => new SaleListItemDto(
                s.SaleId,
                s.SaleDateTime,
                s.CreatedByUserId,
                _db.SaleItems.Count(si => si.SaleId == s.SaleId)
            ))
            .ToListAsync(ct);
    }

    public async Task<SaleDetailDto?> GetByIdAsync(int saleId, CancellationToken ct = default)
    {
        var sale = await _db.Sales.AsNoTracking()
            .Where(s => s.SaleId == saleId)
            .Select(s => new { s.SaleId, s.SaleDateTime, s.CreatedByUserId })
            .FirstOrDefaultAsync(ct);

        if (sale is null) return null;

        var items = await _db.SaleItems.AsNoTracking()
            .Where(si => si.SaleId == saleId)
            .OrderBy(si => si.SaleItemId)
            .Select(si => new SaleItemDto(si.SaleItemId, si.MenuItemId, si.Quantity, si.UnitPriceAtSale))
            .ToListAsync(ct);

        return new SaleDetailDto(sale.SaleId, sale.SaleDateTime, sale.CreatedByUserId, items);
    }

    public async Task<int> CreateAsync(CreateSaleDto dto, CancellationToken ct = default)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            throw new ArgumentException("Sale must contain at least one item.");

        if (dto.Items.Any(i => i.Quantity <= 0))
            throw new ArgumentException("Sale item quantity must be > 0.");

        // Transaction: requires DbContext. IAppDbContext is implemented by AppDbContext (DbContext).
        var ef = (DbContext)_db;

        await using var tx = await ef.Database.BeginTransactionAsync(ct);

        // 1) Load menu items (for price + isactive)
        var menuItemIds = dto.Items.Select(i => i.MenuItemId).Distinct().ToList();

        var menuItems = await _db.MenuItems
            .Where(m => menuItemIds.Contains(m.MenuItemId) && m.IsActive)
            .ToDictionaryAsync(m => m.MenuItemId, ct);

        if (menuItems.Count != menuItemIds.Count)
            throw new ArgumentException("One or more MenuItemId values are invalid/inactive.");

        // 2) Load latest active recipes per menu item
        var activeRecipes = await _db.Recipes
            .Where(r => menuItemIds.Contains(r.MenuItemId) && r.IsActive)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        var recipeByMenuItem = activeRecipes
            .GroupBy(r => r.MenuItemId)
            .ToDictionary(g => g.Key, g => g.First());

        if (recipeByMenuItem.Count != menuItemIds.Count)
            throw new ArgumentException("Active recipe not found for one or more menu items.");

        var recipeIds = recipeByMenuItem.Values.Select(r => r.RecipeId).Distinct().ToList();

        var recipeItems = await _db.RecipeItems
            .Where(ri => recipeIds.Contains(ri.RecipeId))
            .AsNoTracking()
            .ToListAsync(ct);

        // 3) Create Sale header
        var sale = new Sale
        {
            SaleDateTime = DateTime.UtcNow,
            CreatedByUserId = dto.CreatedByUserId
        };
        _db.Sales.Add(sale);
        await _db.SaveChangesAsync(ct);

        // 4) Create SaleItems
        foreach (var item in dto.Items)
        {
            var menu = menuItems[item.MenuItemId];

            _db.SaleItems.Add(new SaleItem
            {
                SaleId = sale.SaleId,
                MenuItemId = item.MenuItemId,
                Quantity = item.Quantity,
                UnitPriceAtSale = menu.Price
            });
        }
        await _db.SaveChangesAsync(ct);

        // 5) Compute required ingredient quantities
        // ingredientId -> required quantity
        var required = new Dictionary<int, decimal>();

        foreach (var item in dto.Items)
        {
            var recipe = recipeByMenuItem[item.MenuItemId];
            var items = recipeItems.Where(x => x.RecipeId == recipe.RecipeId);

            foreach (var ri in items)
            {
                var need = ri.QuantityPerUnit * item.Quantity;
                if (required.ContainsKey(ri.IngredientId)) required[ri.IngredientId] += need;
                else required[ri.IngredientId] = need;
            }
        }

        // 6) FEFO allocation per ingredient
        foreach (var (ingredientId, neededTotal) in required)
        {
            var remainingNeed = neededTotal;

            var batches = await _db.IngredientBatches
                .Where(b => b.IngredientId == ingredientId && b.IsActive && b.QuantityOnHand > 0)
                .OrderBy(b => b.ExpiryDate)   // FEFO
                .ThenBy(b => b.ReceivedDate)
                .ToListAsync(ct);

            var availableTotal = batches.Sum(b => b.QuantityOnHand);
            if (availableTotal < remainingNeed)
                throw new ArgumentException(
                    $"Insufficient stock for IngredientId={ingredientId}. Needed={remainingNeed}, Available={availableTotal}");

            foreach (var batch in batches)
            {
                if (remainingNeed <= 0) break;

                var consume = Math.Min(batch.QuantityOnHand, remainingNeed);
                batch.QuantityOnHand -= consume;

                _db.StockMovements.Add(new StockMovement
                {
                    IngredientId = ingredientId,
                    BatchId = batch.BatchId,
                    MovementType = "OUT",
                    Quantity = consume,
                    MovementDateTime = DateTime.UtcNow,
                    ReferenceType = "SALE",
                    ReferenceId = sale.SaleId,
                    CreatedByUserId = dto.CreatedByUserId
                });

                remainingNeed -= consume;
            }

            // optional: deactivate empty batches
            foreach (var b in batches.Where(x => x.QuantityOnHand <= 0))
                b.IsActive = false;

            await _db.SaveChangesAsync(ct);
        }

        await tx.CommitAsync(ct);
        return sale.SaleId;
    }
}
