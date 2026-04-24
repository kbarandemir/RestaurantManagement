# 🍽️ Restaurant Management Platform

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-12-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

A comprehensive, cloud-native full-stack application engineered to streamline hospitality operations. This platform bridges the operational gap between **front-of-house Point of Sale (POS)** transactions and **back-of-house inventory tracking** to neutralize untracked food waste and maximize profitability.

---

## ✨ Key Features

- **🔐 Cryptographic RBAC Security:** Strict Role-Based Access Control utilizing securely signed JWTs separating Admin, Manager, and Staff functionalities.
- **🛒 Dynamic POS Engine:** A highly tactical, rapid-response Point of Sale interface designed for high-stress hospitality environments.
- **📦 FEFO Inventory Algorithm:** An advanced "First-Expired-First-Out" (FEFO) internal deduction engine. Selling a "Chicken Burger" automatically subtracts the exact fractional raw ingredients from the oldest active stock batch, mathematically minimizing perishable waste.
- **👨‍🍳 Menu & Recipe Engineering:** Relational mapping linking raw intake ingredients (Liters, Kg) to sellable menu items.
- **📅 Employee Roster Matrix:** Visual scheduling engine with dynamic "Conflict Prevention" architecture to stop overlapping shift assignments.
- **📊 Real-Time Analytics:** Live dashboard capturing hourly revenue streams, wastage metrics, and raw margin breakdowns.

---

## 🏗️ Clean Architecture (Backend)

The .NET 8.0 API Backend is strictly modeled on **Clean Architecture** principles, enforcing the Dependency Inversion Principle. It is surgically separated into four layers:

1. **Domain:** Pure POCOs (`Recipe`, `Ingredient`, `Sales`). Zero external dependencies.
2. **Application:** Business Logic, Use Cases (FEFO Math), and DTO mapping.
3. **Infrastructure:** EF Core, Data persistence mapping to **SQLite**. Allows for zero-latency intra-container operations.
4. **API:** RESTful endpoints, Swagger documentation, and JWT Middleware interception.

---

## ☁️ Cloud-Native Deployment

This project has transitioned from local monolithic execution to a highly distributed, decoupled environment:
- **Backend (Render):** The .NET API is thoroughly containerized using a bespoke **Multi-Stage Dockerfile**. It operates an embedded SQLite file mapping, providing zero-cost, high-performance execution.
- **Frontend (Vercel):** The React 18 SPA is compiled via **Vite** and served via Vercel’s ultra-fast Edge Network.
- **Security:** Strict Cross-Origin Resource Sharing (CORS) whitelisting bridges communication securely across the `onrender.com` to `vercel.app` axis.

---

## 🚀 Local Development Setup

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js (v18+)](https://nodejs.org/en/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Optional, for containerized local build)

### 1. Backend Setup (.NET API)

```bash
# Clone the repository
git clone https://github.com/yourusername/RestaurantManagement.git
cd RestaurantManagement

# Restore packages and build
dotnet clean
dotnet restore
dotnet build

# Configure AppSettings
# Ensure your 'Jwt:Key' matches across environments and ConnectionString points to SQLite.

# Run the API
cd RestaurantManagement.API
dotnet run
```
*The API will establish the SQLite file (`restaurant.db`) automatically and seed the SuperAdmin credentials on its first execution.*

### 2. Frontend Setup (React/Vite)

```bash
# Open a new terminal tab
cd RestaurantManagement/restaurant-frontend

# Install node dependencies
npm install

# Setup Environment Variables
# Create a .env file and point it to the local API:
# echo "VITE_API_BASE_URL=http://localhost:5071" > .env

# Run the Vite Dev Server
npm run dev
```

---

## 📸 Screenshots

| Dashboard Analytics | POS Interface |
| :---: | :---: |
| *(Insert Screenshot Here)* | *(Insert Screenshot Here)* |

| FEFO Inventory Batches | Roster Scheduling |
| :---: | :---: |
| *(Insert Screenshot Here)* | *(Insert Screenshot Here)* |

---

## 👨‍💻 Contributing & Future Roadmap
If adapting this project for larger, multi-chain operations, consider executing the following roadmap:
1. **Implement xUnit Coverage:** Ensure Application logic holds solid test coverage before scaling.
2. **PostgreSQL Transition:** Modify `AppDbContext` to utilize a managed SQL cloud provider (AWS RDS/Azure) for multi-tenant scalability.
3. **Redis Caching:** Introduce in-memory caching to optimize real-time analytics aggregation.

---
*Developed by Kamber Baran Demir for Dublin Business School (DBS) Capstone ICT Project - 2026*
