# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyalarını kopyala
COPY ["RestaurantManagement.API/RestaurantManagement.API.csproj", "RestaurantManagement.API/"]
COPY ["RestaurantManagement.Application/RestaurantManagement.Application.csproj", "RestaurantManagement.Application/"]
COPY ["RestaurantManagement.Domain/RestaurantManagement.Domain.csproj", "RestaurantManagement.Domain/"]
COPY ["RestaurantManagement.Infrastructure/RestaurantManagement.Infrastructure.csproj", "RestaurantManagement.Infrastructure/"]

# Bağımlılıkları geri yükle
RUN dotnet restore "RestaurantManagement.API/RestaurantManagement.API.csproj"

# Tüm kaynak kodunu kopyala
COPY . .

# Varsa kalıntıları temizle (CS2021 hatasını önlemek için)
RUN find . -type d -name "bin" -exec rm -rf {} +
RUN find . -type d -name "obj" -exec rm -rf {} +

# API projesini derle
WORKDIR "/src/RestaurantManagement.API"
RUN dotnet build "RestaurantManagement.API.csproj" -c Release -o /app/build

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
