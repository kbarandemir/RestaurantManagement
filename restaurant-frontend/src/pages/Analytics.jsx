import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    CircularProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { api } from "../api/client";

/* ── Colour palette ─────────────────────────────────────────────────────────── */
const PRIMARY = "#4F46E5";
const ACCENT = "#10B981";
const ACCENT2 = "#F59E0B";
const GREY = "#64748B";
const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

function euro(n) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

/* ── Chart card wrapper ─────────────────────────────────────────────────────── */
function ChartCard({ title, subtitle, children, height = 280 }) {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-md)",
                height: "100%",
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        {subtitle}
                    </Typography>
                )}
                <Box sx={{ height }}>{children}</Box>
            </CardContent>
        </Card>
    );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
export default function Analytics() {
    const [dateRange, setDateRange] = useState("30d");
    const [tab, setTab] = useState(0);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchAnalytics() {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/api/Analytics?period=${dateRange}`);
                if (!cancelled) setData(res.data);
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
                if (!cancelled) setError("Failed to load analytics data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchAnalytics();
        return () => { cancelled = true; };
    }, [dateRange]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
                <Typography color="error">{error || "No data available."}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Analytics</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Deep-dive into your restaurant performance metrics
                    </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Date Range</InputLabel>
                    <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} label="Date Range">
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="90d">Last 90 Days</MenuItem>
                        <MenuItem value="12m">Last 12 Months</MenuItem>
                        <MenuItem value="ytd">Year to Date</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                    mb: 3,
                    "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13 },
                    "& .Mui-selected": { color: "var(--primary)" },
                    "& .MuiTabs-indicator": { backgroundColor: "var(--primary)" },
                }}
            >
                <Tab label="Revenue" />
                <Tab label="Product Performance" />
                <Tab label="Staff Performance" />
            </Tabs>

            {/* Revenue tab */}
            {tab === 0 && (
                <Box 
                    sx={{ 
                        display: "grid", 
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, 
                        gap: 3, 
                        mb: 3,
                        width: "100%"
                    }}
                >
                    <ChartCard title="Hourly Revenue Breakdown" subtitle="Average revenue per hour across selected period" height={340}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.hourlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: GREY }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: GREY }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                                <Tooltip formatter={(v) => [`€${Number(v).toLocaleString("de-DE")}`, "Revenue"]} />
                                <Bar dataKey="revenue" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Revenue by Channel" subtitle="Distribution across payment methods" height={340}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.channels} cx="50%" cy="45%" innerRadius="48%" outerRadius="75%" paddingAngle={3} dataKey="value">
                                    {data.channels.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, name) => [`${v}%`, name]} />
                                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Revenue Forecast" subtitle="Actual vs projected revenue" height={340}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.forecast}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: GREY }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: GREY }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => v != null ? [`€${Number(v).toLocaleString("de-DE")}`, ""] : ["—", ""]} />
                                <Legend iconType="circle" iconSize={8} />
                                <Line type="monotone" dataKey="actual" name="Actual" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
                                <Line type="monotone" dataKey="forecast" name="Forecast" stroke={ACCENT2} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Box>
            )}

            {/* Product performance tab */}
            {tab === 1 && (
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Product Performance</Typography>
                        <Box sx={{ overflowX: "auto" }}>
                            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { py: 1.5, px: 2, textAlign: "left", fontSize: 13, borderBottom: "1px solid var(--border-color)" }, "& th": { fontWeight: 600, color: "var(--text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 } }}>
                                <thead>
                                    <tr><th>Product</th><th>Revenue</th><th>Orders</th><th>Margin</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {data.products.sort((a, b) => b.revenue - a.revenue).map((p) => (
                                        <tr key={p.name}>
                                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                                            <td>{euro(p.revenue)}</td>
                                            <td>{p.orders}</td>
                                            <td>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    {p.margin >= 35 ? <TrendingUpIcon sx={{ fontSize: 14, color: ACCENT }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: ACCENT2 }} />}
                                                    {p.margin}%
                                                </Box>
                                            </td>
                                            <td>
                                                <Chip
                                                    label={p.margin >= 35 ? "High" : p.margin >= 28 ? "Medium" : "Low"}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        bgcolor: p.margin >= 35 ? "#D1FAE5" : p.margin >= 28 ? "#FEF3C7" : "#FEE2E2",
                                                        color: p.margin >= 35 ? "#065F46" : p.margin >= 28 ? "#92400E" : "#991B1B",
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Staff performance tab */}
            {tab === 2 && (
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Staff Performance</Typography>
                        <Box sx={{ overflowX: "auto" }}>
                            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { py: 1.5, px: 2, textAlign: "left", fontSize: 13, borderBottom: "1px solid var(--border-color)" }, "& th": { fontWeight: 600, color: "var(--text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 } }}>
                                <thead>
                                    <tr><th>Staff</th><th>Tables Served</th><th>Revenue</th><th>Rating</th></tr>
                                </thead>
                                <tbody>
                                    {data.staff.sort((a, b) => b.revenue - a.revenue).map((s) => (
                                        <tr key={s.name}>
                                            <td style={{ fontWeight: 500 }}>{s.name}</td>
                                            <td>{s.tables}</td>
                                            <td>{euro(s.revenue)}</td>
                                            <td>
                                                <Chip
                                                    label={`★ ${s.rating}`}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        bgcolor: parseFloat(s.rating) >= 4.5 ? "#D1FAE5" : parseFloat(s.rating) >= 4 ? "#FEF3C7" : "#FEE2E2",
                                                        color: parseFloat(s.rating) >= 4.5 ? "#065F46" : parseFloat(s.rating) >= 4 ? "#92400E" : "#991B1B",
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
