import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  CircularProgress
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../api/client";

// ── Colour palette ────────────────────────────────────────────────────────────
const PRIMARY = "#2563EB";
const ACCENT = "#16A34A";
const DANGER = "#DC2626";
const GREY = "#64748B";

// ── Helper components ─────────────────────────────────────────────────────────
function euro(n) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function KpiCard({ title, value, pct, sub }) {
  const up = pct >= 0;
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "grey.200",
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
          {title}
        </Typography>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 1, letterSpacing: -0.5 }}>
          {value}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {up ? (
            <TrendingUpIcon sx={{ fontSize: 16, color: ACCENT }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 16, color: DANGER }} />
          )}
          <Chip
            label={`${up ? "+" : ""}${pct}%`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: 11,
              bgcolor: up ? "#DCFCE7" : "#FEE2E2",
              color: up ? ACCENT : DANGER,
              height: 20,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, children, height = 260 }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "grey.200",
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ height }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label, prefix = "€" }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "white",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        p: 1.5,
        boxShadow: "0 4px 16px rgba(0,0,0,.1)",
        minWidth: 140,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
            <Typography variant="caption" color="text.secondary">
              {p.name}
            </Typography>
          </Box>
          <Typography variant="caption" fontWeight={700}>
            {prefix}
            {Number(p.value).toLocaleString("de-DE")}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/api/Dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  const calcPct = (now, prev) => prev > 0 ? (((now - prev) / prev) * 100).toFixed(1) : (now > 0 ? 100.0 : 0.0);

  const dailyPct = calcPct(data.todaySales, data.yesterdaySales);
  const weekPct = calcPct(data.thisWeekSales, data.lastWeekSales);
  const monthPct = calcPct(data.thisMonthSales, data.lastMonthSales);
  const netPct = calcPct(data.yearlySales, data.lastYearSales);

  return (
    <Box display={"flex"} flexDirection={"column"} gap={2} width={"100%"} justifyContent={"space-between"} alignItems={"center"}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2, width: "100%" }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>
          Sales Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </Typography>
      </Box>

      <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2} width="100%" justifyContent="space-between">
        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 2, width: "100%" }} justifyContent={"space-between"}>
          {[
            { title: "Today Sale", value: euro(data.todaySales), pct: +dailyPct, sub: "vs yesterday" },
            { title: "This Week Sale", value: euro(data.thisWeekSales), pct: +weekPct, sub: "vs last week" },
            { title: "This Month Sale", value: euro(data.thisMonthSales), pct: +monthPct, sub: "vs last month" },
            { title: "Yearly Sale", value: euro(data.yearlySales), pct: +netPct, sub: "vs last year" },
          ].map((kpi) => (
            <Grid item xs={6} md={3} key={kpi.title} sx={{ width: { xs: "47%", md: "22%" } }}>
              <KpiCard {...kpi} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Daily Sales Trend + Trending Items ─────────────────────────────── */}
      <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2} width="100%" justifyContent="space-between">
        <Grid container spacing={2} width="100%" justifyContent="space-between" sx={{ flexWrap: "wrap" }}>
          {/* Daily Sales Trend – Area */}
          <Grid item xs={12} md={8} sx={{ width: { xs: "100%", md: "60%" } }}>
            <ChartCard
              title="Daily Sales Trend"
              subtitle="Last 30 days — revenue per day"
              height={280}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: GREY }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: GREY }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Revenue"
                    stroke={PRIMARY}
                    strokeWidth={2.5}
                    fill="url(#salesGrad)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Trending Items */}
          <Grid item xs={12} md={4} sx={{ width: { xs: "100%", md: "35%" } }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.200",
                boxShadow: "0 1px 8px rgba(0,0,0,.06)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Trending Items
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Top 5 most-sold items today
                </Typography>

                {data.trendingItems?.length > 0 ? data.trendingItems.map((item) => (
                  <Box
                    key={item.rank}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.25,
                      borderBottom: item.rank < 5 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 12,
                        bgcolor: item.rank <= 3 ? "#EEF2FF" : "#F9FAFB",
                        color: item.rank <= 3 ? PRIMARY : GREY,
                      }}
                    >
                      {item.rank}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} fontSize={13} noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.orders} orders · {euro(item.revenue)}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${item.change >= 0 ? "+" : ""}${item.change}%`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: item.change >= 0 ? "#DCFCE7" : "#FEE2E2",
                        color: item.change >= 0 ? ACCENT : DANGER,
                      }}
                    />
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    No items sold today yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
