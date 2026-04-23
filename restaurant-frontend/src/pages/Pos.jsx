import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

/**
 * POS (Point of Sale) Terminal Component
 *
 * This is the core transaction interface where staff create new sales orders.
 * Workflow:
 *   1. Staff selects menu items from the right panel (filterable by category/search)
 *   2. Items are added to the cart (left panel) with quantity controls
 *   3. Table number is entered and optional discount applied
 *   4. "Complete Sale" sends the order to POST /api/sales
 *   5. Backend resolves recipes, runs FEFO inventory deduction, creates sale record
 *
 * Expected API endpoints:
 *   GET  /api/menuitems/pos → [{ menuItemId, name, price, isActive, categoryName }]
 *   POST /api/sales          → { createdByUserId, tableNo, items: [{ menuItemId, quantity }] }
 */
import { api } from "../api/client";

/**
 * Formats a number as Euro currency (e.g. €12.50).
 * Used throughout the POS for displaying item prices and totals.
 */

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR", // istersen "GBP"
    maximumFractionDigits: 2,
  }).format(num);
}

export default function Pos() {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");

  // Cart: { [menuItemId]: { menuItemId, name, price, qty } }
  const [cart, setCart] = useState({});
  const [tableNo, setTableNo] = useState("");
  const [discountPct, setDiscountPct] = useState(0);

  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/menuitems/pos");
        const items = Array.isArray(res.data) ? res.data : [];
        // Only show active menu items in the POS
        const active = items.filter((x) => x.isActive !== false);
        if (mounted) setMenuItems(active);
      } catch (e) {
        console.error(e);
        setToast({ open: true, type: "error", msg: "Failed to load menu items. Is the backend running?" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Build category list from loaded menu items (falls back to "All" if no categories exist)
  const categories = useMemo(() => {
    const cats = new Set();
    for (const mi of menuItems) {
      const c = (mi.categoryName || "").trim();
      if (c) cats.add(c);
    }
    return ["All", ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
  }, [menuItems]);

  // Reset tab to "All" if the current tab no longer exists in the category list
  useEffect(() => {
    if (!categories.includes(tab)) setTab("All");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join("|")]);

  const filteredItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    return menuItems
      .filter((mi) => (tab === "All" ? true : (mi.categoryName || "").trim() === tab))
      .filter((mi) => (s ? (mi.name || "").toLowerCase().includes(s) : true))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [menuItems, search, tab]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Number(discountPct || 0)));
    return (subtotal * pct) / 100;
  }, [subtotal, discountPct]);

  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  const addToCart = (mi) => {
    const id = mi.menuItemId ?? mi.id;
    if (!id) return;

    setCart((prev) => {
      const current = prev[id];
      const nextQty = (current?.qty || 0) + 1;
      return {
        ...prev,
        [id]: {
          menuItemId: id,
          name: mi.name,
          price: mi.price,
          qty: nextQty,
        },
      };
    });
  };

  const incQty = (id) => {
    setCart((prev) => {
      const it = prev[id];
      if (!it) return prev;
      return { ...prev, [id]: { ...it, qty: it.qty + 1 } };
    });
  };

  const decQty = (id) => {
    setCart((prev) => {
      const it = prev[id];
      if (!it) return prev;
      const nextQty = it.qty - 1;
      if (nextQty <= 0) {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      }
      return { ...prev, [id]: { ...it, qty: nextQty } };
    });
  };

  const removeItem = (id) => {
    setCart((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  const clearCart = () => {
    setCart({});
    setTableNo("");
    setDiscountPct(0);
  };

  const getUserIdFromToken = () => {
    // token payload: sub = userId
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const sub = payload?.sub;
      const userId = sub ? Number(sub) : null;
      return Number.isFinite(userId) ? userId : null;
    } catch {
      return null;
    }
  };

  const completeSale = async () => {
    if (cartItems.length === 0) {
      setToast({ open: true, type: "warning", msg: "Cart is empty" });
      return;
    }

    if (!tableNo) {
      setToast({ open: true, type: "error", msg: "Please enter Table No." });
      return;
    }

    try {
      const saleDto = {
        createdByUserId: getUserIdFromToken() || 1,
        tableNo: tableNo,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.qty,
        })),
      };

      await api.post("/api/sales", saleDto);

      setToast({ open: true, type: "success", msg: "Sale completed successfully!" });
      clearCart();
    } catch (error) {
      console.error(error);
      const respData = error.response?.data;
      const msg = respData?.error || respData?.message || (typeof respData === 'string' ? respData : "Sale failed");
      setToast({ open: true, type: "error", msg });
    }
  };

  const leftWidth = 380;

  return (
    <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 96px)" }}>
      {/* LEFT: Cart */}
      <Paper
        elevation={1}
        sx={{
          width: leftWidth,
          minWidth: leftWidth,
          p: 2,
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Order
            </Typography>
            <Typography variant="caption" color="text.secondary">
              POS • New Sale
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={clearCart}
            >
              Clear
            </Button>
            <IconButton size="small" onClick={() => window.location.reload()} sx={{ border: "1px solid #ddd" }}>
               <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" spacing={1}>
          <TextField
            label="Table"
            size="small"
            value={tableNo}
            onChange={(e) => setTableNo(e.target.value)}
            fullWidth
          />
        </Stack>

        <Box sx={{ mt: 2, flex: 1, overflow: "auto" }}>
          <Stack direction="row" justifyContent="space-between" sx={{ px: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Item
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Qty / Price
            </Typography>
          </Stack>

          <List dense disablePadding>
            {cartItems.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">Cart is empty. Select items from the menu.</Typography>
              </Box>
            ) : (
              cartItems.map((it) => (
                <ListItem
                  key={it.menuItemId}
                  divider
                  secondaryAction={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconButton size="small" onClick={() => decQty(it.menuItemId)}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Chip size="small" label={it.qty} />
                      <IconButton size="small" onClick={() => incQty(it.menuItemId)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => removeItem(it.menuItemId)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 600 }} noWrap>
                        {it.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {money(it.price)} • Line: {money(Number(it.price) * Number(it.qty))}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Discount %"
            size="small"
            type="number"
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            sx={{ width: 130 }}
          />
          <Box sx={{ flex: 1 }} />
          <Stack sx={{ minWidth: 160 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2">{money(subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Discount
              </Typography>
              <Typography variant="body2">- {money(discountAmount)}</Typography>
            </Stack>
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Total
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {money(total)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={completeSale}
            disabled={cartItems.length === 0}
            sx={{
              mt: 2,
              bgcolor: "black",
              color: "white",
              "&:hover": { bgcolor: "#333" }
            }}
          >
            Complete Sale
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<SaveOutlinedIcon />}
            disabled
            title="Draft functionality (coming soon)"
          >
            Draft
          </Button>
        </Stack>
      </Paper>

      {/* RIGHT: Menu */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          p: 2,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Menu
          </Typography>
          <TextField
            size="small"
            placeholder="Search menu item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 320 }}
          />
        </Stack>

        {/* Category tabs (only "All" appears if no categories are defined) */}
        <Box sx={{ mt: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {categories.map((c) => (
              <Tab key={c} value={c} label={c} />
            ))}
          </Tabs>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Grid container spacing={2}>
              {filteredItems.map((mi) => (
                <Grid item key={mi.menuItemId ?? mi.id} xs={6} sm={4} md={3} lg={2.4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: !mi.isAvailable ? "#FEE2E2" : "divider",
                        cursor: !mi.isAvailable ? "not-allowed" : "pointer",
                        opacity: !mi.isAvailable ? 0.7 : 1,
                        bgcolor: !mi.isAvailable ? "#FEF2F2" : "white",
                        "&:hover": { boxShadow: !mi.isAvailable ? 0 : 2 },
                        height: 110,
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        overflow: "hidden"
                      }}
                      onClick={() => mi.isAvailable && addToCart(mi)}
                    >
                      {!mi.isAvailable && (
                        <Box sx={{ position: "absolute", top: 0, right: 0, bgcolor: "#EF4444", color: "white", px: 1, py: 0.2, fontSize: 9, fontWeight: 900, borderBottomLeftRadius: 8 }}>
                          STOCK OUT
                        </Box>
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: !mi.isAvailable ? "#991B1B" : "inherit" }} noWrap title={mi.name}>
                          {mi.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {mi.categoryName || " "}
                        </Typography>
                      </Box>
  
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 800, color: !mi.isAvailable ? "#991B1B" : "inherit" }}>{money(mi.price)}</Typography>
                        <Chip 
                          size="small" 
                          label="+" 
                          sx={{ 
                            height: 20, 
                            bgcolor: !mi.isAvailable ? "#FCA5A5" : "black", 
                            color: "white", 
                            fontWeight: 900,
                            "& .MuiChip-label": { px: 0.5 }
                          }} 
                        />
                      </Stack>
                    </Paper>
                </Grid>
              ))}

              {filteredItems.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">No results found.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
