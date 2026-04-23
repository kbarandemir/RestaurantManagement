using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Application.Interfaces;

public interface IAppDbContext
{
    // RBAC
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }

    // Menu/Recipe/Inventory/Sales
    DbSet<MenuItem> MenuItems { get; }
    DbSet<Ingredient> Ingredients { get; }
    DbSet<Recipe> Recipes { get; }
    DbSet<RecipeItem> RecipeItems { get; }

    DbSet<Invoice> Invoices { get; }
    DbSet<IngredientBatch> IngredientBatches { get; }
    DbSet<InventoryRule> InventoryRules { get; }

    DbSet<Sale> Sales { get; }
    DbSet<SaleItem> SaleItems { get; }

    DbSet<StockMovement> StockMovements { get; }

    // Reservations
    DbSet<Reservation> Reservations { get; }

    // Roster
    DbSet<Shift> Shifts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
