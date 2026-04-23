import { useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip, Button,
    Switch, IconButton, InputBase, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert,
    Tabs, Tab
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import LocalPizzaRoundedIcon from "@mui/icons-material/LocalPizzaRounded";
import LocalCafeRoundedIcon from "@mui/icons-material/LocalCafeRounded";
import CakeRoundedIcon from "@mui/icons-material/CakeRounded";
import EmojiFoodBeverageRoundedIcon from "@mui/icons-material/EmojiFoodBeverageRounded";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const categoryColor = {
    Mains: { bg: "#EEF2FF", color: "#4F46E5" },
    Starters: { bg: "#FEF3C7", color: "#D97706" },
    Desserts: { bg: "#FCE7F3", color: "#DB2777" },
    Beverages: { bg: "#ECFEFF", color: "#0891B2" },
    Pasta: { bg: "#FEF3C7", color: "#D97706" },
    Pizza: { bg: "#FFEDD5", color: "#EA580C" },
    Salads: { bg: "#E0F2FE", color: "#0284C7" },
    Drinks: { bg: "#ECFEFF", color: "#0891B2" },
};

function getCategoryIcon(catName) {
    const l = catName?.toLowerCase() || "";
    if (l.includes("pizza")) return <LocalPizzaRoundedIcon fontSize="large" />;
    if (l.includes("dessert")) return <CakeRoundedIcon fontSize="large" />;
    if (l.includes("drink") || l.includes("beverage")) return <LocalCafeRoundedIcon fontSize="large" />;
    if (l.includes("starter") || l.includes("salad")) return <EmojiFoodBeverageRoundedIcon fontSize="large" />;
    return <RestaurantRoundedIcon fontSize="large" />;
}

function euro(n) {
    if (typeof n !== 'number') return "€0,00";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

export default function MenuPage() {
    const { role } = useAuth();
    const roleSlug = (role || "").toLowerCase();
    const canEdit = roleSlug === "admin" || roleSlug === "manager";
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [editItem, setEditItem] = useState(null); // holds {id, price, name, ...}

    const { data: menuItems = [], isLoading, isError } = useQuery({
        queryKey: ["menuItems"],
        queryFn: async () => {
            const res = await api.get("/api/menuitems?includeInactive=true");
            return res.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (payload) => {
            await api.put(`/api/menuitems/${payload.id}`, {
                name: payload.name,
                price: parseFloat(payload.price),
                categoryId: payload.categoryId,
                isActive: payload.isActive
            });
        },
        onSuccess: () => queryClient.invalidateQueries(["menuItems"]),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/api/menuitems/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries(["menuItems"]),
    });

    const toggleAvailable = (item) => {
        if (!canEdit) return;
        updateMutation.mutate({
            id: item.menuItemId,
            name: item.name,
            price: item.price,
            categoryId: item.categoryId,
            isActive: !item.isActive
        });
    };

    const handleDelete = (id) => {
        if (!canEdit) return;
        if (confirm("Are you sure you want to drop this item from the active menu?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleSavePrice = () => {
        if (!editItem || !canEdit) return;
        updateMutation.mutate({
            id: editItem.menuItemId,
            name: editItem.name,
            price: editItem.price,
            categoryId: editItem.categoryId,
            isActive: editItem.isActive
        });
        setEditItem(null);
    };

    const categories = useMemo(() => {
        const cats = new Set(menuItems.map(i => i.category || "Uncategorized"));
        return ["All", ...Array.from(cats).sort()];
    }, [menuItems]);

    const filtered = useMemo(() => {
        return menuItems.filter((i) => {
            const matchesSearch = i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase());
            const matchesTab = activeTab === "All" || (i.category || "Uncategorized") === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [menuItems, search, activeTab]);

    if (isLoading) {
        return <Box sx={{ display: "flex", p: 4, justifyContent: "center" }}><CircularProgress size={30} /></Box>;
    }

    if (isError) {
        return <Box sx={{ p: 4 }}><Alert severity="error">Failed to load menu items.</Alert></Box>;
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Menu Editor</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {canEdit ? "Add, edit, and manage menu items — Manager access" : "View menu items — Read only access"}
                    </Typography>
                </Box>
                {canEdit && (
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
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
                        Add Item
                    </Button>
                )}
            </Box>

            {/* Search */}
            <Box
                sx={{
                    display: "flex", alignItems: "center",
                    backgroundColor: "var(--bg-card)", borderRadius: 2.5,
                    px: 2, py: 0.8, mb: 3,
                    border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-sm)",
                    maxWidth: 400,
                }}
            >
                <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-tertiary)", mr: 1 }} />
                <InputBase
                    placeholder="Search menu items…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ fontSize: 13, fontFamily: "var(--font-family)", flex: 1 }}
                />
            </Box>

            {/* Tabs for Category filtering */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(_, newValue) => setActiveTab(newValue)} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: 40, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40, py: 1 } }}
                >
                    {categories.map((cat) => (
                        <Tab key={cat} label={cat} value={cat} />
                    ))}
                </Tabs>
            </Box>

            {/* Grid of items */}
            <Grid container spacing={2}>
                {filtered.map((item) => (
                    <Grid item xs={12} sm={6} lg={4} xl={3} key={item.menuItemId}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: "1px solid var(--border-color)",
                                boxShadow: "var(--shadow-sm)",
                                transition: "all 0.2s ease",
                                opacity: item.isActive ? 1 : 0.6,
                                "&:hover": { boxShadow: "var(--shadow-md)", borderColor: "var(--primary)" },
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={{ color: "var(--text-tertiary)" }}>
                                            {getCategoryIcon(item.category)}
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>{item.name}</Typography>
                                            <Chip
                                                label={item.category || "Uncategorized"}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: 10, fontWeight: 700, mt: 0.5,
                                                    bgcolor: categoryColor[item.category]?.bg || "#F3F4F6",
                                                    color: categoryColor[item.category]?.color || "#4B5563",
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ color: "var(--primary)" }}>
                                        {euro(item.price)}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Switch
                                            checked={item.isActive}
                                            disabled={!canEdit || updateMutation.isPending}
                                            onChange={() => toggleAvailable(item)}
                                            size="small"
                                            sx={{
                                                "& .Mui-checked": { color: "#10B981" },
                                                "& .Mui-checked + .MuiSwitch-track": { backgroundColor: "#10B981" },
                                            }}
                                        />
                                        {canEdit && (
                                            <>
                                                <IconButton disabled={updateMutation.isPending} size="small" onClick={() => setEditItem({ ...item })}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                                                <IconButton disabled={deleteMutation.isPending} size="small" onClick={() => handleDelete(item.menuItemId)}><DeleteRoundedIcon sx={{ fontSize: 16, color: "#EF4444" }} /></IconButton>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Edit Price Dialog */}
            <Dialog open={Boolean(editItem)} onClose={() => setEditItem(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Item</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>Modify details for <strong>{editItem?.name}</strong>.</Typography>
                    <TextField
                        fullWidth
                        label="Price (€)"
                        type="number"
                        variant="outlined"
                        size="small"
                        disabled={updateMutation.isPending}
                        value={editItem?.price || ""}
                        onChange={(e) => setEditItem(prev => ({ ...prev, price: e.target.value }))}
                        inputProps={{ step: "0.10" }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEditItem(null)} sx={{ color: "var(--text-secondary)", textTransform: "none" }}>Cancel</Button>
                    <Button onClick={handleSavePrice} disabled={updateMutation.isPending} variant="contained" sx={{ bgcolor: "#4F46E5", color: "#FFFFFF", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#4338CA" } }}>Save Changes</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
