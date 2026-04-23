import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ChangePassword() {
    const { requiresPasswordChange, pendingEmail, pendingActivationCode, completePasswordChange } =
        useAuth();
    const nav = useNavigate();

    const [tempPassword, setTempPassword] = useState(pendingActivationCode ?? "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Guard: only accessible via first-login flow
    if (!requiresPasswordChange) {
        nav("/login", { replace: true });
        return null;
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/api/auth/change-password", {
                email: pendingEmail,
                activationCode: tempPassword,
                newPassword,
                confirmPassword,
            });
            completePasswordChange(res.data);
            nav("/", { replace: true });
        } catch (err) {
            setError(
                err?.response?.data?.message || err?.message || "Password change failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
                Set Your Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This is your first login. Please set a new password to continue.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
                <TextField
                    label="Temporary Password"
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    helperText="Enter the temporary password provided by your administrator."
                />

                <TextField
                    label="New Password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowNew((v) => !v)} edge="end">
                                    {showNew ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    label="Confirm New Password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
                                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? "Updating…" : "Set Password & Continue"}
                </Button>
            </Box>
        </Paper>
    );
}
