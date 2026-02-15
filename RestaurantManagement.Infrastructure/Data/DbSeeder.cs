using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Infrastructure.Data;

namespace RestaurantManagement.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // DB migration uygula (varsa)
        await db.Database.MigrateAsync();

        // -----------------------
        // Roles
        // -----------------------
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Role { RoleName = "Admin" },
                new Role { RoleName = "Manager" },
                new Role { RoleName = "Assistant Manager" },
                new Role { RoleName = "Head Chef" },
                new Role { RoleName = "Assistant Head Chef" },
                new Role { RoleName = "Chef" },
                new Role { RoleName = "Waiter" }
            );
            await db.SaveChangesAsync();
        }

        var adminRoleId = await db.Roles
            .Where(r => r.RoleName == "Admin")
            .Select(r => r.RoleId)
            .FirstAsync();

        // -----------------------
        // Permissions
        // -----------------------
        if (!await db.Permissions.AnyAsync())
        {
            db.Permissions.AddRange(
                new Permission { PermissionKey = "USERS_MANAGE" },
                new Permission { PermissionKey = "ROLES_MANAGE" },
                new Permission { PermissionKey = "PERMISSIONS_MANAGE" },

                new Permission { PermissionKey = "MENU_MANAGE" },
                new Permission { PermissionKey = "RECIPE_MANAGE" },

                new Permission { PermissionKey = "INVENTORY_READ" },
                new Permission { PermissionKey = "INVENTORY_WRITE" },

                new Permission { PermissionKey = "SALES_CREATE" },
                new Permission { PermissionKey = "SALES_READ" }
            );
            await db.SaveChangesAsync();
        }

        // -----------------------
        // RolePermissions (Admin gets all)
        // -----------------------
        var adminHasPermissions = await db.RolePermissions.AnyAsync(rp => rp.RoleId == adminRoleId);
        if (!adminHasPermissions)
        {
            var allPermIds = await db.Permissions.Select(p => p.PermissionId).ToListAsync();
            db.RolePermissions.AddRange(allPermIds.Select(pid => new RolePermission
            {
                RoleId = adminRoleId,
                PermissionId = pid
            }));
            await db.SaveChangesAsync();
        }

        // -----------------------
        // Admin User
        // -----------------------
        if (!await db.Users.AnyAsync(u => u.Email == "admin@restaurant.local"))
        {
            db.Users.Add(new User
            {
                FullName = "System Admin",
                Email = "admin@restaurant.local",
                RoleId = adminRoleId,
                IsActive = true,
                PasswordHash = "DEMO_HASH"
            });
            await db.SaveChangesAsync();
        }
        // -----------------------
        // CATEGORIES
        // -----------------------
        var categoryNames = new[]
        {
            "Pizza",
            "Burgers",
            "Wraps",
            "Sides",
            "Drinks",
            "Desserts"
        };

        foreach (var name in categoryNames)
        {
            if (!await db.Categories.AnyAsync(c => c.Name == name))
            {
                db.Categories.Add(new Category
                {
                    Name = name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await db.SaveChangesAsync();

        // Category mapping dictionary
        var categories = await db.Categories
            .ToDictionaryAsync(c => c.Name, c => c.CategoryId);

        // -----------------------
        // Ingredients (Pizza example)
        // -----------------------
        if (!await db.Ingredients.AnyAsync())
        {
            db.Ingredients.AddRange(
                new Ingredient { Name = "Hamur", BaseUnit = "PCS", IsActive = true },
                new Ingredient { Name = "Pizza Sosu", BaseUnit = "ML", IsActive = true },
                new Ingredient { Name = "Peynir", BaseUnit = "G", IsActive = true }
            );
            await db.SaveChangesAsync();
        }

        var doughId = await db.Ingredients.Where(i => i.Name == "Hamur").Select(i => i.IngredientId).FirstAsync();
        var sauceId = await db.Ingredients.Where(i => i.Name == "Pizza Sosu").Select(i => i.IngredientId).FirstAsync();
        var cheeseId = await db.Ingredients.Where(i => i.Name == "Peynir").Select(i => i.IngredientId).FirstAsync();

        // -----------------------
        // MenuItem (with Category FK)
        // -----------------------


        var existingPizza = await db.MenuItems
            .FirstOrDefaultAsync(m => m.Name == "Margherita Pizza");

        if (existingPizza == null)
        {
            db.MenuItems.Add(new MenuItem
            {
                Name = "Margherita Pizza",
                Price = 12.50m,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                CategoryId = categories["Pizza"]
            });

            await db.SaveChangesAsync();
        }
        else
        {
            // Eğer category boşsa veya yanlışsa düzelt
            if (existingPizza.CategoryId == null ||
                existingPizza.CategoryId != categories["Pizza"])
            {
                existingPizza.CategoryId = categories["Pizza"];
                await db.SaveChangesAsync();
            }
        }

        // -----------------------
        // Additional Menu Items
        // -----------------------
        var newItems = new[]
        {
            new { Name = "Cheeseburger", Price = 10.50m, Category = "Burgers" },
            new { Name = "Chicken Wrap", Price = 9.00m, Category = "Wraps" },
            new { Name = "French Fries", Price = 4.50m, Category = "Sides" },
            new { Name = "Cola", Price = 2.50m, Category = "Drinks" },
            new { Name = "Cheesecake", Price = 6.00m, Category = "Desserts" }
        };

        foreach (var item in newItems)
        {
            if (!await db.MenuItems.AnyAsync(m => m.Name == item.Name))
            {
                db.MenuItems.Add(new MenuItem
                {
                    Name = item.Name,
                    Price = item.Price,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    CategoryId = categories[item.Category]
                });
            }
        }
        await db.SaveChangesAsync();


        var pizzaId = await db.MenuItems
            .Where(m => m.Name == "Margherita Pizza")
            .Select(m => m.MenuItemId)
            .FirstOrDefaultAsync();

        if (pizzaId == 0)
            throw new Exception("Margherita Pizza not found during seeding.");

        // -----------------------
        // Recipe + RecipeItems (latest active)
        // -----------------------
        var hasActiveRecipe = await db.Recipes.AnyAsync(r => r.MenuItemId == pizzaId && r.IsActive);
        if (!hasActiveRecipe)
        {
            var recipe = new Recipe
            {
                MenuItemId = pizzaId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            db.Recipes.Add(recipe);
            await db.SaveChangesAsync();

            db.RecipeItems.AddRange(
                new RecipeItem { RecipeId = recipe.RecipeId, IngredientId = doughId, QuantityPerUnit = 1m },     // 1 dough per pizza
                new RecipeItem { RecipeId = recipe.RecipeId, IngredientId = sauceId, QuantityPerUnit = 80m },    // 80 ml sauce
                new RecipeItem { RecipeId = recipe.RecipeId, IngredientId = cheeseId, QuantityPerUnit = 120m }   // 120 g cheese
            );
            await db.SaveChangesAsync();
        }

        // -----------------------
        // InventoryRules
        // -----------------------
        if (!await db.InventoryRules.AnyAsync())
        {
            db.InventoryRules.AddRange(
                new InventoryRule { IngredientId = doughId, ReorderLevel = 30m, ExpiryAlertDays = 3 },
                new InventoryRule { IngredientId = sauceId, ReorderLevel = 1000m, ExpiryAlertDays = 5 },
                new InventoryRule { IngredientId = cheeseId, ReorderLevel = 1000m, ExpiryAlertDays = 5 }
            );
            await db.SaveChangesAsync();
        }

        // -----------------------
        // Invoice (optional)
        // -----------------------
        int invoiceId;
        var invoice = await db.Invoices
            .OrderByDescending(i => i.InvoiceId)
            .FirstOrDefaultAsync();
            
        if (invoice is null)
        {
            invoice = new Invoice
            {
                Date = DateTime.UtcNow.Date,
                TotalCost = 250m,
                SupplierName = "Demo Supplier",
                InvoicePictureUrl = "seed-demo"
            };
            db.Invoices.Add(invoice);
            await db.SaveChangesAsync();
        }
        invoiceId = invoice.InvoiceId;


        // -----------------------
        // IngredientBatches (FEFO test için 2 batch peynir)
        // -----------------------
        if (!await db.IngredientBatches.AnyAsync())
        {
            var adminUserId = await db.Users.Where(u => u.Email == "admin@restaurant.local").Select(u => u.UserId).FirstAsync();

            db.IngredientBatches.AddRange(
                new IngredientBatch
                {
                    IngredientId = doughId,
                    InvoiceId = invoiceId,
                    QuantityOnHand = 150m,
                    UnitCost = 0.50m,
                    ReceivedDate = DateTime.UtcNow.Date,
                    ExpiryDate = DateTime.UtcNow.Date.AddDays(7),
                    IsActive = true,
                    CreatedByUserId = adminUserId
                },
                new IngredientBatch
                {
                    IngredientId = sauceId,
                    InvoiceId = invoiceId,
                    QuantityOnHand = 5000m,
                    UnitCost = 0.02m,
                    ReceivedDate = DateTime.UtcNow.Date,
                    ExpiryDate = DateTime.UtcNow.Date.AddDays(10),
                    IsActive = true,
                    CreatedByUserId = adminUserId
                },
                new IngredientBatch
                {
                    IngredientId = cheeseId,
                    InvoiceId = invoiceId,
                    QuantityOnHand = 1200m,
                    UnitCost = 0.01m,
                    ReceivedDate = DateTime.UtcNow.Date,
                    ExpiryDate = DateTime.UtcNow.Date.AddDays(3), // earlier expiry
                    IsActive = true,
                    CreatedByUserId = adminUserId
                },
                new IngredientBatch
                {
                    IngredientId = cheeseId,
                    InvoiceId = invoiceId,
                    QuantityOnHand = 1800m,
                    UnitCost = 0.01m,
                    ReceivedDate = DateTime.UtcNow.Date,
                    ExpiryDate = DateTime.UtcNow.Date.AddDays(14), // later expiry
                    IsActive = true,
                    CreatedByUserId = adminUserId
                }
            );

            await db.SaveChangesAsync();
        }
    }
}
