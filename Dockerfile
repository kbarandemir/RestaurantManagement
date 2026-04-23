# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Tüm .csproj dosyalarını kopyala ve restore et
COPY ["RestaurantManagement.API/RestaurantManagement.API.csproj", "RestaurantManagement.API/"]
COPY ["RestaurantManagement.Application/RestaurantManagement.Application.csproj", "RestaurantManagement.Application/"]
COPY ["RestaurantManagement.Domain/RestaurantManagement.Domain.csproj", "RestaurantManagement.Domain/"]
COPY ["RestaurantManagement.Infrastructure/RestaurantManagement.Infrastructure.csproj", "RestaurantManagement.Infrastructure/"]

RUN dotnet restore "RestaurantManagement.API/RestaurantManagement.API.csproj"

# Tüm kaynak kodunu kopyala
COPY . .

# API projesini derle
WORKDIR "/src/RestaurantManagement.API"
RUN dotnet build "RestaurantManagement.API.csproj" -c Release -o /app/build /p:GenerateResourceWarnOnMissingSource=true

# Publish Stage
FROM build AS publish
RUN dotnet publish "RestaurantManagement.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# SQLite veritabanı dosyası için gerekli izinler
USER root
RUN mkdir -p /app/Data && chmod 777 /app/Data

ENTRYPOINT ["dotnet", "RestaurantManagement.API.dll"]
