using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // RBAC
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    // Menu/Recipe/Inventory/Sales
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeItem> RecipeItems => Set<RecipeItem>();

    public DbSet<IngredientBatch> IngredientBatches => Set<IngredientBatch>();
    public DbSet<InventoryRule> InventoryRules => Set<InventoryRule>();

    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();

    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.RoleName).IsUnique();

        modelBuilder.Entity<Permission>()
            .HasIndex(p => p.PermissionKey).IsUnique();

        modelBuilder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        modelBuilder.Entity<InventoryRule>()
            .HasKey(ir => ir.IngredientId);

        modelBuilder.Entity<InventoryRule>()
            .HasOne(ir => ir.Ingredient)
            .WithOne(i => i.InventoryRule)
            .HasForeignKey<InventoryRule>(ir => ir.IngredientId);

        modelBuilder.Entity<RecipeItem>()
            .Property(x => x.QuantityPerUnit)
            .HasPrecision(10, 2);

        modelBuilder.Entity<IngredientBatch>()
            .HasKey(b=>b.BatchId);

        modelBuilder.Entity<IngredientBatch>()
            .Property(x => x.QuantityOnHand)
            .HasPrecision(10, 2);

        modelBuilder.Entity<IngredientBatch>()
            .Property(x => x.UnitCost)
            .HasPrecision(10, 2);

        modelBuilder.Entity<InventoryRule>()
            .Property(x => x.ReorderLevel)
            .HasPrecision(10, 2);

        modelBuilder.Entity<StockMovement>()
            .HasKey(sm => sm.MovementId);

        modelBuilder.Entity<StockMovement>()
            .Property(x => x.Quantity)
            .HasPrecision(10, 2);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Ingredient)
            .WithMany(i => i.StockMovements)
            .HasForeignKey(sm => sm.IngredientId)
            .OnDelete(DeleteBehavior.Restrict); // ✅ NO CASCADE

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Batch)
            .WithMany(b => b.StockMovements)
            .HasForeignKey(sm => sm.BatchId)
            .OnDelete(DeleteBehavior.Restrict); // ✅ NO CASCADE
    }
}
