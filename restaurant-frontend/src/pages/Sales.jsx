import { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Button, Tooltip, CircularProgress, Alert,
  IconButton, Collapse
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import TableRestaurantRoundedIcon from "@mui/icons-material/TableRestaurantRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

// Formats amount to currency
function formatCurrency(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

// Formats time elapsed
function getTimeElapsed(dateStr) {
  const start = new Date(dateStr + "Z"); // UTC
  const now = new Date();
  const diffMins = Math.floor((now - start) / 60000);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} hr ${diffMins % 60} min ago`;
}

// Format exact locale date
function formatDate(dateStr) {
  return new Date(dateStr + "Z").toLocaleString();
}

// ── Components ──────────────────────────────────────────────────────────────

const SaleRow = ({ sale }) => {
  const [open, setOpen] = useState(false);
  const isPaid = (sale.status || "").startsWith("paid");

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>#{sale.saleId}</TableCell>
        <TableCell>{formatDate(sale.saleDateTime)}</TableCell>
        <TableCell>{sale.tableNo || "Takeaway"}</TableCell>
        <TableCell>{sale.itemCount} Units</TableCell>
        <TableCell>
          <Chip
            label={sale.status}
            size="small"
            color={isPaid ? "success" : "error"}
            sx={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" }}
          />
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 800, color: isPaid ? "#059669" : "#EF4444" }}>
          {formatCurrency(sale.totalAmount)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, bgcolor: "#F9FAFB", p: 2, borderRadius: 2, border: "1px solid #E5E7EB" }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, color: "#374151", mb: 1.5 }}>
                Order Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#6B7280", fontSize: "0.75rem" }}>Menu Item</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#6B7280", fontSize: "0.75rem" }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#6B7280", fontSize: "0.75rem" }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#6B7280", fontSize: "0.75rem" }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sale.items || []).map((item) => (
                    <TableRow key={item.saleItemId}>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 500 }}>{item.menuItemName}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.8rem" }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.8rem" }}>{formatCurrency(item.unitPriceAtSale)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPriceAtSale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const { showToast } = useToast();

  // Refresh data periodically
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/api/sales");
      setSales(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch sales: ", err);
      setError("Could not load sales and active orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (saleId, newStatus) => {
    try {
      await api.patch(`/api/sales/${saleId}/status`, { status: newStatus });
      // Optimistic update
      setSales(prev => prev.map(s => s.saleId === saleId ? { ...s, status: newStatus } : s));
      showToast(`Order #${saleId} marked as ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to update status", err);
      showToast("Error updating order status.", "error");
      loadData();
    }
  };

  const activeOrders = useMemo(() => sales.filter(s => s.status === "active"), [sales]);
  const historicalSales = useMemo(() => sales.filter(s => s.status !== "active"), [sales]);

  // Derived UI components
  const ActiveOrdersBoard = () => {
    if (activeOrders.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="h6">No Active Orders</Typography>
          <Typography variant="body2">Waiting for new POS orders to arrive.</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {activeOrders.map(order => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={order.saleId}>
            <Card elevation={2} sx={{
              borderRadius: 3,
              borderTop: "6px solid #4F46E5",
              display: "flex",
              flexDirection: "column",
              height: "100%"
            }}>
              <CardContent sx={{ flex: 1, p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                      Order #{order.saleId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <AccessTimeFilledIcon sx={{ fontSize: 14 }} /> {getTimeElapsed(order.saleDateTime)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<TableRestaurantRoundedIcon sx={{ fontSize: 16 }} />}
                    label={order.tableNo || "Takeaway"}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Box sx={{ bgcolor: "#F3F4F6", borderRadius: 2, p: 1.5, mb: 2 }}>
                  <Box sx={{ mb: 1.5 }}>
                    {order.items?.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ color: "#4B5563" }}>
                          {item.quantity}x {item.menuItemName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(item.quantity * item.unitPriceAtSale)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle2" fontWeight={700}>Total Amount</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="#10B981">
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex" , gap: 1}}>
                  <Button
                    variant="contained"
                    fullWidth
                    color="success"
                    onClick={() => handleUpdateStatus(order.saleId, "paidbycash")}
                    sx={{ fontWeight: 700, boxShadow: "none", fontSize: "0.75rem", px: 0 }}
                  >
                    Cash
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    color="info"
                    onClick={() => handleUpdateStatus(order.saleId, "paidbycard")}
                    sx={{ fontWeight: 700, boxShadow: "none", fontSize: "0.75rem", px: 0 }}
                  >
                    Card
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    color="secondary"
                    onClick={() => handleUpdateStatus(order.saleId, "paidbygiftcard")}
                    sx={{ fontWeight: 700, boxShadow: "none", fontSize: "0.75rem", px: 0 }}
                  >
                    Gift
                  </Button>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  color="error"
                  onClick={() => { if (window.confirm("Cancel this order?")) handleUpdateStatus(order.saleId, "canceled") }}
                  startIcon={<CloseRoundedIcon />}
                  sx={{ minWidth: 0, p: 0.5, fontWeight: 700, borderRadius: 2 }}
                >
                  Cancel Order
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const SalesHistoryTable = () => {
    if (historicalSales.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          <Typography>No completed or cancelled sales found.</Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E5E7EB", borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell />
              <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Table</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total Units</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Total Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historicalSales.map(s => (
              <SaleRow key={s.saleId} sale={s} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>
            Sales & Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track active orders from the POS and view historical sales data.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, nv) => setTab(nv)} textColor="primary" indicatorColor="primary">
          <Tab
            label={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>Active Orders <Chip label={activeOrders.length} size="small" color="primary" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} /></Box>}
            sx={{ fontWeight: 600, textTransform: "none", fontSize: "1rem" }}
          />
          <Tab
            label="Sales History"
            sx={{ fontWeight: 600, textTransform: "none", fontSize: "1rem" }}
          />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        tab === 0 ? <ActiveOrdersBoard /> : <SalesHistoryTable />
      )}
    </Box>
  );
}
