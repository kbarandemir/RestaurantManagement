using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // -----------------------
    // RBAC
    // -----------------------
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    // -----------------------
    // Menu / Recipe
    // -----------------------
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeItem> RecipeItems => Set<RecipeItem>();

    // -----------------------
    // Inventory + Invoices
    // -----------------------
    public DbSet<IngredientBatch> IngredientBatches => Set<IngredientBatch>();
    public DbSet<InventoryRule> InventoryRules => Set<InventoryRule>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    // -----------------------
    // Sales
    // -----------------------
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();

    // -----------------------
    // Stock Movements
    // -----------------------
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // -----------------------
        // Uniques
        // -----------------------
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.RoleName)
            .IsUnique();

        modelBuilder.Entity<Permission>()
            .HasIndex(p => p.PermissionKey)
            .IsUnique();

        // -----------------------
        // RBAC many-to-many
        // -----------------------
        modelBuilder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        // Optional: prevent cascading deletes in RBAC
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        // -----------------------
        // InventoryRules (InventoryRulesId PK + IngredientId FK UNIQUE)
        // -----------------------
        modelBuilder.Entity<InventoryRule>()
            .HasKey(ir => ir.InventoryRuleId);

        modelBuilder.Entity<InventoryRule>()
            .HasIndex(ir => ir.IngredientId)
            .IsUnique();

        modelBuilder.Entity<InventoryRule>()
            .HasOne(ir => ir.Ingredient)
            .WithOne(i => i.InventoryRule)
            .HasForeignKey<InventoryRule>(ir => ir.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        // -----------------------
        // Precision for decimals
        // -----------------------
        modelBuilder.Entity<MenuItem>()
            .Property(x => x.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Invoice>()
            .Property(x => x.TotalCost)
            .HasPrecision(10, 2);

        modelBuilder.Entity<RecipeItem>()
            .Property(x => x.QuantityPerUnit)
            .HasPrecision(10, 2);

        modelBuilder.Entity<IngredientBatch>()
            .Property(x => x.QuantityOnHand)
            .HasPrecision(10, 2);

        modelBuilder.Entity<IngredientBatch>()
            .Property(x => x.UnitCost)
            .HasPrecision(10, 2);

        modelBuilder.Entity<InventoryRule>()
            .Property(x => x.ReorderLevel)
            .HasPrecision(10, 2);

        modelBuilder.Entity<SaleItem>()
            .Property(x => x.UnitPriceAtSale)
            .HasPrecision(10, 2);

        modelBuilder.Entity<StockMovement>()
            .Property(x => x.Quantity)
            .HasPrecision(10, 2);

        // -----------------------
        // Relationships (Menu/Recipe)
        // -----------------------
        modelBuilder.Entity<Recipe>()
            .HasOne(r => r.MenuItem)
            .WithMany(m => m.Recipes)
            .HasForeignKey(r => r.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RecipeItem>()
            .HasOne(ri => ri.Recipe)
            .WithMany(r => r.Items)
            .HasForeignKey(ri => ri.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RecipeItem>()
            .HasOne(ri => ri.Ingredient)
            .WithMany(i => i.RecipeItems)
            .HasForeignKey(ri => ri.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        // -----------------------
        // IngredientBatches + Invoice relationship
        // -----------------------
        modelBuilder.Entity<IngredientBatch>()
            .HasOne(b => b.Ingredient)
            .WithMany(i => i.Batches)
            .HasForeignKey(b => b.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        // InvoiceId can be optional depending on your entity. If it's required, remove IsRequired(false).
        modelBuilder.Entity<IngredientBatch>()
            .HasOne(b => b.Invoice)
            .WithMany(i => i.IngredientBatches)
            .HasForeignKey(b => b.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Optional audit: CreatedByUserId for batches
        modelBuilder.Entity<IngredientBatch>()
            .HasOne(b => b.CreatedByUser)
            .WithMany(u => u.CreatedBatches)
            .HasForeignKey(b => b.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // -----------------------
        // Sales + CreatedByUserId
        // -----------------------
        modelBuilder.Entity<Sale>()
            .HasOne(s => s.CreatedByUser)
            .WithMany(u => u.SalesCreated)
            .HasForeignKey(s => s.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Sale)
            .WithMany(s => s.Items)
            .HasForeignKey(si => si.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.MenuItem)
            .WithMany(mi => mi.SaleItems)
            .HasForeignKey(si => si.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // -----------------------
        // StockMovements (NO CASCADE)
        // -----------------------
        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Ingredient)
            .WithMany(i => i.StockMovements)
            .HasForeignKey(sm => sm.IngredientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Batch)
            .WithMany(b => b.StockMovements)
            .HasForeignKey(sm => sm.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

    }
}
