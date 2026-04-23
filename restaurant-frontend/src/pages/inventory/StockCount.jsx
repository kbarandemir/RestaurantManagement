/**
 * Stock Count — Live inventory levels pulled from the backend.
 *
 * Data source: GET /api/ingredientbatches (all active batches)
 *              GET /api/ingredients       (ingredient metadata)
 *
 * Groups batches by ingredient, sums QuantityOnHand, and compares
 * against the InventoryRule.ReorderLevel to determine stock status.
 */
import { useEffect, useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip,
    Table, TableHead, TableRow, TableCell, TableBody,
    LinearProgress, InputBase, CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { api } from "../../api/client";

export default function StockCount() {
    const [ingredients, setIngredients] = useState([]);
    const [batches, setBatches] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Fetch ingredients, batches, and inventory rules on mount
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [ingRes, batchRes, rulesRes] = await Promise.all([
                    api.get("/api/ingredients?includeInactive=false"),
                    api.get("/api/ingredientbatches?activeOnly=true"),
                    api.get("/api/inventoryrules"),
                ]);
                if (alive) {
                    setIngredients(Array.isArray(ingRes.data) ? ingRes.data : []);
                    setBatches(Array.isArray(batchRes.data) ? batchRes.data : []);
                    setRules(Array.isArray(rulesRes.data) ? rulesRes.data : []);
                }
            } catch (e) {
                console.error("Failed to load stock data", e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Aggregate batches per ingredient: sum qty, find nearest expiry
    const stockItems = useMemo(() => {
        const ruleMap = {};
        rules.forEach((r) => { ruleMap[r.ingredientId] = r; });

        const grouped = {};
        batches.forEach((b) => {
            if (!grouped[b.ingredientId]) {
                grouped[b.ingredientId] = { totalQty: 0, nearestExpiry: null, batchCount: 0 };
            }
            grouped[b.ingredientId].totalQty += b.quantityOnHand;
            grouped[b.ingredientId].batchCount += 1;
            const exp = b.expiryDate ? new Date(b.expiryDate) : null;
            if (exp && (!grouped[b.ingredientId].nearestExpiry || exp < grouped[b.ingredientId].nearestExpiry)) {
                grouped[b.ingredientId].nearestExpiry = exp;
            }
        });

        return ingredients.map((ing) => {
            const g = grouped[ing.ingredientId] || { totalQty: 0, nearestExpiry: null, batchCount: 0 };
            const rule = ruleMap[ing.ingredientId];
            const reorderLevel = rule?.reorderLevel ?? 0;
            const expiryAlertDays = rule?.expiryAlertDays ?? 7;

            // Determine stock status
            let status = "OK", statusBg = "#DBEAFE", statusColor = "#1E40AF";
            if (g.totalQty <= 0) {
                status = "Out"; statusBg = "#FEE2E2"; statusColor = "#991B1B";
            } else if (reorderLevel > 0 && g.totalQty <= reorderLevel) {
                status = "Low"; statusBg = "#FEF3C7"; statusColor = "#92400E";
            } else if (g.totalQty > reorderLevel * 3) {
                status = "High"; statusBg = "#D1FAE5"; statusColor = "#065F46";
            }

            // Days until nearest expiry
            let expiryDays = null;
            if (g.nearestExpiry) {
                expiryDays = Math.ceil((g.nearestExpiry - new Date()) / (1000 * 60 * 60 * 24));
            }

            return {
                id: ing.ingredientId,
                name: ing.name,
                unit: ing.baseUnit,
                totalQty: g.totalQty,
                batchCount: g.batchCount,
                reorderLevel,
                status, statusBg, statusColor,
                expiryDays,
                nearestExpiry: g.nearestExpiry,
            };
        }).sort((a, b) => {
            // Sort: Out first, Low second, then alphabetical
            const order = { Out: 0, Low: 1, OK: 2, High: 3 };
            return (order[a.status] ?? 2) - (order[b.status] ?? 2) || a.name.localeCompare(b.name);
        });
    }, [ingredients, batches, rules]);

    const filtered = stockItems.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    const lowCount = stockItems.filter((s) => s.status === "Low" || s.status === "Out").length;

    if (loading) {
        return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Stock Count</Typography>
                <Typography variant="body2" color="text.secondary">Live inventory levels from ingredient batches</Typography>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Ingredients", value: stockItems.length, color: "#4F46E5" },
                    { label: "Low / Out of Stock", value: lowCount, color: "#EF4444" },
                    { label: "Adequate", value: stockItems.length - lowCount, color: "#10B981" },
                    { label: "Total Batches", value: batches.length, color: "#F59E0B" },
                ].map((s) => (
                    <Grid item xs={6} md={3} key={s.label}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                                <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Search */}
            <Box sx={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-card)", borderRadius: 2.5, px: 2, py: 0.8, mb: 2, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", maxWidth: 400 }}>
                <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-tertiary)", mr: 1 }} />
                <InputBase placeholder="Search ingredients…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, fontFamily: "var(--font-family)", flex: 1 }} />
            </Box>

            {/* Table */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 } }}>
                            <TableCell>Ingredient</TableCell><TableCell>Unit</TableCell><TableCell>Stock on Hand</TableCell><TableCell>Level</TableCell><TableCell>Status</TableCell><TableCell>Nearest Expiry</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>No ingredients found.</TableCell></TableRow>
                        ) : filtered.map((s) => {
                            const maxQty = Math.max(s.reorderLevel * 4, s.totalQty, 1);
                            const pct = Math.min(100, Math.round((s.totalQty / maxQty) * 100));
                            return (
                                <TableRow key={s.id} sx={{ "&:hover": { bgcolor: "#FAFAFA" }, "& td": { fontSize: 13 } }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                                    <TableCell><Chip label={s.unit} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: "#F3F4F6" }} /></TableCell>
                                    <TableCell>{s.totalQty.toLocaleString()} {s.unit}</TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>
                                        <LinearProgress variant="determinate" value={pct}
                                            sx={{
                                                height: 6, borderRadius: 3, bgcolor: "#F3F4F6",
                                                "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: s.status === "Out" || s.status === "Low" ? "#EF4444" : s.status === "High" ? "#10B981" : "#4F46E5" },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={s.status} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: s.statusBg, color: s.statusColor }} />
                                    </TableCell>
                                    <TableCell sx={{ color: s.expiryDays !== null && s.expiryDays <= 3 ? "#EF4444" : "var(--text-secondary)", fontWeight: s.expiryDays !== null && s.expiryDays <= 3 ? 700 : 400 }}>
                                        {s.expiryDays !== null ? (s.expiryDays <= 0 ? "EXPIRED" : `${s.expiryDays} days`) : "—"}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </Box>
    );
}
