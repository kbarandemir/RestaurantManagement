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

// Kendi axios client'ını kullanıyorsan bunu ona göre değiştir.
// Örn: import api from "../api/client";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Token interceptor (projende zaten varsa kaldır)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Beklenen backend modelleri:
 * GET /api/menuitems -> [{ menuItemId, name, price, isActive, category? }]
 * POST /api/sales -> { createdByUserId, items: [{ menuItemId, quantity }] }
 *
 * Eğer senin DTO isimlerin farklıysa (id, menuItemID vs) mapping yaparız.
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
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [discountPct, setDiscountPct] = useState(0);

  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/menuitems");
        const items = Array.isArray(res.data) ? res.data : [];
        // sadece aktifleri göster (istersen kaldır)
        const active = items.filter((x) => x.isActive !== false);
        if (mounted) setMenuItems(active);
      } catch (e) {
        console.error(e);
        setToast({ open: true, type: "error", msg: "Menu items yüklenemedi. Backend çalışıyor mu?" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Category listesi (Category yoksa hepsi All altında kalır)
  const categories = useMemo(() => {
    const cats = new Set();
    for (const mi of menuItems) {
      const c = (mi.category || "").trim();
      if (c) cats.add(c);
    }
    return ["All", ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
  }, [menuItems]);

  // Tab seçili değilse düzelt
  useEffect(() => {
    if (!categories.includes(tab)) setTab("All");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join("|")]);

  const filteredItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    return menuItems
      .filter((mi) => (tab === "All" ? true : (mi.category || "").trim() === tab))
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
    setCustomerName("");
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
      setToast({ open: true, type: "warning", msg: "Sepet boş." });
      return;
    }

    const createdByUserId = getUserIdFromToken(); // backend istiyorsa
    const body = {
      createdByUserId: createdByUserId ?? 0, // backend nullable ise 0 yerine null da olabilir
      // Not: backend'in dto alan adı "items" / "saleItems" farklıysa burada değiştir
      items: cartItems.map((x) => ({
        menuItemId: x.menuItemId,
        quantity: x.qty,
      })),
      // İstersen backend DTO’na eklenirse:
      // customerName,
      // tableNo,
      // discountPct,
    };

    try {
      await api.post("/api/sales", body);
      setToast({ open: true, type: "success", msg: "Sale completed ✅ Stock FEFO düşümü yapıldı." });
      clearCart();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data ||
        "Sale oluşturulamadı. Recipe/stock yetersizliği veya backend hatası olabilir.";
      setToast({ open: true, type: "error", msg: String(msg) });
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
          <TextField
            label="Customer"
            size="small"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
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
                <Typography color="text.secondary">Sepet boş. Sağdan ürün seç.</Typography>
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
          >
            Complete Sale
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<SaveOutlinedIcon />}
            disabled
            title="Draft opsiyonel (sonra ekleriz)"
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

        {/* Categories (Category yoksa sadece All görünür) */}
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
                      borderColor: "divider",
                      cursor: "pointer",
                      "&:hover": { boxShadow: 2 },
                      height: 110,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    onClick={() => addToCart(mi)}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }} noWrap>
                        {mi.name}
                      </Typography>
                      {mi.category ? (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {mi.category}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {/* category yok */}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography sx={{ fontWeight: 800 }}>{money(mi.price)}</Typography>
                      <Chip size="small" label="+" />
                    </Stack>
                  </Paper>
                </Grid>
              ))}

              {filteredItems.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Sonuç bulunamadı.</Typography>
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
