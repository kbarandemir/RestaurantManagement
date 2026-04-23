using Xunit;
using System.Reflection;

namespace RestaurantManagement.Tests;

/// <summary>
/// Architecture isolation tests — verifies that the Clean Architecture
/// dependency rules are enforced at compile time.
///
/// The dependency graph must be:
///   API → Application → Domain
///   API → Infrastructure → Domain
///   Infrastructure → Application (implements interfaces)
///
/// The Application layer must NEVER reference Infrastructure directly.
/// This ensures business logic is database-agnostic and testable in isolation.
/// </summary>
public class ArchitectureTests
{
    /// <summary>
    /// Verifies that the Application layer (RestaurantManagement.Application)
    /// does NOT have a direct reference to the Infrastructure layer.
    ///
    /// Why this matters:
    ///   - Application defines interfaces (IAppDbContext, IAuthService, etc.)
    ///   - Infrastructure provides implementations (AppDbContext, etc.)
    ///   - If Application referenced Infrastructure, it would create a
    ///     circular dependency and violate Dependency Inversion Principle
    /// </summary>
    [Fact]
    public void ApplicationLayer_ShouldNotReference_InfrastructureLayer()
    {
        // Load the Application assembly
        var applicationAssembly = typeof(RestaurantManagement.Application.Interfaces.IAppDbContext).Assembly;

        // Get all referenced assembly names
        var referencedAssemblies = applicationAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        // Assert: Infrastructure should NOT be in the reference list
        Assert.DoesNotContain("RestaurantManagement.Infrastructure", referencedAssemblies);
    }

    /// <summary>
    /// Verifies that the Domain layer has no references to Application
    /// or Infrastructure layers — it must be completely self-contained.
    ///
    /// The Domain contains only:
    ///   - Entity classes (User, Sale, Ingredient, etc.)
    ///   - Value objects
    ///   - Domain events (if any)
    /// </summary>
    [Fact]
    public void DomainLayer_ShouldNotReference_ApplicationOrInfrastructure()
    {
        var domainAssembly = typeof(RestaurantManagement.Domain.Entities.User).Assembly;

        var referencedAssemblies = domainAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        Assert.DoesNotContain("RestaurantManagement.Application", referencedAssemblies);
        Assert.DoesNotContain("RestaurantManagement.Infrastructure", referencedAssemblies);
    }

    /// <summary>
    /// Verifies that all service interfaces in the Application layer
    /// follow the naming convention "I{ServiceName}".
    /// </summary>
    [Fact]
    public void ApplicationInterfaces_ShouldFollowNamingConvention()
    {
        var applicationAssembly = typeof(RestaurantManagement.Application.Interfaces.IAppDbContext).Assembly;

        var interfaces = applicationAssembly
            .GetTypes()
            .Where(t => t.IsInterface && t.Namespace?.Contains("Interfaces") == true)
            .ToList();

        // All interfaces should start with "I"
        foreach (var iface in interfaces)
        {
            Assert.StartsWith("I", iface.Name);
        }

        // We should have a reasonable number of service interfaces
        Assert.True(interfaces.Count >= 5,
            $"Expected at least 5 service interfaces, found {interfaces.Count}");
    }
}
