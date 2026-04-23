using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Ensure the database schema is up to date
        await db.Database.MigrateAsync();

        // Skip seeding if data already exists (simple idempotency check)
        if (await db.Ingredients.AnyAsync() || await db.MenuItems.AnyAsync())
            return;

        // -------------------------
        // Ingredients
        // -------------------------
        var dough = new Ingredient { Name = "Dough", BaseUnit = "PCS", IsActive = true };
        var sauce = new Ingredient { Name = "Pizza Sauce", BaseUnit = "ML", IsActive = true };
        var cheese = new Ingredient { Name = "Cheese", BaseUnit = "G", IsActive = true };

        db.Ingredients.AddRange(dough, sauce, cheese);
        await db.SaveChangesAsync();

        // -------------------------
        // MenuItem
        // -------------------------
        var pizza = new MenuItem
        {
            Name = "Pizza",
            Price = 12.50m,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        db.MenuItems.Add(pizza);
        await db.SaveChangesAsync();

        // -------------------------
        // Recipe (Pizza -> Ingredients)
        // -------------------------
        var recipe = new Recipe
        {
            MenuItemId = pizza.MenuItemId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.Recipes.Add(recipe);
        await db.SaveChangesAsync();

        // 1 Pizza consumes:
        // Dough: 1 PCS
        // Sauce: 80 ML
        // Cheese: 120 G
        db.RecipeItems.AddRange(
            new RecipeItem { RecipeId = recipe.RecipeId, IngredientId = dough.IngredientId, QuantityPerUnit = 1m },
            new RecipeItem { RecipeId = recipe.RecipeId, IngredientId = sauce.IngredientId, QuantityPerUnit = 80m },
            new RecipeItem { RecipeId = recipe.RecipeId, IngredientId = cheese.IngredientId, QuantityPerUnit = 120m }
        );

        // -------------------------
        // InventoryRules
        // (InventoryRulesId PK + IngredientId FK UNIQUE)
        // -------------------------
        db.InventoryRules.AddRange(
            new InventoryRule { IngredientId = dough.IngredientId, ReorderLevel = 30m, ExpiryAlertDays = 7 },
            new InventoryRule { IngredientId = sauce.IngredientId, ReorderLevel = 1000m, ExpiryAlertDays = 7 }, // 1000 ML
            new InventoryRule { IngredientId = cheese.IngredientId, ReorderLevel = 500m, ExpiryAlertDays = 5 }   // 500 G
        );

        // -------------------------
        // Invoice + IngredientBatches (multi-delivery + expiry)
        // -------------------------
        var invoice = new Invoice
        {
            Date = DateTime.UtcNow.Date,
            TotalCost = 250.00m,
            SupplierName = "Demo Supplier"
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        // Stock (canonical units):
        // Dough: 150 PCS
        // Sauce: 5000 ML (5L)
        // Cheese: 3000 G (3kg) → split into 2 batches for FEFO testing
        var today = DateTime.UtcNow.Date;

        db.IngredientBatches.AddRange(
            new IngredientBatch
            {
                IngredientId = dough.IngredientId,
                InvoiceId = invoice.InvoiceId,
                QuantityOnHand = 150m,
                UnitCost = 0.40m,
                ReceivedDate = today,
                ExpiryDate = today.AddDays(5),
                IsActive = true
            },
            new IngredientBatch
            {
                IngredientId = sauce.IngredientId,
                InvoiceId = invoice.InvoiceId,
                QuantityOnHand = 5000m,
                UnitCost = 0.02m,
                ReceivedDate = today,
                ExpiryDate = today.AddDays(30),
                IsActive = true
            },
            // Cheese batch 1 (expires sooner — consumed first by FEFO)
            new IngredientBatch
            {
                IngredientId = cheese.IngredientId,
                InvoiceId = invoice.InvoiceId,
                QuantityOnHand = 1200m,
                UnitCost = 0.01m,
                ReceivedDate = today,
                ExpiryDate = today.AddDays(3),
                IsActive = true
            },
            // Cheese batch 2 (expires later — consumed second by FEFO)
            new IngredientBatch
            {
                IngredientId = cheese.IngredientId,
                InvoiceId = invoice.InvoiceId,
                QuantityOnHand = 1800m,
                UnitCost = 0.01m,
                ReceivedDate = today,
                ExpiryDate = today.AddDays(10),
                IsActive = true
            }
        );

        await db.SaveChangesAsync();
    }
}
