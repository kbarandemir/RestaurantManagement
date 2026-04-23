import { useState, useEffect } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip, Button,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Avatar, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, InputAdornment,
    Alert, CircularProgress, Tooltip, Divider, Stack
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";

const roleColor = {
    Admin: { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" },
    Manager: { bg: "#ECFEFF", color: "#0891B2", border: "#A5F3FC" },
    Chef: { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
    Staff: { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB" },
    Waiter: { bg: "#FDF4FF", color: "#9333EA", border: "#E9D5FF" },
    "Assistant Manager": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
    "Head Chef": { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    "Assistant Head Chef": { bg: "#FFF7ED", color: "#EA580C", border: "#FFEDD5" },
};

export default function UserManagement() {
    const navigate = useNavigate();
    const { role: currentUserRole } = useAuth();
    const roleSlug = (currentUserRole || "").toLowerCase();
    const canCreateUser = roleSlug === "admin" || roleSlug === "manager";

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [tab, setTab] = useState(0); // 0: All, 1: Active, 2: Inactive
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    // Create User Modal
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", roleId: "", phone: "", address: "" });

    // Temp Password state
    const [tempPasswordUser, setTempPasswordUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes] = await Promise.all([
                api.get("/api/users?includeInactive=true"),
                api.get("/api/roles")
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);

        try {
            // 1. Create the user
            const createRes = await api.post("/api/users", {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                roleId: Number(form.roleId)
            });

            const newUserId = createRes.data.userId;

            // 2. Generate temporary password
            const pwRes = await api.post(`/api/users/${newUserId}/generate-password`);

            const roleName = roles.find(r => r.roleId === Number(form.roleId))?.roleName;

            setTempPasswordUser({
                name: `${form.firstName} ${form.lastName}`,
                email: form.email,
                role: roleName,
                password: pwRes.data.temporaryPassword
            });

            // Reset form and reload list
            setForm({ firstName: "", lastName: "", email: "", roleId: "", phone: "", address: "" });
            setOpenCreate(false);
            loadData();
        } catch (err) {
            console.error(err);
            setCreateError(err.response?.data?.error || "An error occurred while creating the user.");
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    // Filter logic
    const filteredUsers = users.filter(u => {
        // Status tab
        if (tab === 1 && !u.isActive) return false;
        if (tab === 2 && u.isActive) return false;

        // Role filter
        if (roleFilter !== "All" && u.roleName !== roleFilter) return false;

        // Search
        if (search) {
            const q = search.toLowerCase();
            const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
            return fullName.includes(q) || u.email.toLowerCase().includes(q);
        }

        return true;
    });

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>User Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage team members and role-based access
                    </Typography>
                </Box>
                {canCreateUser && (
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => setOpenCreate(true)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            bgcolor: "#4F46E5",
                            color: "#FFFFFF",
                            boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
                            "&:hover": { bgcolor: "#4338CA", boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" },
                        }}
                    >
                        Create User
                    </Button>
                )}
            </Box>

            {/* Temp Password Banner */}
            {tempPasswordUser && (
                <Alert
                    severity="success"
                    onClose={() => setTempPasswordUser(null)}
                    sx={{ mb: 3, "& .MuiAlert-message": { width: "100%" } }}
                >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        User Created Successfully: {tempPasswordUser.name} ({tempPasswordUser.role})
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                        A temporary password has been securely generated. The user must use this to log in, after which they will be required to set a permanent password.
                        This temporary password will expire in 24 hours for security reasons.
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        bgcolor: "rgba(255,255,255,0.6)",
                        p: 1.5,
                        borderRadius: 1,
                        border: "1px dashed #A7F3D0"
                    }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace" }}>{tempPasswordUser.email}</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">Temporary Password</Typography>
                            <Typography variant="body1" fontWeight={700} sx={{ fontFamily: "monospace", letterSpacing: 2, color: "#065F46" }}>
                                {tempPasswordUser.password}
                            </Typography>
                        </Box>
                        <Tooltip title="Copy Password">
                            <IconButton size="small" onClick={() => copyToClipboard(tempPasswordUser.password)} sx={{ color: "#059669" }}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Users", value: users.length, color: "#4F46E5" },
                    { label: "Active", value: users.filter((u) => u.isActive).length, color: "#10B981" },
                    { label: "Inactive", value: users.filter((u) => !u.isActive).length, color: "#EF4444" },
                    { label: "Pending Setup", value: users.filter((u) => u.isFirstLogin).length, color: "#F59E0B" },
                ].map((s) => (
                    <Grid item xs={12} sm={6} md={3} key={s.label}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={0.5}>{s.label}</Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: s.color, mt: 0.5 }}>{s.value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Main Table Card */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>

                {/* Toolbar: Search & Filters */}
                <Box sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
                    <TextField
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        sx={{ minWidth: 250, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "transparent" } }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            displayEmpty
                            sx={{ bgcolor: "#F9FAFB", "& fieldset": { borderColor: "transparent" }, fontSize: 14 }}
                        >
                            <MenuItem value="All">All Roles</MenuItem>
                            {roles.map(r => (
                                <MenuItem key={r.roleId} value={r.roleName}>{r.roleName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                        px: 2,
                        pt: 1,
                        "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13 },
                        "& .Mui-selected": { color: "var(--primary)" },
                        "& .MuiTabs-indicator": { backgroundColor: "var(--primary)" },
                    }}
                >
                    <Tab label={`All (${users.length})`} />
                    <Tab label={`Active (${users.filter((u) => u.isActive).length})`} />
                    <Tab label={`Inactive (${users.filter((u) => !u.isActive).length})`} />
                </Tabs>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, py: 2 } }}>
                                <TableCell>User</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Auth Status</TableCell>
                                <TableCell>Created Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                        No users found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((u) => (
                                    <TableRow key={u.userId} sx={{ "&:hover": { bgcolor: "#FAFAFA" }, "& td": { fontSize: 13 } }}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: roleColor[u.roleName]?.bg || "#EEF2FF", color: roleColor[u.roleName]?.color || "#4F46E5" }}>
                                                    {`${u.firstName || ""} ${u.lastName || ""}`.split(" ").filter(Boolean).map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{ lineHeight: 1.3, cursor: "pointer", "&:hover": { color: "var(--primary)", textDecoration: "underline" } }}
                                                        onClick={() => navigate(`/users/${u.userId}`)}
                                                    >
                                                        {`${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unnamed User"}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={u.roleName}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: roleColor[u.roleName]?.bg || "#F3F4F6",
                                                    color: roleColor[u.roleName]?.color || "#374151",
                                                    border: `1px solid ${roleColor[u.roleName]?.border || "#E5E7EB"}`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={u.isActive ? "Active" : "Inactive"}
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: u.isActive ? "#D1FAE5" : "#FEE2E2",
                                                    color: u.isActive ? "#065F46" : "#991B1B",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {u.isFirstLogin ? (
                                                <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#D97706" }}></span>
                                                    Pending Setup
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#059669" }}></span>
                                                    Password Set
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)" }}>
                                            {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={openCreate} onClose={() => !creating && setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create New User</DialogTitle>
                <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2 }}>
                    New users will be emailed an auto-generated temporary password which they must reset on their first login.
                </Typography>
                <Divider />
                <DialogContent sx={{ px: 3, pt: 3 }}>
                    {createError && <Alert severity="error" sx={{ mb: 3 }}>{createError}</Alert>}
                    <Box component="form" id="create-user-form" onSubmit={handleCreateSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    size="small"
                                    fullWidth
                                    required
                                    value={form.firstName}
                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Last Name"
                                    size="small"
                                    fullWidth
                                    required
                                    value={form.lastName}
                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Email Address"
                                    type="email"
                                    size="small"
                                    fullWidth
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl size="small" fullWidth required>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        value={form.roleId}
                                        label="Role"
                                        onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                                    >
                                        {roles.map((r) => (
                                            <MenuItem key={r.roleId} value={r.roleId}>{r.roleName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Phone Number (Optional)"
                                    size="small"
                                    fullWidth
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Address (Optional)"
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2, px: 3 }}>
                    <Button onClick={() => setOpenCreate(false)} disabled={creating} sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="create-user-form"
                        variant="contained"
                        disabled={creating}
                        sx={{ bgcolor: "#4F46E5", color: "#FFFFFF", fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: "#4338CA", boxShadow: "none" } }}
                    >
                        {creating ? <CircularProgress size={24} color="inherit" /> : "Securely Create User"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
