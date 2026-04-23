# ── Base Image (Runtime) ──────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# ── Build Stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy all project files first to leverage Docker layer caching
COPY ["RestaurantManagement.API/RestaurantManagement.API.csproj", "RestaurantManagement.API/"]
COPY ["RestaurantManagement.Application/RestaurantManagement.Application.csproj", "RestaurantManagement.Application/"]
COPY ["RestaurantManagement.Domain/RestaurantManagement.Domain.csproj", "RestaurantManagement.Domain/"]
COPY ["RestaurantManagement.Infrastructure/RestaurantManagement.Infrastructure.csproj", "RestaurantManagement.Infrastructure/"]

# Restore everything
RUN dotnet restore "RestaurantManagement.API/RestaurantManagement.API.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/RestaurantManagement.API"

# Build the project
RUN dotnet build "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# ── Publish Stage ───────────────────────────────────────────────────────────
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ── Final Stage (Runtime) ──────────────────────────────────────────────────
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Important: SQLite needs write permissions to the folder
# In Render/Docker, we might need a persistent volume for restaurant.db later,
# but for now, we'll keep it in the same folder.
ENTRYPOINT ["dotnet", "RestaurantManagement.API.dll"]
