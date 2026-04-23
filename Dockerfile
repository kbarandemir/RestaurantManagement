# ── Base Image (Runtime) ──────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# ── Build Stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files for restore
COPY ["RestaurantManagement.API/RestaurantManagement.API.csproj", "RestaurantManagement.API/"]
COPY ["RestaurantManagement.Application/RestaurantManagement.Application.csproj", "RestaurantManagement.Application/"]
COPY ["RestaurantManagement.Infrastructure/RestaurantManagement.Infrastructure.csproj", "RestaurantManagement.Infrastructure/"]
COPY ["RestaurantManagement.Domain/RestaurantManagement.Domain.csproj", "RestaurantManagement.Domain/"]

# Restore dependencies
RUN dotnet restore "RestaurantManagement.API/RestaurantManagement.API.csproj"

# Copy full source tree
COPY . .

# Build
WORKDIR "/src/RestaurantManagement.API"
RUN dotnet build "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# ── Publish Stage ───────────────────────────────────────────────────────────
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ── Final Stage (Runtime) ──────────────────────────────────────────────────
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RestaurantManagement.API.dll"]
