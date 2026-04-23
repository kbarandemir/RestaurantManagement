import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

// ── Auth pages ────────────────────────────────────────────────────────────────
import Login from "../pages/Login";
import ChangePassword from "../pages/ChangePassword";
import Forbidden from "../pages/Forbidden";

// ── Main pages ────────────────────────────────────────────────────────────────
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import Analytics from "../pages/Analytics";
import UserManagement from "../pages/UserManagement";
import UserProfile from "../pages/UserProfile";
import Forms from "../pages/Forms";
import MenuPage from "../pages/Menu";
import Recipes from "../pages/Recipes";
import Profile from "../pages/Profile";
import Roster from "../pages/Roster";
import Settings from "../pages/Settings";

// ── Inventory sub-pages ───────────────────────────────────────────────────────
import IncomingOrders from "../pages/inventory/IncomingOrders";
import Wastage from "../pages/inventory/Wastage";
import LineChecks from "../pages/inventory/LineChecks";
import CurrentStock from "../pages/inventory/CurrentStock";
import InventorySettings from "../pages/inventory/InventorySettings";

// ── Legacy pages ──────────────────────────────────────────────────────────────
import Pos from "../pages/Pos";
import Sales from "../pages/Sales";
import Ingredients from "../pages/Ingredients";
import Reservations from "../pages/reservations/Reservations";

export const router = createBrowserRouter([
  // ── Unauthenticated ─────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/forbidden", element: <Forbidden /> },
      { path: "/change-password", element: <ChangePassword /> },
    ],
  },

  // ── Home & Basic Profile (All authenticated users) ─────────────────────────
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/profile", element: <Profile /> },
          { path: "/roster", element: <Roster /> },
        ],
      },
    ],
  },

  // ── Dashboard + Analytics (Admin, Manager, Head Chef) ───────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Head Chef"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/analytics", element: <Analytics /> },
        ],
      },
    ],
  },

  // ── Forms (Excluding Waiter) ────────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Chef", "Head Chef", "Staff"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/forms", element: <Forms /> },
        ],
      },
    ],
  },

  // ── User Management (Admin, Manager) ────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/users", element: <UserManagement /> },
          { path: "/users/:id", element: <UserProfile /> },
        ],
      },
    ],
  },

  // ── Menu & Recipes (Chef only) ──────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Chef", "Head Chef"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/menu", element: <MenuPage /> },
          { path: "/recipes", element: <Recipes /> },
        ],
      },
    ],
  },

  // ── Inventory (Admin, Manager, Chef) ────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Chef", "Head Chef"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/inventory/incoming-orders", element: <IncomingOrders /> },
          { path: "/inventory/wastage", element: <Wastage /> },
          { path: "/inventory/line-checks", element: <LineChecks /> },
          { path: "/inventory/current-stock", element: <CurrentStock /> },
          { path: "/inventory/settings", element: <InventorySettings /> },
        ],
      },
    ],
  },

  // ── Settings (Admin, Manager) ───────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },

  // ── POS (Legacy) ───────────────────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Waiter"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/pos", element: <Pos /> },
        ],
      },
    ],
  },

  // ── Sales (Legacy) ─────────────────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Waiter"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/sales", element: <Sales /> },
        ],
      },
    ],
  },

  // ── Ingredients (Legacy) ───────────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Head Chef", "Chef"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/ingredients", element: <Ingredients /> },
        ],
      },
    ],
  },

  // ── Reservations ───────────────────────────────────────────────────────────
  {
    element: <RequireAuth allowedRoles={["Admin", "Manager", "Chef", "Head Chef", "Waiter", "Staff"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/reservations", element: <Reservations /> },
        ],
      },
    ],
  },
]);
