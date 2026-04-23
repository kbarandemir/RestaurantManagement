import { useState, useEffect } from "react";
import {
    Box, Typography, Avatar, Divider, Chip, IconButton, Card, CardContent,
    List, ListItemButton, ListItemText, Grid, TextField, Button,
    Table, TableBody, TableRow, TableCell, TableHead, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

/* ── Secondary sidebar tabs ─────────────────────────────────────────────── */
const TABS = [
    { key: "profile", label: "My Profile", icon: PersonRoundedIcon },
    { key: "security", label: "Security", icon: LockRoundedIcon },
    { key: "roster", label: "Roster", icon: CalendarMonthRoundedIcon },
];

const roleColor = {
    Admin: "#4F46E5", Manager: "#0891B2", Chef: "#D97706",
    "Head Chef": "#D97706", Staff: "#6B7280", Waiter: "#6B7280",
};

/* ── Info row helper ────────────────────────────────────────────────────── */
function InfoField({ label, value }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontSize={11.5}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={600} fontSize={13.5} noWrap>
                {value || "—"}
            </Typography>
        </Box>
    );
}

/* ── Section card wrapper ───────────────────────────────────────────────── */
function SectionCard({ title, onEdit, children }) {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                mb: 2,
            }}
        >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
                    {onEdit && (
                        <Chip
                            icon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                            label="Edit"
                            size="small"
                            variant="outlined"
                            onClick={onEdit}
                            sx={{
                                fontWeight: 600, fontSize: 12, borderRadius: 2,
                                borderColor: "#E5E7EB", color: "#374151",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#F3F4F6" },
                            }}
                        />
                    )}
                </Box>
                {children}
            </CardContent>
        </Card>
    );
}

/* ── Tab: My Profile ────────────────────────────────────────────────────── */
function MyProfileTab({ user, role }) {
    const rc = roleColor[role] || "#6B7280";
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        country: user?.country || "",
        city: user?.city || "",
        postalCode: user?.postalCode || "",
        taxId: user?.taxId || "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                country: user.country || "",
                city: user.city || "",
                postalCode: user.postalCode || "",
                taxId: user.taxId || "",
            });
        }
    }, [user]);

    const updateMut = useMutation({
        mutationFn: async (data) => {
            await api.put(`/api/Users/${user.userId}`, {
                ...user, // preserve current fields
                ...data, // overwrite with form data
            });
        },
        onSuccess: () => {
            setIsEditing(false);
            window.location.reload(); 
        }
    });

    const handleSave = () => {
        updateMut.mutate(formData);
    };

    return (
        <>
            {/* User header card */}
            <SectionCard title="">
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 64, height: 64, fontSize: 24, fontWeight: 700,
                            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                        }}
                    >
                        {(user?.email?.[0] || role?.[0] || "U").toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} fontSize={17}>
                            {user ? `${user.firstName} ${user.lastName}` : user?.email || "User"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontSize={13}>
                            {role || "Staff"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.city ? `${user.city}, ${user.country || "UK"}` : "Location not set"}
                        </Typography>
                    </Box>
                </Box>
            </SectionCard>

            {/* Personal Information */}
            <SectionCard title="Personal Information" onEdit={() => setIsEditing(true)}>
                <Grid container spacing={3}>
                    <Grid item xs={6}><InfoField label="First Name" value={user?.firstName || "N/A"} /></Grid>
                    <Grid item xs={6}><InfoField label="Last Name" value={user?.lastName || "N/A"} /></Grid>
                    <Grid item xs={6}><InfoField label="Email address" value={user?.email || "N/A"} /></Grid>
                    <Grid item xs={6}><InfoField label="Phone" value={user?.phoneNumber || "N/A"} /></Grid>
                    <Grid item xs={12}><InfoField label="Bio" value={role || "Team Member"} /></Grid>
                </Grid>
            </SectionCard>

            {/* Address */}
            <SectionCard title="Address" onEdit={() => setIsEditing(true)}>
                <Grid container spacing={3}>
                    <Grid item xs={6}><InfoField label="Country" value={user?.country || "N/A"} /></Grid>
                    <Grid item xs={6}><InfoField label="City / State" value={user?.city || "N/A"} /></Grid>
                    <Grid item xs={6}><InfoField label="Postal Code" value={user?.postalCode || "N/A"} /></Grid>
                    <Grid item xs={6}><InfoField label="TAX ID" value={user?.taxId || "N/A"} /></Grid>
                </Grid>
            </SectionCard>

            <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Profile</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <TextField 
                                label="First Name" fullWidth size="small"
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                label="Last Name" fullWidth size="small"
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                label="Email" fullWidth size="small"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                label="Phone Number" fullWidth size="small"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                label="Country" fullWidth size="small"
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                label="City" fullWidth size="small"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                label="Postal Code" fullWidth size="small"
                                value={formData.postalCode}
                                onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                label="Tax ID" fullWidth size="small"
                                value={formData.taxId}
                                onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setIsEditing(false)} sx={{ color: "text.secondary", textTransform: "none" }}>Cancel</Button>
                    <Button onClick={handleSave} disabled={updateMut.isPending} variant="contained" sx={{ bgcolor: "#4F46E5", textTransform: "none", borderRadius: 2 }}>Save Changes</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

/* ── Tab: Security ──────────────────────────────────────────────────────── */
function SecurityTab() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("");
    const passwordMut = useMutation({
        mutationFn: async () => {
            await api.post('/api/auth/update-password', {
                currentPassword,
                newPassword,
                confirmPassword
            });
        },
        onSuccess: () => {
            setStatus("Password successfully updated.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (err) => {
            setStatus(err?.response?.data?.message || err?.message || "Password change failed.");
        }
    });

    return (
        <>
            <SectionCard title="Change Password">
                {status && (
                    <Typography variant="body2" color={status.includes("successfully") ? "success.main" : "error.main"} sx={{ mb: 2 }}>
                        {status}
                    </Typography>
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField label="Current Password" type="password" size="small" fullWidth value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField label="New Password" type="password" size="small" fullWidth value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField label="Confirm Password" type="password" size="small" fullWidth value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                        <Button 
                            variant="contained" 
                            disabled={passwordMut.isPending}
                            onClick={() => passwordMut.mutate()}
                            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" } }}
                        >
                            {passwordMut.isPending ? "Updating..." : "Update Password"}
                        </Button>
                    </Grid>
                </Grid>
            </SectionCard>
        </>
    );
}

/* ── Tab: Roster ────────────────────────────────────────────────────────── */
function RosterTab({ user }) {
    const [shiftsData, setShiftsData] = useState([]);
    
    useEffect(() => {
        const fetchRoster = async () => {
            const now = new Date();
            const day = now.getDay() || 7; 
            const monday = new Date(now);
            monday.setDate(now.getDate() - day + 1);
            monday.setHours(0,0,0,0);
            
            const localDateStr = monday.toLocaleDateString('en-CA'); // YYYY-MM-DD
            try {
                const res = await api.get(`/api/Roster?weekStart=${localDateStr}`);
                
                const userShifts = res.data.filter(s => s.userId === user?.userId);

                // Build a weekly array
                const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                const mapped = days.map((dayName, idx) => {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + idx);
                    const dStr = d.toLocaleDateString('en-CA');
                    
                    const shiftForDay = userShifts.find(s => s.date === dStr);
                    if (shiftForDay) {
                        return { day: dayName, shift: `${shiftForDay.startTime.substring(0,5)} – ${shiftForDay.endTime.substring(0,5)}`, status: shiftForDay.isPublished ? "Confirmed" : "Draft" };
                    }
                    return { day: dayName, shift: "Off", status: "—" };
                });
                
                setShiftsData(mapped);
            } catch (err) {
                console.error("Failed to fetch roster", err);
            }
        };
        fetchRoster();
    }, [user?.userId]);

    return (
        <SectionCard title="This Week's Roster">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Shift</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {shiftsData.map((s) => (
                        <TableRow key={s.day}>
                            <TableCell sx={{ fontSize: 13 }}>{s.day}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{s.shift}</TableCell>
                            <TableCell>
                                <Chip
                                    label={s.status}
                                    size="small"
                                    sx={{
                                        fontSize: 11, fontWeight: 600, height: 22,
                                        bgcolor: s.status === "Confirmed" ? "#DCFCE7" : s.status === "Draft" ? "#FEF3C7" : "#F3F4F6",
                                        color: s.status === "Confirmed" ? "#16A34A" : s.status === "Draft" ? "#D97706" : "#9CA3AF",
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </SectionCard>
    );
}

/* ── Main Profile Page ──────────────────────────────────────────────────── */
export default function Profile() {
    const { user, role } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");

    const renderContent = () => {
        switch (activeTab) {
            case "profile": return <MyProfileTab user={user} role={role} />;
            case "security": return <SecurityTab />;
            case "roster": return <RosterTab user={user} />;
            default: return <MyProfileTab user={user} role={role} />;
        }
    };

    return (
        <Box sx={{ display: "flex", gap: 0, minHeight: "calc(100vh - 130px)" }}>

            {/* ── Secondary sidebar ──────────────────────────────────────────── */}
            <Box
                sx={{
                    width: 200,
                    minWidth: 200,
                    borderRight: "1px solid #E5E7EB",
                    bgcolor: "#FFFFFF",
                    borderRadius: "12px 0 0 12px",
                    py: 2,
                }}
            >
                <List disablePadding>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <ListItemButton
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                sx={{
                                    mx: 1,
                                    mb: 0.3,
                                    borderRadius: 2,
                                    py: 1,
                                    px: 1.5,
                                    bgcolor: isActive ? "#EEF2FF" : "transparent",
                                    color: isActive ? "#4F46E5" : "#374151",
                                    "&:hover": { bgcolor: isActive ? "#EEF2FF" : "#F3F4F6" },
                                }}
                            >
                                <Icon sx={{ fontSize: 18, mr: 1.25, color: isActive ? "#4F46E5" : "#9CA3AF" }} />
                                <ListItemText
                                    primary={tab.label}
                                    primaryTypographyProps={{
                                        fontSize: 13,
                                        fontWeight: isActive ? 700 : 500,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            {/* ── Content area ───────────────────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    p: 3,
                    bgcolor: "#FAFBFC",
                    borderRadius: "0 12px 12px 0",
                    overflowY: "auto",
                }}
            >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                    {TABS.find((t) => t.key === activeTab)?.label}
                </Typography>
                {renderContent()}
            </Box>
        </Box>
    );
}
