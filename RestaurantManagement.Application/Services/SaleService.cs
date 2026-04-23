using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Sales;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Services;

/// <summary>
/// Service responsible for Point-of-Sale (POS) transactions.
///
/// Core algorithm: FEFO (First Expired, First Out) Inventory Deduction
/// ─────────────────────────────────────────────────────────────────────
/// When a sale is created, the system:
///   1. Resolves each menu item's active recipe to determine ingredient requirements
///   2. Calculates total ingredient quantities needed (recipe qty × sale qty)
///   3. Allocates stock from IngredientBatches sorted by ExpiryDate ascending
///      → Batches expiring soonest are consumed first (FEFO)
///   4. If a batch is fully depleted, the remaining need spills to the next batch
///   5. Creates StockMovement records of type "OUT" for each allocation (audit trail)
///   6. Throws ArgumentException if total available stock is insufficient
///
/// The entire operation runs in a database transaction — either all steps
/// succeed or none do, ensuring data consistency.
/// </summary>

public sealed class SaleService : ISaleService
{
    private readonly IAppDbContext _db;

    public SaleService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SaleListItemDto>> GetAllAsync(CancellationToken ct = default)
    {
        var sales = await _db.Sales.AsNoTracking()
            .Include(s => s.Items)
                .ThenInclude(i => i.MenuItem)
            .OrderByDescending(s => s.SaleDateTime)
            .Select(s => new SaleListItemDto
            {
                SaleId = s.SaleId,
                SaleDateTime = s.SaleDateTime,
                Status = s.Status,
                TableNo = s.TableNo,
                CreatedByUserId = s.CreatedByUserId,
                ItemCount = s.Items.Count,
                TotalAmount = s.Items.Sum(i => i.Quantity * i.UnitPriceAtSale),
                Items = s.Items.Select(i => new SaleItemDto
                {
                    SaleItemId = i.SaleItemId,
                    MenuItemId = i.MenuItemId,
                    MenuItemName = i.MenuItem.Name,
                    Quantity = i.Quantity,
                    UnitPriceAtSale = i.UnitPriceAtSale
                }).ToList()
            })
            .ToListAsync(ct);
            
        return sales;
    }

    public async Task<SaleDetailDto?> GetByIdAsync(int saleId, CancellationToken ct = default)
    {
        var sale = await _db.Sales.AsNoTracking()
            .Include(s => s.Items)
                .ThenInclude(i => i.MenuItem)
            .Where(s => s.SaleId == saleId)
            .Select(s => new SaleDetailDto(
                s.SaleId,
                s.SaleDateTime,
                s.Status,
                s.TableNo,
                s.CreatedByUserId,
                s.Items.Select(i => new SaleItemDto
                {
                    SaleItemId = i.SaleItemId,
                    MenuItemId = i.MenuItemId,
                    MenuItemName = i.MenuItem.Name,
                    Quantity = i.Quantity,
                    UnitPriceAtSale = i.UnitPriceAtSale
                }).ToList(),
                s.Items.Sum(i => i.Quantity * i.UnitPriceAtSale)
            ))
            .FirstOrDefaultAsync(ct);

        return sale;
    }

    public async Task<bool> UpdateSaleStatusAsync(int saleId, string status, CancellationToken ct = default)
    {
        var validStatuses = new[] { "active", "paidbycash", "paidbycard", "canceled", "paidbygiftcard" };
        if (!validStatuses.Contains(status))
            throw new ArgumentException("Invalid status.");

        var sale = await _db.Sales.FindAsync(new object[] { saleId }, ct);
        if (sale is null) return false;

        sale.Status = status;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> CreateSaleAsync(CreateSaleDto dto, CancellationToken ct = default)
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

        // Allow sales of menu items that don't have recipes (e.g., direct items or drinks)
        // No exception is thrown if a recipe is missing.

        var recipeIds = recipeByMenuItem.Values.Select(r => r.RecipeId).Distinct().ToList();

        var recipeItems = await _db.RecipeItems
            .Where(ri => recipeIds.Contains(ri.RecipeId))
            .AsNoTracking()
            .ToListAsync(ct);

        // 3) Create Sale header
        var sale = new Sale
        {
            SaleDateTime = DateTime.UtcNow,
            CreatedByUserId = dto.CreatedByUserId,
            TableNo = dto.TableNo,
            Status = "active"
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
            if (recipeByMenuItem.TryGetValue(item.MenuItemId, out var recipe))
            {
                var items = recipeItems.Where(x => x.RecipeId == recipe.RecipeId);

                foreach (var ri in items)
                {
                    var need = ri.QuantityPerUnit * item.Quantity;
                    if (required.ContainsKey(ri.IngredientId)) required[ri.IngredientId] += need;
                    else required[ri.IngredientId] = need;
                }
            }
        }

        // 6) FEFO allocation per ingredient
        foreach (var (ingredientId, neededTotal) in required)
        {
            var remainingNeed = neededTotal;

            var batches = await _db.IngredientBatches
                .Where(b => b.IngredientId == ingredientId && b.IsActive && b.QuantityOnHand > 0 && b.ExpiryDate > DateTime.UtcNow)
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
