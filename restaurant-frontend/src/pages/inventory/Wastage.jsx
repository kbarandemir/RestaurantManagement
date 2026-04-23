/**
 * Wastage Page — Displays stock movements with type "OUT" that represent
 * inventory deductions (FEFO-based sales consumption and manual wastage).
 *
 * Data source: GET /api/stockmovements?referenceType=SALE
 *              GET /api/stockmovements (all movements)
 *
 * Each StockMovement has: ingredientId, batchId, quantity, movementType (IN/OUT),
 * referenceType (SALE/DELIVERY/MANUAL), and a timestamp.
 */
import { useEffect, useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, Chip, Grid,
    Table, TableHead, TableRow, TableCell, TableBody,
    CircularProgress, Tabs, Tab,
} from "@mui/material";
import { api } from "../../api/client";

function euro(n) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

export default function Wastage() {
    const [movements, setMovements] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [movRes, ingRes] = await Promise.all([
                    api.get("/api/stockmovements"),
                    api.get("/api/ingredients?includeInactive=true"),
                ]);
                if (alive) {
                    setMovements(Array.isArray(movRes.data) ? movRes.data : []);
                    setIngredients(Array.isArray(ingRes.data) ? ingRes.data : []);
                }
            } catch (e) {
                console.error("Failed to load stock movements", e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Build ingredient name lookup
    const ingMap = useMemo(() => {
        const m = {};
        ingredients.forEach((i) => { m[i.ingredientId] = i.name; });
        return m;
    }, [ingredients]);

    // Filter movements by tab
    const filtered = useMemo(() => {
        let list = movements;
        if (tab === "out") list = list.filter((m) => m.movementType === "OUT");
        if (tab === "in") list = list.filter((m) => m.movementType === "IN");
        // Sort newest first
        return [...list].sort((a, b) => new Date(b.movementDateTime) - new Date(a.movementDateTime));
    }, [movements, tab]);

    // KPIs
    const outMovements = movements.filter((m) => m.movementType === "OUT");
    const inMovements = movements.filter((m) => m.movementType === "IN");
    const totalOutQty = outMovements.reduce((s, m) => s + (m.quantity || 0), 0);
    const totalInQty = inMovements.reduce((s, m) => s + (m.quantity || 0), 0);

    // Type label/color mapping
    const typeStyles = {
        OUT: { bg: "#FEE2E2", color: "#991B1B", label: "OUT" },
        IN: { bg: "#D1FAE5", color: "#065F46", label: "IN" },
        ADJUSTMENT: { bg: "#DBEAFE", color: "#1E40AF", label: "ADJ" },
    };

    const refStyles = {
        SALE: { bg: "#FEF3C7", color: "#92400E" },
        DELIVERY: { bg: "#D1FAE5", color: "#065F46" },
        MANUAL: { bg: "#E0E7FF", color: "#3730A3" },
    };

    if (loading) {
        return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Stock Movements</Typography>
                <Typography variant="body2" color="text.secondary">Track all inventory movements — deliveries in, sales out, and manual adjustments</Typography>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Movements", value: movements.length, color: "#4F46E5" },
                    { label: "Stock Out (Sales)", value: `${outMovements.length} (${totalOutQty.toLocaleString()} units)`, color: "#EF4444" },
                    { label: "Stock In (Deliveries)", value: `${inMovements.length} (${totalInQty.toLocaleString()} units)`, color: "#10B981" },
                    { label: "Reference Types", value: new Set(movements.map((m) => m.referenceType)).size, color: "#F59E0B" },
                ].map((s) => (
                    <Grid item xs={6} md={3} key={s.label}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                                <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Filter Tabs */}
            <Box sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label={`All (${movements.length})`} value="all" />
                    <Tab label={`Out (${outMovements.length})`} value="out" />
                    <Tab label={`In (${inMovements.length})`} value="in" />
                </Tabs>
            </Box>

            {/* Table */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <CardContent sx={{ p: 0 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 } }}>
                                <TableCell>Ingredient</TableCell><TableCell>Quantity</TableCell><TableCell>Type</TableCell><TableCell>Reference</TableCell><TableCell>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>No movements found.</TableCell></TableRow>
                            ) : filtered.map((m) => {
                                const ts = typeStyles[m.movementType] || typeStyles.ADJUSTMENT;
                                const rs = refStyles[m.referenceType] || refStyles.MANUAL;
                                return (
                                    <TableRow key={m.movementId} sx={{ "&:hover": { bgcolor: "#FAFAFA" }, "& td": { fontSize: 13 } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{ingMap[m.ingredientId] || `ID: ${m.ingredientId}`}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: m.movementType === "OUT" ? "#EF4444" : "#10B981" }}>
                                            {m.movementType === "OUT" ? "-" : "+"}{m.quantity}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={ts.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: ts.bg, color: ts.color }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={m.referenceType} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: rs.bg, color: rs.color }} />
                                            <Typography component="span" sx={{ ml: 1, fontSize: 11, color: "text.secondary" }}>
                                                #{m.referenceId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ color: "var(--text-secondary)" }}>
                                            {new Date(m.movementDateTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
                                            {new Date(m.movementDateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </Box>
    );
}
