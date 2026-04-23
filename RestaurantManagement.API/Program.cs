using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Infrastructure.Data;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Application.Services;
using RestaurantManagement.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

// ══════════════════════════════════════════════════════════════════════════════
// Application Entry Point — RestaurantManagement API
//
// Architecture: Clean Architecture (4 layers)
//   - Domain: Entities and value objects (no dependencies)
//   - Application: Business logic, DTOs, service interfaces
//   - Infrastructure: EF Core DbContext, data seeding, migrations
//   - API (this project): Controllers, middleware, DI configuration
//
// The Dependency Inversion Principle is enforced:
//   - API references Application (interfaces) and Infrastructure (implementations)
//   - Application NEVER references Infrastructure directly
// ══════════════════════════════════════════════════════════════════════════════

var builder = WebApplication.CreateBuilder(args);

// ── CORS Configuration ──────────────────────────────────────────────────────
// Allow the React frontend (Vite dev server) to make cross-origin API requests
var allowedOrigin = "http://localhost:5173";

// ── JWT Configuration ───────────────────────────────────────────────────────
// Read signing key, issuer, and audience from appsettings.json
var jwt = builder.Configuration.GetSection("Jwt");
var key = jwt["Key"]!;

// ── Database Configuration ──────────────────────────────────────────────────
// Register Entity Framework with SQL Server using the connection string
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.AmbientTransactionWarning)));

// Register the DbContext abstraction for Dependency Injection across service layers
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

// ── Swagger / OpenAPI ───────────────────────────────────────────────────────
// Generates interactive API documentation at /swagger during development
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RestaurantManagement API",
        Version = "v1"
    });

    // Add JWT bearer authentication to Swagger UI
    options.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── Service Registration (Dependency Injection) ─────────────────────────────
// Each service is registered as Scoped (one instance per HTTP request).
// Interface → Implementation mapping follows the Clean Architecture pattern:
//   Controller → IService (Application layer) → Service (Application layer) → IAppDbContext
builder.Services.AddScoped<IIngredientService, IngredientService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IMenuItemService, MenuItemService>();
builder.Services.AddScoped<IInventoryRuleService, InventoryRuleService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IIngredientBatchService, IngredientBatchService>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IRolePermissionService, RolePermissionService>();
builder.Services.AddScoped<IStockMovementService, StockMovementService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRosterService, RosterService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

builder.Services.AddControllers();

// ── CORS Policy ─────────────────────────────────────────────────────────────
// Allows the React frontend to communicate with the API across different ports
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins(allowedOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── JWT Authentication ──────────────────────────────────────────────────────
// Validates JWT tokens on every request to [Authorize] endpoints.
// Tokens are generated by AuthService.GenerateJwt() using HMAC-SHA256.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// ── Middleware Pipeline ─────────────────────────────────────────────────────
// Order matters: CORS → Swagger → HTTPS → Auth → Controllers

app.UseCors("FrontendCors");

// Swagger UI is only available in Development mode
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "RestaurantManagement API v1");
    });
}

// ── Database Seeding ────────────────────────────────────────────────────────
// Seeds initial data (roles, users, menu items, ingredients, batches, sales)
// on startup. The seeder is idempotent — it skips if data already exists.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.UseHttpsRedirection();

// Authentication must come before Authorization in the pipeline
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
