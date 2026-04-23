import { useEffect, useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip,
    Table, TableHead, TableRow, TableCell, TableBody,
    LinearProgress, InputBase, CircularProgress, IconButton, Tooltip,
    Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem as MuiMenuItem, Tabs, Tab, Stack,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { api } from "../../api/client";

/**
 * Current Stock — Premium Dashboard for viewing all inventory levels.
 */
export default function CurrentStock() {
    const [ingredients, setIngredients] = useState([]);
    const [batches, setBatches] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tabIndex, setTabIndex] = useState(0); // 0: Active, 1: Archive/Expired

    // Add Stock Modal
    const [openAdd, setOpenAdd] = useState(false);
    const [formData, setFormData] = useState({
        ingredientId: "",
        quantity: "",
        unitCost: "",
        expiryDate: "",
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ingRes, batchRes, rulesRes] = await Promise.all([
                api.get("/api/ingredients?includeInactive=true"),
                api.get("/api/ingredientbatches?activeOnly=false"),
                api.get("/api/inventoryrules"),
            ]);
            setIngredients(Array.isArray(ingRes.data) ? ingRes.data : []);
            setBatches(Array.isArray(batchRes.data) ? batchRes.data : []);
            setRules(Array.isArray(rulesRes.data) ? rulesRes.data : []);
        } catch (e) {
            console.error("Failed to load stock data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stockItems = useMemo(() => {
        const ruleMap = {};
        rules.forEach((r) => { ruleMap[r.ingredientId] = r; });

        const ingredientData = ingredients.map((ing) => {
            const ingredientBatches = batches.filter(b => b.ingredientId === ing.ingredientId);
            
            // Active stock: IsActive && Expiry > Now && Qty > 0
            const activeBatches = ingredientBatches.filter(b => b.isActive && b.quantityOnHand > 0 && new Date(b.expiryDate) > new Date());
            const totalQty = activeBatches.reduce((sum, b) => sum + b.quantityOnHand, 0);
            
            // Expired stock: Expiry <= Now OR !IsActive (manual deactivation)
            const expiredBatches = ingredientBatches.filter(b => (new Date(b.expiryDate) <= new Date()) || (!b.isActive && b.quantityOnHand > 0));
            const totalExpiredQty = expiredBatches.reduce((sum, b) => sum + b.quantityOnHand, 0);

            const nearestExpiryBatch = activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0];

            const rule = ruleMap[ing.ingredientId];
            const reorderLevel = rule?.reorderLevel ?? 50;

            let status = "OK", statusBg = "#E0F2FE", statusColor = "#0369A1";
            if (totalQty <= 0) {
                status = "Out"; statusBg = "#FEE2E2"; statusColor = "#991B1B";
            } else if (totalQty <= reorderLevel) {
                status = "Low"; statusBg = "#FEF3C7"; statusColor = "#92400E";
            } else if (totalQty > reorderLevel * 10) {
                status = "High"; statusBg = "#D1FAE5"; statusColor = "#065F46";
            }

            let expiryDays = null;
            if (nearestExpiryBatch?.expiryDate) {
                expiryDays = Math.ceil((new Date(nearestExpiryBatch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            }

            return {
                id: ing.ingredientId,
                name: ing.name,
                unit: ing.baseUnit,
                totalQty,
                totalExpiredQty,
                reorderLevel,
                status, statusBg, statusColor,
                expiryDays,
                isActive: ing.isActive,
                hasExpiredBatches: expiredBatches.length > 0
            };
        });

        if (tabIndex === 0) {
            return ingredientData
                .filter(i => i.totalQty > 0 || i.status === "Low" || i.status === "Out")
                .sort((a, b) => {
                    const order = { Out: 0, Low: 1, OK: 2, High: 3 };
                    return (order[a.status] ?? 2) - (order[b.status] ?? 2) || a.name.localeCompare(b.name);
                });
        } else {
            // Archive: Items with expired stock or inactive ingredients
            return ingredientData
                .filter(i => i.totalExpiredQty > 0 || !i.isActive)
                .sort((a, b) => a.name.localeCompare(b.name));
        }
    }, [ingredients, batches, rules, tabIndex]);

    const filtered = stockItems.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

    const handleAddStock = async () => {
        if (!formData.ingredientId || !formData.quantity || !formData.expiryDate) return;
        try {
            await api.post("/api/ingredientbatches", {
                ingredientId: Number(formData.ingredientId),
                quantityOnHand: Number(formData.quantity),
                unitCost: Number(formData.unitCost) || 0,
                receivedDate: new Date().toISOString(),
                expiryDate: new Date(formData.expiryDate).toISOString(),
            });
            setOpenAdd(false);
            setFormData({ ingredientId: "", quantity: "", unitCost: "", expiryDate: "" });
            fetchData();
        } catch (e) {
            console.error("Failed to add stock", e);
        }
    };

    if (loading && ingredients.length === 0) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 2 }}>
                <CircularProgress size={40} thickness={4} sx={{ color: "var(--primary)" }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Calculating stock levels...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: "#111827", mb: 0.5 }}>
                        Inventory Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Comprehensive view of all pantry, kitchen, and bar inventory
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button 
                        variant="contained" 
                        startIcon={<AddRoundedIcon />} 
                        onClick={() => setOpenAdd(true)}
                        sx={{ bgcolor: "#111827", borderRadius: 2.5, px: 2.5, "&:hover": { bgcolor: "#374151" } }}
                    >
                        Add New Stock
                    </Button>
                    <IconButton onClick={fetchData} sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", "&:hover": { bgcolor: "#F9FAFB" } }}>
                        <RefreshRoundedIcon />
                    </IconButton>
                </Stack>
            </Box>

            {/* Tabs */}
            <Tabs 
                value={tabIndex} 
                onChange={(_, v) => setTabIndex(v)}
                sx={{ 
                    mb: 4, 
                    borderBottom: "1px solid #E5E7EB",
                    "& .MuiTab-root": { fontWeight: 700, fontSize: 13, textTransform: "none", minWidth: 120, color: "#9CA3AF" },
                    "& .Mui-selected": { color: "#111827" },
                    "& .MuiTabs-indicator": { bgcolor: "#111827", height: 3 }
                }}
            >
                <Tab icon={<InventoryRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Live Inventory" />
                <Tab icon={<HistoryRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Archive & Expired" />
            </Tabs>

            {/* KPI Cards (Active Only) */}
            {tabIndex === 0 && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: "Total Items", value: ingredients.filter(i => i.isActive).length, icon: <WarehouseRoundedIcon />, color: "#4F46E5" },
                        { label: "Low / Out Stock", value: ingredients.filter(i => {
                            const bts = batches.filter(b => b.ingredientId === i.ingredientId && b.isActive && b.expiryDate > new Date().toISOString());
                            const qty = bts.reduce((s, b) => s + b.quantityOnHand, 0);
                            const rule = rules.find(r => r.ingredientId === i.ingredientId);
                            return qty <= (rule?.reorderLevel ?? 50);
                        }).length, icon: <WarningAmberRoundedIcon />, color: "#EF4444" },
                        { label: "Expired Items", value: batches.filter(b => new Date(b.expiryDate) <= new Date() && b.quantityOnHand > 0).length, icon: <HistoryRoundedIcon />, color: "#F59E0B" },
                    ].map((kpi, idx) => (
                        <Grid item xs={12} md={4} key={idx}>
                            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                                <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
                                    <Avatar sx={{ bgcolor: `${kpi.color}10`, color: kpi.color, width: 56, height: 56 }}>
                                        {kpi.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={1}>
                                            {kpi.label}
                                        </Typography>
                                        <Typography variant="h4" fontWeight={800} sx={{ color: "#111827" }}>
                                            {kpi.value}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Content Table */}
            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #E5E7EB", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" }}>
                <Box sx={{ p: 3, borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", bgcolor: "#F9FAFB", borderRadius: 3, px: 2, py: 1, width: "100%", maxWidth: 400, border: "1px solid #E5E7EB" }}>
                        <SearchRoundedIcon sx={{ color: "#9CA3AF", mr: 1.5, fontSize: 20 }} />
                        <InputBase 
                            placeholder="Find ingredient..." 
                            fullWidth 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ fontSize: 14, fontWeight: 500 }} 
                        />
                    </Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                        Showing {filtered.length} items
                    </Typography>
                </Box>

                <Box sx={{ overflowX: "auto" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                                <TableCell sx={{ py: 2, fontWeight: 700, color: "#4B5563" }}>Ingredient</TableCell>
                                <TableCell sx={{ py: 2, fontWeight: 700, color: "#4B5563" }}>Quantity</TableCell>
                                <TableCell sx={{ py: 2, fontWeight: 700, color: "#4B5563" }}>Stock Level</TableCell>
                                <TableCell sx={{ py: 2, fontWeight: 700, color: "#4B5563" }} align="center">Status</TableCell>
                                <TableCell sx={{ py: 2, fontWeight: 700, color: "#4B5563" }}>Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ py: 8, textAlign: "center" }}>
                                        <Typography color="text.secondary">No items found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((item) => {
                                const qty = tabIndex === 0 ? item.totalQty : item.totalExpiredQty;
                                const maxQty = Math.max(qty, item.reorderLevel * 10, 100);
                                const levelPct = Math.min(100, (qty / maxQty) * 100);
                                return (
                                    <TableRow key={item.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                                        <TableCell sx={{ py: 2.5 }}>
                                            <Typography variant="body2" fontWeight={700} color="#111827">{item.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{item.unit}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5 }}>
                                            <Typography variant="body2" fontWeight={600}>{qty.toLocaleString()}</Typography>
                                            <Typography variant="caption" color="text.secondary">{tabIndex === 0 ? "available" : "unavailable / expired"}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5, minWidth: 150 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={qty === 0 ? 0 : Math.max(5, levelPct)} 
                                                    sx={{ 
                                                        flex: 1, 
                                                        height: 8, 
                                                        borderRadius: 4, 
                                                        bgcolor: "#F3F4F6",
                                                        "& .MuiLinearProgress-bar": { bgcolor: tabIndex === 1 ? "#EF4444" : item.statusColor }
                                                    }}
                                                />
                                                <Typography variant="caption" fontWeight={700} color="text.secondary">
                                                    {Math.round(levelPct)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5 }} align="center">
                                            <Chip 
                                                label={tabIndex === 0 ? item.status : "EXPIRED"} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 800, 
                                                    fontSize: 10, 
                                                    textTransform: "uppercase",
                                                    bgcolor: tabIndex === 1 ? "#FEE2E2" : item.statusBg, 
                                                    color: tabIndex === 1 ? "#EF4444" : item.statusColor,
                                                    borderRadius: 1.5,
                                                    px: 1
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5 }}>
                                            {tabIndex === 0 ? (
                                                item.expiryDays !== null ? (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.expiryDays < 5 ? "#EF4444" : "#10B981" }} />
                                                        <Typography variant="body2" fontWeight={500} color={item.expiryDays < 5 ? "#EF4444" : "inherit"}>
                                                            {item.expiryDays}d remaining
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                                )
                                            ) : (
                                                <Typography variant="caption" color="text.warning" fontWeight={600}>ACTION REQUIRED</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            </Card>

            {/* Add Stock Dialog */}
            <Dialog 
                open={openAdd} 
                onClose={() => setOpenAdd(false)}
                PaperProps={{ sx: { borderRadius: 4, width: "100%", maxWidth: 450 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, p: 3, pb: 1 }}>Inventory Inflow</DialogTitle>
                <DialogContent sx={{ p: 3, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Add manual stock adjustments or receive new batch.
                    </Typography>
                    
                    <Stack spacing={2.5}>
                        <TextField
                            select
                            label="Select Ingredient"
                            fullWidth
                            value={formData.ingredientId}
                            onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
                        >
                            {ingredients.filter(i => i.isActive).map((ing) => (
                                <MuiMenuItem key={ing.ingredientId} value={ing.ingredientId}>
                                    {ing.name} ({ing.baseUnit})
                                </MuiMenuItem>
                            ))}
                        </TextField>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Quantity"
                                type="number"
                                fullWidth
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                            <TextField
                                label="Unit Cost (€)"
                                type="number"
                                fullWidth
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                            />
                        </Stack>

                        <TextField
                            label="Expiry Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.expiryDate}
                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setOpenAdd(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAddStock}
                        disabled={!formData.ingredientId || !formData.quantity || !formData.expiryDate}
                        sx={{ bgcolor: "#111827", borderRadius: 2, px: 3, "&:hover": { bgcolor: "#374151" } }}
                    >
                        Receive Stock
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
