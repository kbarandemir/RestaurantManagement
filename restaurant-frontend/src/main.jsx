import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const qc = new QueryClient();

/**
 * Application entry point.
 * 
 * Provider hierarchy (outermost → innermost):
 *   1. React.StrictMode – development warnings
 *   2. QueryClientProvider – server state management (React Query)
 *   3. AuthProvider – JWT authentication & role context
 *   4. ToastProvider – global snackbar notifications
 *   5. RouterProvider – page routing
 */
import { SettingsProvider } from "./context/SettingsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
