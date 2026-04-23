/**
 * Line Checks — Displays ingredient batches grouped by expiry status
 * to help kitchen staff verify which items need immediate attention.
 *
 * Data source: GET /api/ingredientbatches?activeOnly=true
 *              GET /api/ingredients
 *
 * Groups batches into 3 categories:
 *   - EXPIRED: ExpiryDate < today (red — must be discarded)
 *   - EXPIRING SOON: ExpiryDate within 7 days (amber — use first)
 *   - OK: ExpiryDate > 7 days (green — safe)
 *
 * This directly supports the FEFO (First Expired, First Out) system
 * by giving kitchen staff visibility into what needs to be used immediately.
 */
import { useEffect, useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip,
    Table, TableHead, TableRow, TableCell, TableBody,
    CircularProgress, Tabs, Tab,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { api } from "../../api/client";

export default function LineChecks() {
    const [batches, setBatches] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [batchRes, ingRes] = await Promise.all([
                    api.get("/api/ingredientbatches?activeOnly=true"),
                    api.get("/api/ingredients?includeInactive=false"),
                ]);
                if (alive) {
                    setBatches(Array.isArray(batchRes.data) ? batchRes.data : []);
                    setIngredients(Array.isArray(ingRes.data) ? ingRes.data : []);
                }
            } catch (e) {
                console.error("Failed to load batch data", e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Build ingredient name lookup
    const ingMap = useMemo(() => {
        const m = {};
        ingredients.forEach((i) => { m[i.ingredientId] = i; });
        return m;
    }, [ingredients]);

    // Classify each batch by expiry status
    const classifiedBatches = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return batches.map((b) => {
            const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
            let daysLeft = null;
            let status = "OK";

            if (expiry) {
                daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 0) status = "Expired";
                else if (daysLeft <= 7) status = "Expiring Soon";
            }

            const ing = ingMap[b.ingredientId];
            return {
                ...b,
                ingredientName: ing?.name || `Ingredient #${b.ingredientId}`,
                unit: ing?.baseUnit || "",
                daysLeft,
                status,
            };
        }).sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
    }, [batches, ingMap]);

    // Filter by tab
    const filtered = useMemo(() => {
        if (tab === "expired") return classifiedBatches.filter((b) => b.status === "Expired");
        if (tab === "expiring") return classifiedBatches.filter((b) => b.status === "Expiring Soon");
        if (tab === "ok") return classifiedBatches.filter((b) => b.status === "OK");
        return classifiedBatches;
    }, [classifiedBatches, tab]);

    // KPIs
    const expired = classifiedBatches.filter((b) => b.status === "Expired").length;
    const expiringSoon = classifiedBatches.filter((b) => b.status === "Expiring Soon").length;
    const okCount = classifiedBatches.filter((b) => b.status === "OK").length;

    const statusStyles = {
        Expired: { bg: "#FEE2E2", color: "#991B1B" },
        "Expiring Soon": { bg: "#FEF3C7", color: "#92400E" },
        OK: { bg: "#D1FAE5", color: "#065F46" },
    };

    if (loading) {
        return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Line Checks</Typography>
                    <Typography variant="body2" color="text.secondary">FEFO compliance — batch expiry status for all active ingredients</Typography>
                </Box>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Active Batches", value: classifiedBatches.length, icon: <CheckCircleRoundedIcon />, color: "#4F46E5" },
                    { label: "Expired", value: expired, icon: <ErrorOutlineRoundedIcon />, color: "#EF4444" },
                    { label: "Expiring Soon (≤7 days)", value: expiringSoon, icon: <WarningAmberRoundedIcon />, color: "#F59E0B" },
                    { label: "Safe", value: okCount, icon: <CheckCircleRoundedIcon />, color: "#10B981" },
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

            {/* Filter Tabs */}
            <Box sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label={`All (${classifiedBatches.length})`} value="all" />
                    <Tab label={`Expired (${expired})`} value="expired" sx={{ color: expired > 0 ? "#EF4444" : undefined }} />
                    <Tab label={`Expiring Soon (${expiringSoon})`} value="expiring" />
                    <Tab label={`Safe (${okCount})`} value="ok" />
                </Tabs>
            </Box>

            {/* Table */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 } }}>
                            <TableCell>Ingredient</TableCell><TableCell>Batch ID</TableCell><TableCell>Qty on Hand</TableCell><TableCell>Received</TableCell><TableCell>Expires</TableCell><TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>No batches in this category.</TableCell></TableRow>
                        ) : filtered.map((b) => {
                            const st = statusStyles[b.status] || statusStyles.OK;
                            return (
                                <TableRow key={b.batchId} sx={{ "&:hover": { bgcolor: "#FAFAFA" }, "& td": { fontSize: 13 }, bgcolor: b.status === "Expired" ? "#FFF5F5" : undefined }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{b.ingredientName}</TableCell>
                                    <TableCell>#{b.batchId}</TableCell>
                                    <TableCell>{b.quantityOnHand.toLocaleString()} {b.unit}</TableCell>
                                    <TableCell sx={{ color: "var(--text-secondary)" }}>
                                        {new Date(b.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: b.daysLeft !== null && b.daysLeft <= 3 ? 700 : 400, color: b.daysLeft !== null && b.daysLeft <= 0 ? "#991B1B" : b.daysLeft <= 3 ? "#EF4444" : "var(--text-secondary)" }}>
                                        {b.expiryDate
                                            ? <>
                                                {new Date(b.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                                {b.daysLeft !== null && <Typography component="span" sx={{ ml: 0.5, fontSize: 11 }}>
                                                    ({b.daysLeft <= 0 ? "OVERDUE" : `${b.daysLeft}d left`})
                                                </Typography>}
                                              </>
                                            : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={b.status} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: st.bg, color: st.color }} />
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
