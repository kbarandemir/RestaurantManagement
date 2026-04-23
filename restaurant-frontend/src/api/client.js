import axios from "axios";

/**
 * Axios API Client — Centralised HTTP client for all backend communication.
 *
 * Configuration:
 *   - Base URL is read from the VITE_API_BASE_URL environment variable
 *   - Every request automatically attaches the JWT Bearer token from localStorage
 *   - 401 responses trigger automatic session cleanup and redirect to /login
 *
 * Toast Integration:
 *   The client exposes a `setToastFn()` method that the ToastContext calls
 *   once on mount to inject the showToast function. This allows the interceptor
 *   to show user-friendly error notifications without tight coupling.
 */

// Create the Axios instance with the configured base URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// ── Request Interceptor ─────────────────────────────────────────────────────
// Attaches the JWT access token to every outgoing request's Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Toast Injection ─────────────────────────────────────────────────────────
// The toast function is injected at runtime by ToastContext to avoid circular imports
let _showToast = null;

/**
 * Called by ToastContext on mount to provide the global showToast function.
 * This decouples the API layer from React's component tree.
 */
export function setToastFn(fn) {
  _showToast = fn;
}

// ── Response Interceptor ────────────────────────────────────────────────────
// Handles authentication failures (401) and displays user-friendly error toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear session and force re-login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (status === 403) {
      // User lacks the required role/permission for this endpoint
      _showToast?.("You don't have permission to perform this action.", "warning");
    } else if (status === 400) {
      // Validation error — extract server message if available
      const msg = error.response?.data?.error
        || error.response?.data?.title
        || "Invalid request. Please check your input.";
      _showToast?.(msg, "error");
    } else if (status >= 500) {
      // Server-side failure
      _showToast?.("Server error. Please try again later.", "error");
    } else if (!error.response) {
      // Network failure (no response received)
      _showToast?.("Network error. Please check your connection.", "error");
    }

    return Promise.reject(error);
  }
);
