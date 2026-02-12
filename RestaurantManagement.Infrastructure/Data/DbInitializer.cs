using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // DB up-to-date olsun
        await db.Database.MigrateAsync();

        // Eğer zaten seed yapıldıysa çık (en basit kontrol)
        if (await db.Ingredients.AnyAsync() || await db.MenuItems.AnyAsync())
            return;

        // -------------------------
        // Ingredients
        // -------------------------
        var dough = new Ingredient { Name = "Hamur", BaseUnit = "PCS", IsActive = true };
        var sauce = new Ingredient { Name = "Pizza Sosu", BaseUnit = "ML", IsActive = true };
        var cheese = new Ingredient { Name = "Peynir", BaseUnit = "G", IsActive = true };

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
        // Hamur: 1 PCS
        // Sos: 80 ML
        // Peynir: 120 G
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
            InvoicePictureUrl = "invoices/invoice_001.jpg",
            SupplierName = "Demo Supplier"
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        // Stock (canonical units):
        // Hamur: 150 PCS
        // Sos: 5000 ML (5L)
        // Peynir: 3000 G (3kg) -> 2 farklı batch ile
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
            // Peynir batch 1 (yakın expiry)
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
            // Peynir batch 2 (daha geç expiry)
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
