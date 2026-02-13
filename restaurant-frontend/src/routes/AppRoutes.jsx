import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Ingredients from "../pages/Ingredients";
import Sales from "../pages/Sales";
import Forbidden from "../pages/Forbidden";
import Pos from "../pages/Pos";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/forbidden", element: <Forbidden /> },
    ],
  },
  // ...
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

  // Any logged-in user
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Dashboard /> },
        ],
      },
    ],
  },

  // Role restricted routes
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
]);
