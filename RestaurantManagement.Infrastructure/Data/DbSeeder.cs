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

        // Permanently remove the InvoicePictureUrl column from the database to match the new code structure
        try { 
            await db.Database.ExecuteSqlRawAsync("IF COL_LENGTH('Invoices', 'InvoicePictureUrl') IS NOT NULL ALTER TABLE Invoices DROP COLUMN InvoicePictureUrl");
        } catch { /* ignore if already dropped */ }

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
        // Admin User  (password: Admin123!)
        // -----------------------
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        var existingAdmin = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@restaurant.local");
        if (existingAdmin == null)
        {
            var adminUser = new User
            {
                FirstName = "System",
                LastName = "Admin",
                Email = "admin@restaurant.local",
                RoleId = adminRoleId,
                IsActive = true,
                IsFirstLogin = false,
                PasswordHash = ""
            };
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123!");
            db.Users.Add(adminUser);
            await db.SaveChangesAsync();
        }
        else if (existingAdmin.PasswordHash == "DEMO_HASH" || string.IsNullOrEmpty(existingAdmin.PasswordHash))
        {
            // Fix legacy placeholder hash so login works
            existingAdmin.PasswordHash = hasher.HashPassword(existingAdmin, "Admin123!");
            existingAdmin.IsFirstLogin = false;
            await db.SaveChangesAsync();
        }
        // -----------------------
        // CATEGORIES (Zizzi Menu)
        // -----------------------
        var categoryNames = new[]
        {
            "Starters",
            "Classic Pasta",
            "Fresh Pasta",
            "Salads",
            "Meat Fish & Risotto",
            "Classic Pizza",
            "Rustica Pizza",
            "Calzone",
            "Desserts",
            "Drinks"
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
        // MenuItem (Zizzi Menu – all items)
        // -----------------------
        var zizziItems = new[]
        {
            // ── Starters ──
            new { Name = "Garlic Bread", Price = 5.95m, Category = "Starters" },
            new { Name = "Bruschetta", Price = 7.25m, Category = "Starters" },
            new { Name = "Garlic Bread with Mozzarella", Price = 6.95m, Category = "Starters" },
            new { Name = "Cheesy Chilli Garlic Bread", Price = 6.95m, Category = "Starters" },
            new { Name = "Mushroom & Riserva Crostini", Price = 7.95m, Category = "Starters" },
            new { Name = "Mozzarella Arancini", Price = 7.25m, Category = "Starters" },
            new { Name = "Pork & Garlic Meatballs", Price = 7.95m, Category = "Starters" },
            new { Name = "Fonduta Formaggi", Price = 7.95m, Category = "Starters" },
            new { Name = "Winter Caprese", Price = 7.95m, Category = "Starters" },
            new { Name = "Chicken Spiedini", Price = 8.50m, Category = "Starters" },
            new { Name = "King Prawn Spiedini", Price = 9.95m, Category = "Starters" },
            new { Name = "Pollo Fritti", Price = 8.50m, Category = "Starters" },
            new { Name = "Calamari", Price = 8.75m, Category = "Starters" },

            // ── Classic Pasta ──
            new { Name = "Spaghetti Pomodoro", Price = 11.50m, Category = "Classic Pasta" },
            new { Name = "Spaghetti Bolognese", Price = 13.95m, Category = "Classic Pasta" },
            new { Name = "Casareccia Pesto Rosso", Price = 14.95m, Category = "Classic Pasta" },
            new { Name = "Spaghetti Chorizo Carbonara", Price = 15.25m, Category = "Classic Pasta" },
            new { Name = "Casareccia Pollo Piccante", Price = 15.75m, Category = "Classic Pasta" },
            new { Name = "King Prawn Linguine", Price = 15.95m, Category = "Classic Pasta" },
            new { Name = "Ravioli di Capra", Price = 14.75m, Category = "Classic Pasta" },
            new { Name = "Vegan Rainbow Lasagne", Price = 14.95m, Category = "Classic Pasta" },
            new { Name = "Six Layer Lasagne", Price = 14.95m, Category = "Classic Pasta" },
            new { Name = "Casareccia della Casa", Price = 15.95m, Category = "Classic Pasta" },
            new { Name = "Casareccia Pork & Garlic Meatballs", Price = 15.95m, Category = "Classic Pasta" },

            // ── Fresh Pasta ──
            new { Name = "Campanelle Lentil Ragu", Price = 14.75m, Category = "Fresh Pasta" },
            new { Name = "Signature Beef & Chianti Ragu", Price = 14.25m, Category = "Fresh Pasta" },
            new { Name = "Truffle & Pancetta Carbonara", Price = 14.95m, Category = "Fresh Pasta" },
            new { Name = "Hot-Smoked Salmon Carbonara", Price = 14.95m, Category = "Fresh Pasta" },

            // ── Salads ──
            new { Name = "Winter Zucca Salad", Price = 14.25m, Category = "Salads" },
            new { Name = "Chicken & Prosciutto Salad", Price = 14.95m, Category = "Salads" },
            new { Name = "Smoked Salmon Salad", Price = 15.95m, Category = "Salads" },

            // ── Meat Fish & Risotto ──
            new { Name = "Roasted Mushroom Risotto", Price = 14.75m, Category = "Meat Fish & Risotto" },
            new { Name = "Hot-Smoked Salmon & Pesto Risotto", Price = 14.75m, Category = "Meat Fish & Risotto" },
            new { Name = "Chicken Calabrese", Price = 14.95m, Category = "Meat Fish & Risotto" },
            new { Name = "Chicken Milanese", Price = 14.75m, Category = "Meat Fish & Risotto" },
            new { Name = "Pan-Fried Sea Bass", Price = 16.95m, Category = "Meat Fish & Risotto" },
            new { Name = "Herb-Rolled Pork Belly", Price = 15.95m, Category = "Meat Fish & Risotto" },

            // ── Classic Pizza ──
            new { Name = "Margherita Pizza", Price = 11.50m, Category = "Classic Pizza" },
            new { Name = "Pepperoni Campagna", Price = 13.95m, Category = "Classic Pizza" },
            new { Name = "Fable Shiitake & Mushroom", Price = 14.95m, Category = "Classic Pizza" },
            new { Name = "Meat Sofia", Price = 14.95m, Category = "Classic Pizza" },
            new { Name = "Piccante", Price = 14.95m, Category = "Classic Pizza" },
            new { Name = "Pepperoni Campagna (Rustica)", Price = 15.95m, Category = "Classic Pizza" },

            // ── Rustica Pizza ──
            new { Name = "Pinoli", Price = 13.00m, Category = "Rustica Pizza" },
            new { Name = "Margherita Rustica", Price = 13.50m, Category = "Rustica Pizza" },
            new { Name = "Primavera", Price = 13.75m, Category = "Rustica Pizza" },
            new { Name = "Pure Pepperoni", Price = 13.75m, Category = "Rustica Pizza" },
            new { Name = "Chicken & Fiery Nduja Rustica", Price = 14.75m, Category = "Rustica Pizza" },
            new { Name = "Black Truffle Salami & Mushroom", Price = 14.95m, Category = "Rustica Pizza" },
            new { Name = "Half & Half", Price = 14.95m, Category = "Rustica Pizza" },
            new { Name = "Sticky Pig", Price = 14.95m, Category = "Rustica Pizza" },
            new { Name = "Triple Cheese & Truffle", Price = 14.75m, Category = "Rustica Pizza" },
            new { Name = "Mezzo Manzo", Price = 17.25m, Category = "Rustica Pizza" },

            // ── Calzone ──
            new { Name = "Calzone Carne Piccante", Price = 14.95m, Category = "Calzone" },
            new { Name = "Calzone Spinaci", Price = 14.75m, Category = "Calzone" },

            // ── Desserts ──
            new { Name = "Chocolate Melt", Price = 7.95m, Category = "Desserts" },
            new { Name = "Zillionaire's Fudge Cake", Price = 7.25m, Category = "Desserts" },
            new { Name = "Twisted Affogato", Price = 4.95m, Category = "Desserts" },
            new { Name = "Strawberry Coulis Cheesecake", Price = 7.50m, Category = "Desserts" },
            new { Name = "Chocolate & Marshmallow Sundae", Price = 7.50m, Category = "Desserts" },
            new { Name = "Black Forest Sundae", Price = 7.50m, Category = "Desserts" },
            new { Name = "Honeycomb Cheesecake", Price = 7.50m, Category = "Desserts" },
            new { Name = "Brownie & Honeycomb Sundae", Price = 7.50m, Category = "Desserts" },
            new { Name = "Salted Caramel Chocolate Brownie", Price = 7.25m, Category = "Desserts" },
            new { Name = "Tiramisu", Price = 7.25m, Category = "Desserts" },
            new { Name = "Gelato & Sorbet", Price = 5.75m, Category = "Desserts" },
            new { Name = "Lemon Swirl Cheesecake", Price = 7.50m, Category = "Desserts" },

            // ── Drinks ──
            new { Name = "Soft Drink", Price = 3.65m, Category = "Drinks" },
            new { Name = "Aperol Spritz", Price = 7.95m, Category = "Drinks" },
            new { Name = "Passion Fruitini", Price = 7.95m, Category = "Drinks" },
            new { Name = "Raspberry Mojito", Price = 7.95m, Category = "Drinks" },
            new { Name = "Strawberry Daiquiri", Price = 7.95m, Category = "Drinks" },
            new { Name = "Limoncello", Price = 4.95m, Category = "Drinks" },
        };

        foreach (var item in zizziItems)
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
        // SEEDING RECIPES & STOCK FOR ZIZZI ITEMS
        // -----------------------
        // 1. Ensure Ingredients exist
        var newIngredients = new[]
        {
            new { Name = "Pasta Dough", Stock = 2000m, UnitCost = 0.40m },
            new { Name = "Bolognese Sauce", Stock = 5000m, UnitCost = 0.03m },
            new { Name = "Garlic Bread Base", Stock = 1500m, UnitCost = 0.35m },
            new { Name = "Mozzarella", Stock = 10000m, UnitCost = 0.02m },
            new { Name = "Pepperoni", Stock = 5000m, UnitCost = 0.03m },
            new { Name = "Pork Meatball", Stock = 2000m, UnitCost = 1.20m },
            new { Name = "King Prawns", Stock = 1500m, UnitCost = 2.50m },
            new { Name = "Sea Bass Fillet", Stock = 500m, UnitCost = 4.50m },
            new { Name = "Risotto Rice", Stock = 10000m, UnitCost = 0.01m },
            new { Name = "Chicken Breast", Stock = 1000m, UnitCost = 2.00m },
            new { Name = "Tiramisu Slice", Stock = 600m, UnitCost = 2.00m },
            new { Name = "Soft Drink Can", Stock = 2000m, UnitCost = 0.80m },
            new { Name = "Pizza Dough", Stock = 3000m, UnitCost = 0.50m },
            new { Name = "Salad Greens", Stock = 5000m, UnitCost = 0.02m },
            new { Name = "Tomatoes", Stock = 3000m, UnitCost = 0.01m },
            new { Name = "Pesto Sauce", Stock = 2000m, UnitCost = 0.05m },
            new { Name = "Mushroom", Stock = 4000m, UnitCost = 0.02m },
            new { Name = "Pancetta", Stock = 2000m, UnitCost = 0.06m },
            new { Name = "Prosciutto", Stock = 1000m, UnitCost = 0.10m },
            new { Name = "Salmon", Stock = 500m, UnitCost = 3.50m },
            new { Name = "Calamari Rings", Stock = 2000m, UnitCost = 0.08m },
            new { Name = "Gelato Scoop", Stock = 2000m, UnitCost = 0.50m },
            new { Name = "Cake Slice", Stock = 1000m, UnitCost = 1.50m },
            new { Name = "Cheesecake Slice", Stock = 1000m, UnitCost = 1.50m },
            new { Name = "Brownie Slice", Stock = 1000m, UnitCost = 1.50m },
            new { Name = "Cocktail Base", Stock = 5000m, UnitCost = 1.50m }
        };

        var ingMap = new Dictionary<string, int>();

        foreach (var ni in newIngredients)
        {
            var ing = await db.Ingredients.FirstOrDefaultAsync(i => i.Name == ni.Name);
            if (ing == null)
            {
                ing = new Ingredient { Name = ni.Name, BaseUnit = "Unit", IsActive = true };
                db.Ingredients.Add(ing);
                await db.SaveChangesAsync();

                // Add Batch
                db.IngredientBatches.Add(new IngredientBatch
                {
                    IngredientId = ing.IngredientId,
                    QuantityOnHand = ni.Stock,
                    UnitCost = ni.UnitCost,
                    ReceivedDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddDays(60),
                    IsActive = true,
                    InvoiceId = null 
                });
                
                // Add Rule
                db.InventoryRules.Add(new InventoryRule
                {
                    IngredientId = ing.IngredientId,
                    ReorderLevel = 50,
                    ExpiryAlertDays = 7
                });
            }
            ingMap[ni.Name] = ing.IngredientId;
        }
        await db.SaveChangesAsync();

        // 2. Ensure Recipes exist for key Zizzi items
        var menuRecipes = new[]
        {
            // Starters
            new { Menu = "Garlic Bread", Ings = new[] { ("Garlic Bread Base", 1m) } },
            new { Menu = "Bruschetta", Ings = new[] { ("Garlic Bread Base", 1m), ("Tomatoes", 50m) } },
            new { Menu = "Garlic Bread with Mozzarella", Ings = new[] { ("Garlic Bread Base", 1m), ("Mozzarella", 80m) } },
            new { Menu = "Cheesy Chilli Garlic Bread", Ings = new[] { ("Garlic Bread Base", 1m), ("Mozzarella", 80m) } },
            new { Menu = "Mushroom & Riserva Crostini", Ings = new[] { ("Garlic Bread Base", 1m), ("Mushroom", 50m) } },
            new { Menu = "Mozzarella Arancini", Ings = new[] { ("Risotto Rice", 100m), ("Mozzarella", 40m) } },
            new { Menu = "Pork & Garlic Meatballs", Ings = new[] { ("Pork Meatball", 4m) } },
            new { Menu = "Fonduta Formaggi", Ings = new[] { ("Mozzarella", 150m) } },
            new { Menu = "Winter Caprese", Ings = new[] { ("Mozzarella", 100m), ("Tomatoes", 80m) } },
            new { Menu = "Chicken Spiedini", Ings = new[] { ("Chicken Breast", 0.5m) } },
            new { Menu = "King Prawn Spiedini", Ings = new[] { ("King Prawns", 4m) } },
            new { Menu = "Pollo Fritti", Ings = new[] { ("Chicken Breast", 0.8m) } },
            new { Menu = "Calamari", Ings = new[] { ("Calamari Rings", 150m) } },

            // Pasta
            new { Menu = "Spaghetti Pomodoro", Ings = new[] { ("Pasta Dough", 1m), ("Bolognese Sauce", 100m) } },
            new { Menu = "Spaghetti Bolognese", Ings = new[] { ("Pasta Dough", 1m), ("Bolognese Sauce", 150m) } },
            new { Menu = "Casareccia Pesto Rosso", Ings = new[] { ("Pasta Dough", 1m), ("Pesto Sauce", 80m) } },
            new { Menu = "Spaghetti Chorizo Carbonara", Ings = new[] { ("Pasta Dough", 1m), ("Pancetta", 50m) } },
            new { Menu = "Casareccia Pollo Piccante", Ings = new[] { ("Pasta Dough", 1m), ("Chicken Breast", 0.5m) } },
            new { Menu = "King Prawn Linguine", Ings = new[] { ("Pasta Dough", 1m), ("King Prawns", 6m) } },
            new { Menu = "Ravioli di Capra", Ings = new[] { ("Pasta Dough", 1m), ("Mozzarella", 50m) } },
            new { Menu = "Vegan Rainbow Lasagne", Ings = new[] { ("Pasta Dough", 1m), ("Salad Greens", 50m) } },
            new { Menu = "Six Layer Lasagne", Ings = new[] { ("Pasta Dough", 1.5m), ("Bolognese Sauce", 200m) } },
            new { Menu = "Casareccia della Casa", Ings = new[] { ("Pasta Dough", 1m), ("Chicken Breast", 0.5m) } },
            new { Menu = "Casareccia Pork & Garlic Meatballs", Ings = new[] { ("Pasta Dough", 1m), ("Pork Meatball", 3m) } },
            new { Menu = "Campanelle Lentil Ragu", Ings = new[] { ("Pasta Dough", 1m), ("Bolognese Sauce", 100m) } },
            new { Menu = "Signature Beef & Chianti Ragu", Ings = new[] { ("Pasta Dough", 1m), ("Bolognese Sauce", 150m) } },
            new { Menu = "Truffle & Pancetta Carbonara", Ings = new[] { ("Pasta Dough", 1m), ("Pancetta", 60m) } },
            new { Menu = "Hot-Smoked Salmon Carbonara", Ings = new[] { ("Pasta Dough", 1m), ("Salmon", 0.5m) } },

            // Salads
            new { Menu = "Winter Zucca Salad", Ings = new[] { ("Salad Greens", 150m) } },
            new { Menu = "Chicken & Prosciutto Salad", Ings = new[] { ("Salad Greens", 100m), ("Chicken Breast", 0.5m), ("Prosciutto", 30m) } },
            new { Menu = "Smoked Salmon Salad", Ings = new[] { ("Salad Greens", 100m), ("Salmon", 0.5m) } },

            // Mains
            new { Menu = "Roasted Mushroom Risotto", Ings = new[] { ("Risotto Rice", 200m), ("Mushroom", 80m) } },
            new { Menu = "Hot-Smoked Salmon & Pesto Risotto", Ings = new[] { ("Risotto Rice", 200m), ("Salmon", 0.5m), ("Pesto Sauce", 30m) } },
            new { Menu = "Chicken Calabrese", Ings = new[] { ("Chicken Breast", 1m), ("Tomatoes", 50m) } },
            new { Menu = "Chicken Milanese", Ings = new[] { ("Chicken Breast", 1m) } },
            new { Menu = "Pan-Fried Sea Bass", Ings = new[] { ("Sea Bass Fillet", 1m) } },
            new { Menu = "Herb-Rolled Pork Belly", Ings = new[] { ("Pork Meatball", 3m) } },

            // Pizza (Classic & Rustica)
            new { Menu = "Margherita Pizza", Ings = new[] { ("Pizza Dough", 1m), ("Mozzarella", 100m) } },
            new { Menu = "Pepperoni Campagna", Ings = new[] { ("Pizza Dough", 1m), ("Mozzarella", 120m), ("Pepperoni", 60m) } },
            new { Menu = "Fable Shiitake & Mushroom", Ings = new[] { ("Pizza Dough", 1m), ("Mushroom", 80m), ("Mozzarella", 80m) } },
            new { Menu = "Meat Sofia", Ings = new[] { ("Pizza Dough", 1m), ("Pepperoni", 50m), ("Chicken Breast", 0.5m) } },
            new { Menu = "Piccante", Ings = new[] { ("Pizza Dough", 1m), ("Pepperoni", 80m) } },
            new { Menu = "Pepperoni Campagna (Rustica)", Ings = new[] { ("Pizza Dough", 1.5m), ("Mozzarella", 150m), ("Pepperoni", 80m) } },
            new { Menu = "Pinoli", Ings = new[] { ("Pizza Dough", 1.5m), ("Mushroom", 50m) } },
            new { Menu = "Margherita Rustica", Ings = new[] { ("Pizza Dough", 1.5m), ("Mozzarella", 150m) } },
            new { Menu = "Primavera", Ings = new[] { ("Pizza Dough", 1.5m), ("Salad Greens", 30m) } },
            new { Menu = "Pure Pepperoni", Ings = new[] { ("Pizza Dough", 1.5m), ("Pepperoni", 100m) } },
            new { Menu = "Chicken & Fiery Nduja Rustica", Ings = new[] { ("Pizza Dough", 1.5m), ("Chicken Breast", 0.5m) } },
            new { Menu = "Black Truffle Salami & Mushroom", Ings = new[] { ("Pizza Dough", 1.5m), ("Mushroom", 50m) } },
            new { Menu = "Half & Half", Ings = new[] { ("Pizza Dough", 1.5m) } },
            new { Menu = "Sticky Pig", Ings = new[] { ("Pizza Dough", 1.5m), ("Pork Meatball", 2m) } },
            new { Menu = "Triple Cheese & Truffle", Ings = new[] { ("Pizza Dough", 1.5m), ("Mozzarella", 200m) } },
            new { Menu = "Mezzo Manzo", Ings = new[] { ("Pizza Dough", 1.5m), ("Pepperoni", 50m) } },
            new { Menu = "Calzone Carne Piccante", Ings = new[] { ("Pizza Dough", 1.5m), ("Pepperoni", 80m) } },
            new { Menu = "Calzone Spinaci", Ings = new[] { ("Pizza Dough", 1.5m), ("Salad Greens", 50m) } },

            // Desserts
            new { Menu = "Chocolate Melt", Ings = new[] { ("Cake Slice", 1m) } },
            new { Menu = "Zillionaire's Fudge Cake", Ings = new[] { ("Cake Slice", 1m) } },
            new { Menu = "Twisted Affogato", Ings = new[] { ("Gelato Scoop", 1m) } },
            new { Menu = "Strawberry Coulis Cheesecake", Ings = new[] { ("Cheesecake Slice", 1m) } },
            new { Menu = "Chocolate & Marshmallow Sundae", Ings = new[] { ("Gelato Scoop", 2m) } },
            new { Menu = "Black Forest Sundae", Ings = new[] { ("Gelato Scoop", 2m) } },
            new { Menu = "Honeycomb Cheesecake", Ings = new[] { ("Cheesecake Slice", 1m) } },
            new { Menu = "Brownie & Honeycomb Sundae", Ings = new[] { ("Gelato Scoop", 2m), ("Brownie Slice", 1m) } },
            new { Menu = "Salted Caramel Chocolate Brownie", Ings = new[] { ("Brownie Slice", 1m) } },
            new { Menu = "Tiramisu", Ings = new[] { ("Tiramisu Slice", 1m) } },
            new { Menu = "Gelato & Sorbet", Ings = new[] { ("Gelato Scoop", 2m) } },
            new { Menu = "Lemon Swirl Cheesecake", Ings = new[] { ("Cheesecake Slice", 1m) } },

            // Drinks
            new { Menu = "Soft Drink", Ings = new[] { ("Soft Drink Can", 1m) } },
            new { Menu = "Aperol Spritz", Ings = new[] { ("Cocktail Base", 1m) } },
            new { Menu = "Passion Fruitini", Ings = new[] { ("Cocktail Base", 1m) } },
            new { Menu = "Raspberry Mojito", Ings = new[] { ("Cocktail Base", 1m) } },
            new { Menu = "Strawberry Daiquiri", Ings = new[] { ("Cocktail Base", 1m) } },
            new { Menu = "Limoncello", Ings = new[] { ("Cocktail Base", 0.5m) } }
        };

        foreach (var mr in menuRecipes)
        {
            var mItem = await db.MenuItems.FirstOrDefaultAsync(m => m.Name == mr.Menu);
            if (mItem != null)
            {
                if (!await db.Recipes.AnyAsync(r => r.MenuItemId == mItem.MenuItemId && r.IsActive))
                {
                    var r = new Recipe { 
                        MenuItemId = mItem.MenuItemId, 
                        IsActive = true, 
                        CreatedAt = DateTime.UtcNow,
                        PrepTime = "15-20 min",
                        Servings = 1,
                        Instructions = "[\"Prepare ingredients.\", \"Cook according to standard procedure.\", \"Plate and serve hot.\"]"
                    };
                    db.Recipes.Add(r);
                    await db.SaveChangesAsync();

                    foreach (var (ingName, qty) in mr.Ings)
                    {
                        if (ingMap.TryGetValue(ingName, out int iId))
                        {
                            db.RecipeItems.Add(new RecipeItem { RecipeId = r.RecipeId, IngredientId = iId, QuantityPerUnit = qty });
                        }
                    }
                    await db.SaveChangesAsync();
                }
            }
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
                SupplierName = "Demo Supplier"
            };
            db.Invoices.Add(invoice);
            await db.SaveChangesAsync();
        }
        invoiceId = invoice.InvoiceId;


        // -----------------------
        // IngredientBatches (2 batches of cheese for FEFO testing)
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

        // -----------------------
        // Sales (365 days historical data for Dashboard)
        // -----------------------
        if (!await db.Sales.AnyAsync())
        {
            var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Role.RoleName == "Admin");
            var adminId = adminUser?.UserId;
            
            var allMenuItems = await db.MenuItems.Where(m => m.IsActive).ToListAsync();
            
            if (adminId.HasValue && allMenuItems.Any())
            {
                var random = new Random(12345);
                var salesToSeed = new List<Sale>();
                
                // Past 365 days including today
                for (int i = 365; i >= 0; i--)
                {
                    var date = DateTime.UtcNow.Date.AddDays(-i);
                    // Base sales + randomness + seasonality (weekends have more)
                    var dayOfWeek = date.DayOfWeek;
                    int baseSales = (dayOfWeek == DayOfWeek.Friday || dayOfWeek == DayOfWeek.Saturday) ? 40 : 20;
                    int dailySalesCount = random.Next(baseSales - 5, baseSales + 15);
                    
                    for (int s = 0; s < dailySalesCount; s++)
                    {
                        var sale = new Sale
                        {
                            SaleDateTime = date.AddHours(random.Next(11, 23)).AddMinutes(random.Next(0, 60)),
                            Status = random.Next(10) > 2 ? "paidbycard" : "paidbycash",
                            CreatedByUserId = adminId.Value,
                            Items = new List<SaleItem>()
                        };
                        
                        // 1 to 4 items per sale
                        int itemCount = random.Next(1, 5);
                        for (int k = 0; k < itemCount; k++)
                        {
                            var menuItem = allMenuItems[random.Next(allMenuItems.Count)];
                            sale.Items.Add(new SaleItem
                            {
                                MenuItemId = menuItem.MenuItemId,
                                Quantity = random.Next(1, 4),
                                UnitPriceAtSale = menuItem.Price
                            });
                        }
                        salesToSeed.Add(sale);
                    }
                }
                
                await db.Sales.AddRangeAsync(salesToSeed);
                await db.SaveChangesAsync();
            }
        }

        // -----------------------
        // ENSURE SUFFICIENT STOCK (Global)
        // -----------------------
        var allIngredients = await db.Ingredients.ToListAsync();
        var adminIdForStock = await db.Users.Where(u => u.Email == "admin@restaurant.local").Select(u => u.UserId).FirstOrDefaultAsync();
        
        foreach (var ing in allIngredients)
        {
            // We don't delete expired batches here to avoid FK conflicts with StockMovements.
            // Our FEFO logic and UI tabs already handle filtering these out.

            var totalStock = await db.IngredientBatches
                .Where(b => b.IngredientId == ing.IngredientId && b.IsActive && b.ExpiryDate > DateTime.UtcNow)
                .SumAsync(b => b.QuantityOnHand);

            // If stock is low or zero, add 5000 more
            if (totalStock < 100)
            {
                db.IngredientBatches.Add(new IngredientBatch
                {
                    IngredientId = ing.IngredientId,
                    QuantityOnHand = 5000m,
                    UnitCost = 0.50m,
                    ReceivedDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddYears(1),
                    IsActive = true,
                    CreatedByUserId = adminIdForStock != 0 ? adminIdForStock : 1
                });
            }
        }
        await db.SaveChangesAsync();
    }
}
