# Restaurant Management System  
**Inventory, Recipe & Sales Tracking API**

This project is a **Restaurant Management System** developed as part of an academic final project.  
It focuses on **inventory management with expiry dates**, **recipe-based stock deduction**, and **role-based access control (RBAC)** using **ASP.NET Core Web API**, **Entity Framework Core**, and **SQL Server running in Docker**.

---

## 🚀 Technologies Used

- **ASP.NET Core Web API**
- **Entity Framework Core**
- **SQL Server 2022 (Docker)**
- **Swagger / OpenAPI**
- **Docker Desktop (macOS – Apple Silicon)**
- **Azure Data Studio**
- **Clean Architecture principles**

---

## 🏗️ Project Architecture

The project follows a **Clean / Layered Architecture** structure:

RestaurantManagement
│
├── RestaurantManagement.API
│ ├── Controllers
│ ├── Swagger configuration
│ └── Program.cs
│
├── RestaurantManagement.Application
│ └── Application services (business logic – in progress)
│
├── RestaurantManagement.Domain
│ └── Core domain entities (no framework dependencies)
│
└── RestaurantManagement.Infrastructure
├── DbContext
├── EF Core configurations
└── Migrations


### Why Clean Architecture?
- Clear separation of concerns  
- Easy maintenance and extensibility  
- Database and framework independence at the domain level  

---

## 🔐 Role-Based Access Control (RBAC)

The system supports flexible and extensible role management.

### Default Roles
- Admin  
- Manager  
- Assistant Manager  
- Head Chef  
- Chef  
- Waiter  

### RBAC Rules
- A user can have **only one role**
- A role can have **multiple permissions**
- Admin users can:
  - Create roles
  - Assign permissions
  - Change user roles
- New roles and permissions can be added dynamically

---

## 📦 Inventory Management

Inventory is managed using **batch-based tracking**.

### Ingredient Batches
Each ingredient batch includes:
- Quantity
- Expiry date
- Unit cost
- Delivery date

### Inventory Rules
- **Reorder level**
- **Expiry alert days**
- One-to-one relationship between `Ingredient` and `InventoryRule`

### Key Design Decisions
- FIFO (First Expiry First Out) is used
- Expired stock is never deducted
- Inventory changes are logged for audit purposes

---

## 🍕 Recipes & Sales Logic

### Recipes
- Each menu item has a recipe
- Recipes define ingredient quantities per unit
- Example:
  - 1 Pizza → Dough + Sauce + Cheese

### Sales
- When a sale is created:
  1. Recipe requirements are calculated
  2. Inventory is deducted from batches (FIFO)
  3. Stock movements are recorded

---

## 📊 Stock Movement Tracking

All inventory changes are recorded in the **StockMovements** table.

### StockMovement Types
- IN (Delivery)
- OUT (Sale)
- ADJUSTMENT (Manual correction)

### Important Note
Cascade delete is **intentionally disabled** to prevent loss of historical data.

---

## 🗄️ Database Setup (Docker)

SQL Server runs inside a Docker container.

### Run SQL Server with Docker (Apple Silicon compatible)

🧪 API Testing (Swagger)
Swagger UI is enabled for testing and documentation.


📚 Author
Kamber Baran Demir
Higher Diploma in Computer Science
Web & Cloud Technologies


📄 License
This project is developed for educational purposes only.

---
