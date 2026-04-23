import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import KeyIcon from "@mui/icons-material/Key";
import { api } from "../api/client";

export default function User() {
    // ── state ──────────────────────────────────────────────────────────────────
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create user form
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", roleId: "" });
    const [createError, setCreateError] = useState("");
    const [creating, setCreating] = useState(false);

    // Temp password display
    const [tempPasswordInfo, setTempPasswordInfo] = useState(null); // { userId, name, password }
    const [generatingFor, setGeneratingFor] = useState(null); // userId
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // ── data loading ───────────────────────────────────────────────────────────
    const loadUsers = async () => {
        try {
            const res = await api.get("/api/users?includeInactive=true");
            setUsers(res.data);
        } catch {
            setError("Failed to load users.");
        }
    };

    const loadRoles = async () => {
        try {
            const res = await api.get("/api/roles");
            setRoles(res.data);
        } catch {
            // roles optional – degrade gracefully
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([loadUsers(), loadRoles()]);
            setLoading(false);
        })();
    }, []);

    // ── create user ────────────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateError("");
        setCreating(true);
        try {
            await api.post("/api/users", {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                roleId: Number(form.roleId),
            });
            setOpenCreate(false);
            setForm({ firstName: "", lastName: "", email: "", roleId: "" });
            setSnackbar({ open: true, message: "User created successfully.", severity: "success" });
            await loadUsers();
        } catch (err) {
            setCreateError(err?.response?.data?.error || "Failed to create user.");
        } finally {
            setCreating(false);
        }
    };

    // ── generate temp password ─────────────────────────────────────────────────
    const handleGeneratePassword = async (user) => {
        setGeneratingFor(user.userId);
        try {
            const res = await api.post(`/api/users/${user.userId}/generate-password`);
            setTempPasswordInfo({
                userId: user.userId,
                name: `${user.firstName} ${user.lastName}`,
                password: res.data.temporaryPassword,
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || "Failed to generate password.",
                severity: "error",
            });
        } finally {
            setGeneratingFor(null);
        }
    };

    // ── render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreate(true)}
                >
                    Add User
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Temp Password Banner */}
            {tempPasswordInfo && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3, fontFamily: "monospace", fontSize: "1rem" }}
                    onClose={() => setTempPasswordInfo(null)}
                >
                    <strong>Temporary password for {tempPasswordInfo.name}:</strong>{" "}
                    <Box
                        component="span"
                        sx={{
                            display: "inline-block",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: "warning.light",
                            fontWeight: 700,
                            letterSpacing: 2,
                            fontSize: "1.1rem",
                        }}
                    >
                        {tempPasswordInfo.password}
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Share this with the user. It expires in 24 hours and must be changed on first login.
                    </Typography>
                </Alert>
            )}

            {/* Users Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Password</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.userId}>
                                <TableCell>{user.firstName} {user.lastName}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{u.roleName}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={u.isActive ? "Active" : "Inactive"}
                                        color={u.isActive ? "success" : "default"}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {u.isFirstLogin ? (
                                        <Chip label="Pending Setup" color="warning" size="small" />
                                    ) : (
                                        <Chip label="Password Set" color="success" size="small" />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={
                                            generatingFor === u.userId ? (
                                                <CircularProgress size={14} />
                                            ) : (
                                                <KeyIcon />
                                            )
                                        }
                                        disabled={generatingFor === u.userId}
                                        onClick={() => handleGeneratePassword(u)}
                                    >
                                        Generate Password
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create User Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New User</DialogTitle>
                <Divider />
                <DialogContent>
                    {createError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {createError}
                        </Alert>
                    )}
                    <Box
                        component="form"
                        id="create-user-form"
                        onSubmit={handleCreate}
                        sx={{ display: "grid", gap: 2, pt: 1 }}
                    >
                        <TextField
                            label="First Name"
                            value={form.firstName}
                            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Last Name"
                            value={form.lastName}
                            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Email Address"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={form.roleId}
                                label="Role"
                                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                            >
                                {roles.map((r) => (
                                    <MenuItem key={r.roleId} value={r.roleId}>
                                        {r.roleName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
                            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={creating}>
                                {creating ? "Creating…" : "Create User"}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
