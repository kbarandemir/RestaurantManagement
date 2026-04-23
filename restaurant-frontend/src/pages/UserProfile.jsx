import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Card, CardContent, Typography, Grid, Chip, Button,
    CircularProgress, Alert, Divider, Avatar
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { api } from "../api/client";

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

export default function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/api/users/${id}`);
                setUser(res.data);
            } catch (err) {
                console.error(err);
                setError("User not found or you don't have permission to view this profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
    if (error) return (
        <Box sx={{ p: 3 }}>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/users")} sx={{ mb: 3 }}>Back to Users</Button>
            <Alert severity="error">{error}</Alert>
        </Box>
    );
    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%", maxWidth: 800, mx: "auto" }}>
            <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate("/users")}
                sx={{ mb: 3, color: "text.secondary", "&:hover": { bgcolor: "transparent", color: "var(--primary)" } }}
            >
                Back to User Management
            </Button>

            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", overflow: "hidden" }}>
                {/* Header Cover Area */}
                <Box sx={{ height: 120, bgcolor: "var(--primary-light)", position: "relative" }} />

                <CardContent sx={{ pt: 0, px: 4, pb: 4, position: "relative" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                            {/* Avatar overlapping the cover */}
                            <Avatar
                                sx={{
                                    width: 96, height: 96,
                                    mt: -6, // pull up over the cover background
                                    border: "4px solid white",
                                    boxShadow: "var(--shadow-sm)",
                                    fontSize: 32, fontWeight: 700,
                                    bgcolor: roleColor[user.roleName]?.bg || "#EEF2FF",
                                    color: roleColor[user.roleName]?.color || "#4F46E5"
                                }}
                            >
                                {`${user.firstName} ${user.lastName}`.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                            </Avatar>
                            <Box sx={{ pb: 1 }}>
                                <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: -0.5, mb: 0.5 }}>{user.firstName} {user.lastName}</Typography>
                                <Chip
                                    label={user.roleName}
                                    size="small"
                                    sx={{
                                        height: 24, fontSize: 12, fontWeight: 700,
                                        bgcolor: roleColor[user.roleName]?.bg || "#F3F4F6",
                                        color: roleColor[user.roleName]?.color || "#374151",
                                        border: `1px solid ${roleColor[user.roleName]?.border || "#E5E7EB"}`,
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ pb: 1 }}>
                            <Chip
                                label={user.isActive ? "Active Account" : "Inactive Account"}
                                sx={{
                                    fontWeight: 700, borderRadius: 1.5,
                                    bgcolor: user.isActive ? "#D1FAE5" : "#FEE2E2",
                                    color: user.isActive ? "#065F46" : "#991B1B",
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                                    Email Address
                                </Typography>
                                <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {user.email}
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                                    Account Type
                                </Typography>
                                <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {user.roleName}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                                    Location
                                </Typography>
                                <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                                    Main Branch (System Default)
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                                    Created Date
                                </Typography>
                                <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {formatDate(user.createdAt)}
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                                    Last Login Date
                                </Typography>
                                <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {formatDate(user.lastLoginAt)}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 4 }}>
                This profile page is view-only. Modifications to permissions must be requested through System Administrators.
            </Typography>
        </Box>
    );
}
