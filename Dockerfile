# ── Base Image (Runtime) ──────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# ── Build Stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy all project files individually to leverage caching
COPY ["RestaurantManagement.API/RestaurantManagement.API.csproj", "RestaurantManagement.API/"]
COPY ["RestaurantManagement.Application/RestaurantManagement.Application.csproj", "RestaurantManagement.Application/"]
COPY ["RestaurantManagement.Infrastructure/RestaurantManagement.Infrastructure.csproj", "RestaurantManagement.Infrastructure/"]
COPY ["RestaurantManagement.Domain/RestaurantManagement.Domain.csproj", "RestaurantManagement.Domain/"]
COPY ["RestaurantManagement.Tests/RestaurantManagement.Tests.csproj", "RestaurantManagement.Tests/"]

# Restore dependencies
RUN dotnet restore "RestaurantManagement.API/RestaurantManagement.API.csproj"

# Copy the entire source tree
COPY . .

# Build the main project
WORKDIR "/src/RestaurantManagement.API"
RUN dotnet build "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/build /p:EnableDefaultResourceItems=false

# ── Publish Stage ───────────────────────────────────────────────────────────
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false /p:EnableDefaultResourceItems=false

# ── Final Stage (Runtime) ──────────────────────────────────────────────────
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Standardize environment to ignore the resource bug globally
ENV DOTNET_EnableDefaultResourceItems=false

ENTRYPOINT ["dotnet", "RestaurantManagement.API.dll"]
