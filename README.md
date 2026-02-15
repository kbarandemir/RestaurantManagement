# Restaurant Management System  
**Inventory, Recipe & Sales Tracking API with React Frontend**

This project is a **Restaurant Management System** developed as part of an academic final project.  
It is a full-stack application featuring an **ASP.NET Core Web API** backend and a **React (Vite)** frontend. It focuses on **inventory management with expiry dates**, **recipe-based stock deduction**, and **role-based access control (RBAC)**.

---

## 🚀 Technologies Used

### Backend
- **ASP.NET Core Web API** (.NET 8)
- **Entity Framework Core**
- **SQL Server 2022 (Docker)**
- **Swagger / OpenAPI**
- **Clean Architecture principles**

### Frontend
- **React** (Vite)
- **Material UI (MUI)**
- **Axios**

### Tools & Devops
- **Docker Desktop**
- **Azure Data Studio / SSMS**
- **Git**

---

## 🏗️ Project Architecture

The project follows a **Clean / Layered Architecture** structure:

```
RestaurantManagement
│
├── RestaurantManagement.API          # API Layer (Controllers, Program.cs)
│
├── RestaurantManagement.Application  # Business Logic (Services, DTOs, Interfaces)
│
├── RestaurantManagement.Domain       # Core Domain Entities (No dependencies)
│
├── RestaurantManagement.Infrastructure # Data Access (DbContext, Migrations, Repositories)
│
└── restaurant-frontend               # React Frontend Application
```

### Why Clean Architecture?
- Clear separation of concerns  
- Easy maintenance and extensibility  
- Database and framework independence at the domain level  

---

## �️ Setup & Running

### Prerequisites
- .NET 8 SDK
- Node.js & npm
- Docker Desktop

### 1. Database Setup
Ensure Docker is running, then invoke the database container:
```bash
# Example command to run SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```
*Note: Update the connection string in `appsettings.json` if necessary.*

### 2. Backend (API)
Navigate to the root directory and run:
```bash
dotnet restore
dotnet run --project RestaurantManagement.API
```
The API will be available at imports `https://localhost:7127` (or configured port).
Swagger UI: `https://localhost:7127/swagger`

### 3. Frontend
Navigate to the frontend directory:
```bash
cd restaurant-frontend
npm install
npm run dev
```
The frontend will be typically available at `http://localhost:5173`.

---

## �🔐 Role-Based Access Control (RBAC)

The system supports flexible and extensible role management.

### Default Roles
- Admin, Manager, Assistant Manager, Head Chef, Chef, Waiter

### RBAC Rules
- Users have **one role**
- Roles have **multiple permissions**
- **Admin** can manage roles and permissions dynamically.

---

## 📦 Inventory & Recipes

### Inventory Management
- **Batch-based tracking** (FIFO/FEFO)
- Tracks Quantity, Expiry Date, Unit Cost
- **Inventory Rules**: Reorder levels, Expiry alerts

### Recipes & Sales
- **Recipes** link Menu Items to Ingredients (e.g., 1 Pizza -> Dough, Sauce, Cheese)
- **Sales** trigger automatic stock deduction based on recipes.
- **StockMovements** record every IN/OUT transaction for audit.

---

## 🧪 Testing

- **Swagger UI** for API endpoint testing.
- **Manual Testing** via the React Frontend (POS, Inventory screens).

---

## 📚 Author
**Kamber Baran Demir**  
Higher Diploma in Computer Science  
Web & Cloud Technologies  

---

## 📄 License
This project is developed for educational purposes only.
