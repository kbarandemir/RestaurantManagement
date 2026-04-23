import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { setToastFn } from "../api/client";

/**
 * ToastContext – Global notification system for the application.
 * 
 * Provides a `showToast(message, severity)` function that any component
 * can call to display a temporary notification (snackbar). Severity levels
 * follow MUI Alert standards: "success", "error", "warning", "info".
 * 
 * Usage in any component:
 *   const { showToast } = useToast();
 *   showToast("Sale created successfully!", "success");
 *   showToast("Failed to save shift.", "error");
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info"); // "success" | "error" | "warning" | "info"

  /**
   * Display a toast notification.
   * @param {string} msg - The message to display
   * @param {"success"|"error"|"warning"|"info"} sev - Alert severity/colour
   */
  const showToast = useCallback((msg, sev = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  // Inject showToast into the Axios client so the global error interceptor can use it
  useEffect(() => {
    setToastFn(showToast);
  }, [showToast]);

  const handleClose = (_event, reason) => {
    // Don't close if the user clicks away — only close on timeout or explicit dismiss
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Global snackbar rendered once at the app root */}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          elevation={6}
          sx={{
            width: "100%",
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

/**
 * Hook to access the global toast notification system.
 * Must be used inside a <ToastProvider>.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}
