using Moq;
using Xunit;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Application.Services;
using RestaurantManagement.Application.DTOs.Sales;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Tests;

/// <summary>
/// Unit tests for the SaleService — specifically the FEFO (First Expired, First Out)
/// inventory allocation algorithm used when creating a new sale.
///
/// The CreateSaleAsync method must:
///   1. Look up menu item prices
///   2. Resolve the active recipe for each menu item
///   3. Calculate total ingredient requirements (quantity × recipe items)
///   4. Allocate stock from IngredientBatches sorted by ExpiryDate (FEFO)
///   5. Record StockMovements for audit trail
///   6. Throw if insufficient stock exists
///
/// These tests use an in-memory database to isolate the FEFO logic from SQL Server.
/// </summary>
public class SaleServiceTests
{
    /// <summary>
    /// Helper: builds a fresh in-memory DbContext for each test
    /// to ensure complete test isolation (no shared state between tests).
    /// </summary>
    private static RestaurantManagement.Infrastructure.Data.AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<RestaurantManagement.Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique DB per test
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new RestaurantManagement.Infrastructure.Data.AppDbContext(options);
    }

    /// <summary>
    /// Seeds the in-memory database with the minimum data needed to test a sale:
    ///   - A role ("Waiter") and a user
    ///   - One menu item ("Burger", €10)
    ///   - One ingredient ("Beef Patty") with a recipe linking it to the Burger
    ///   - A configurable number of ingredient batches with FEFO-critical dates
    /// </summary>
    private static async Task SeedBasicData(
        RestaurantManagement.Infrastructure.Data.AppDbContext db,
        decimal batchQty1 = 10,
        decimal batchQty2 = 20,
        DateTime? expiry1 = null,
        DateTime? expiry2 = null)
    {
        // Role & User
        var role = new Role { RoleName = "Waiter" };
        db.Roles.Add(role);
        await db.SaveChangesAsync();

        db.Users.Add(new User
        {
            FirstName = "Test",
            LastName = "User",
            Email = "test@test.com",
            RoleId = role.RoleId,
            PasswordHash = "hash"
        });
        await db.SaveChangesAsync();

        // Menu item
        var category = new Category { Name = "Mains" };
        db.Set<Category>().Add(category);
        await db.SaveChangesAsync();

        var menuItem = new MenuItem { Name = "Burger", Price = 10m, CategoryId = category.CategoryId };
        db.MenuItems.Add(menuItem);
        await db.SaveChangesAsync();

        // Ingredient
        var ingredient = new Ingredient
        {
            Name = "Beef Patty",
            BaseUnit = "pcs"
        };
        db.Ingredients.Add(ingredient);
        await db.SaveChangesAsync();

        // Recipe: 1 Burger requires 1 Beef Patty
        var recipe = new Recipe
        {
            MenuItemId = menuItem.MenuItemId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Recipes.Add(recipe);
        await db.SaveChangesAsync();

        db.RecipeItems.Add(new RecipeItem
        {
            RecipeId = recipe.RecipeId,
            IngredientId = ingredient.IngredientId,
            QuantityPerUnit = 1 // 1 patty per burger
        });
        await db.SaveChangesAsync();

        // Ingredient batches — two batches with different expiry dates
        // FEFO means the batch expiring SOONEST should be consumed first
        db.IngredientBatches.Add(new IngredientBatch
        {
            IngredientId = ingredient.IngredientId,
            QuantityOnHand = batchQty1,
            UnitCost = 2.00m,
            ReceivedDate = DateTime.UtcNow.AddDays(-10),
            ExpiryDate = expiry1 ?? DateTime.UtcNow.AddDays(5),  // Expires SOONER
            IsActive = true
        });
        db.IngredientBatches.Add(new IngredientBatch
        {
            IngredientId = ingredient.IngredientId,
            QuantityOnHand = batchQty2,
            UnitCost = 2.50m,
            ReceivedDate = DateTime.UtcNow.AddDays(-5),
            ExpiryDate = expiry2 ?? DateTime.UtcNow.AddDays(30), // Expires LATER
            IsActive = true
        });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Verifies that FEFO allocation consumes from the batch with the
    /// earliest expiry date first, leaving the longer-life batch untouched.
    /// </summary>
    [Fact]
    public async Task CreateSale_ShouldAllocateFromEarliestExpiryBatchFirst()
    {
        // Arrange: batch1 has 10 units expiring in 5 days, batch2 has 20 units expiring in 30 days
        using var db = CreateInMemoryDb();
        await SeedBasicData(db, batchQty1: 10, batchQty2: 20);

        var service = new SaleService(db);

        var menuItem = await db.MenuItems.FirstAsync();
        var user = await db.Users.FirstAsync();

        // Act: sell 3 burgers (requires 3 beef patties)
        var saleId = await service.CreateSaleAsync(new CreateSaleDto
        {
            CreatedByUserId = user.UserId,
            TableNo = "T1",
            Items = new List<CreateSaleItemDto>
            {
                new() { MenuItemId = menuItem.MenuItemId, Quantity = 3 }
            }
        });

        // Assert: batch1 (expires sooner) should be reduced from 10 → 7
        var batches = await db.IngredientBatches
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        Assert.Equal(7, batches[0].QuantityOnHand);  // First-expiry batch: 10 - 3 = 7
        Assert.Equal(20, batches[1].QuantityOnHand);  // Later batch: untouched
    }

    /// <summary>
    /// Verifies that when one batch is fully depleted, the remaining
    /// requirement spills over to the next batch in FEFO order.
    /// </summary>
    [Fact]
    public async Task CreateSale_ShouldSpillOverToNextBatch_WhenFirstBatchDepleted()
    {
        // Arrange: batch1 has only 2 units, batch2 has 20 units
        using var db = CreateInMemoryDb();
        await SeedBasicData(db, batchQty1: 2, batchQty2: 20);

        var service = new SaleService(db);
        var menuItem = await db.MenuItems.FirstAsync();
        var user = await db.Users.FirstAsync();

        // Act: sell 5 burgers (needs 5 patties, but batch1 only has 2)
        await service.CreateSaleAsync(new CreateSaleDto
        {
            CreatedByUserId = user.UserId,
            TableNo = "T2",
            Items = new List<CreateSaleItemDto> { new() { MenuItemId = menuItem.MenuItemId, Quantity = 5 } }
        });

        // Assert: batch1 fully consumed (2→0), batch2 takes the overflow (20→17)
        var batches = await db.IngredientBatches
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        Assert.Equal(0, batches[0].QuantityOnHand);   // Fully depleted
        Assert.Equal(17, batches[1].QuantityOnHand);   // 20 - 3 = 17 (overflow)
    }

    /// <summary>
    /// Verifies that an ArgumentException is thrown when total available
    /// stock is less than what the sale requires — the sale must NOT proceed.
    /// </summary>
    [Fact]
    public async Task CreateSale_ShouldThrow_WhenInsufficientStock()
    {
        // Arrange: only 3 total units available across both batches
        using var db = CreateInMemoryDb();
        await SeedBasicData(db, batchQty1: 1, batchQty2: 2);

        var service = new SaleService(db);
        var menuItem = await db.MenuItems.FirstAsync();
        var user = await db.Users.FirstAsync();

        // Act & Assert: trying to sell 10 burgers should fail
        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateSaleAsync(new CreateSaleDto
            {
                CreatedByUserId = user.UserId,
                TableNo = "T3",
                Items = new List<CreateSaleItemDto> { new() { MenuItemId = menuItem.MenuItemId, Quantity = 10 } }
            })
        );
    }

    /// <summary>
    /// Verifies that each stock consumption creates a matching StockMovement
    /// record with type "OUT" for the audit trail.
    /// </summary>
    [Fact]
    public async Task CreateSale_ShouldCreateStockMovementRecords()
    {
        using var db = CreateInMemoryDb();
        await SeedBasicData(db, batchQty1: 10, batchQty2: 20);

        var service = new SaleService(db);
        var menuItem = await db.MenuItems.FirstAsync();
        var user = await db.Users.FirstAsync();

        // Act
        var saleId = await service.CreateSaleAsync(new CreateSaleDto
        {
            CreatedByUserId = user.UserId,
            TableNo = "T4",
            Items = new List<CreateSaleItemDto> { new() { MenuItemId = menuItem.MenuItemId, Quantity = 2 } }
        });

        // Assert: one OUT movement should exist for the allocation
        var movements = await db.StockMovements
            .Where(m => m.ReferenceId == saleId && m.ReferenceType == "SALE")
            .ToListAsync();

        Assert.Single(movements);
        Assert.Equal("OUT", movements[0].MovementType);
        Assert.Equal(2, movements[0].Quantity);
    }

    /// <summary>
    /// Verifies that a sale with an empty items list is rejected.
    /// </summary>
    [Fact]
    public async Task CreateSale_ShouldThrow_WhenNoItems()
    {
        using var db = CreateInMemoryDb();
        await SeedBasicData(db);

        var service = new SaleService(db);
        var user = await db.Users.FirstAsync();

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateSaleAsync(new CreateSaleDto
            {
                CreatedByUserId = user.UserId,
                TableNo = "T5",
                Items = new List<CreateSaleItemDto>() // Empty!
            })
        );
    }
}
