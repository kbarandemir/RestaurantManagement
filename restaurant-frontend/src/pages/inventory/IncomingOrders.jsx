import { useEffect, useState } from "react";
import {
    Box, Card, CardContent, Typography, Chip, Grid,
    Table, TableHead, TableRow, TableCell, TableBody,
    CircularProgress, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, Stack, IconButton, MenuItem as MuiMenuItem,
    Snackbar, Alert,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import { api } from "../../api/client";

function euro(n) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
}

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { Collapse } from "@mui/material";

function InvoiceRow({ inv }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow 
                onClick={() => setOpen(!open)}
                sx={{ 
                    "&:hover": { bgcolor: "#FAFAFA", cursor: "pointer" }, 
                    "& td": { fontSize: 13, borderBottom: open ? "none" : "1px solid var(--border-color)" } 
                }}
            >
                <TableCell sx={{ color: "var(--text-secondary)", width: 40 }}>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>INV-{String(inv.invoiceId).padStart(4, "0")}</TableCell>
                <TableCell>{inv.supplierName || "—"}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{euro(inv.totalCost)}</TableCell>
                <TableCell>
                    <Chip label="Delivered" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: "#D1FAE5", color: "#065F46" }} />
                </TableCell>
                <TableCell sx={{ color: "var(--text-secondary)" }}>
                    {new Date(inv.invoiceDate || inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, bgcolor: "#F9FAFB", borderRadius: 2, border: "1px solid #E5E7EB", p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom component="div" fontWeight={700}>
                                Delivery Items
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ "& th": { fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase" } }}>
                                        <TableCell>Ingredient</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Unit Cost (€)</TableCell>
                                        <TableCell align="right">Line Total</TableCell>
                                        <TableCell>Expiry Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(inv.items || inv.ingredientBatches || []).map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell component="th" scope="row">{item.ingredientName || item.ingredient?.name || `ID: ${item.ingredientId}`}</TableCell>
                                            <TableCell align="right">{item.quantity || item.quantityOnHand}</TableCell>
                                            <TableCell align="right">{euro(item.unitCost)}</TableCell>
                                            <TableCell align="right">{euro((item.quantity || item.quantityOnHand) * item.unitCost)}</TableCell>
                                            <TableCell sx={{ color: "text.secondary" }}>
                                                {new Date(item.expiryDate).toLocaleDateString("en-GB")}
                                            </TableCell>
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
}

export default function IncomingOrders() {
    const [invoices, setInvoices] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);

    // Form state
    const [supplier, setSupplier] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
    const [items, setItems] = useState([{ ingredientId: "", quantity: "", cost: "", expiry: "" }]);
    const [toast, setToast] = useState({ open: false, type: "success", msg: "" });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, ingRes] = await Promise.all([
                api.get("/api/invoices"),
                api.get("/api/ingredients?includeInactive=false")
            ]);
            setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
            setIngredients(Array.isArray(ingRes.data) ? ingRes.data : []);
            console.log("INVOICES LOADED:", invRes.data);
        } catch (e) {
            console.error("Failed to load invoices", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addItemLine = () => {
        setItems([...items, { ingredientId: "", quantity: "", cost: "", expiry: "" }]);
    };

    const removeItemLine = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, val) => {
        const next = [...items];
        next[idx][field] = val;
        setItems(next);
    };

    const handleSave = async () => {
        try {
            const totalCost = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
            const dto = {
                date: new Date(invoiceDate).toISOString(),
                supplierName: supplier,
                totalCost: totalCost,
                batches: items.filter(it => it.ingredientId && it.quantity).map(it => ({
                    ingredientId: Number(it.ingredientId),
                    quantityOnHand: Number(it.quantity),
                    unitCost: Number(it.cost) / Number(it.quantity) || 0,
                    expiryDate: new Date(it.expiry).toISOString()
                }))
            };

            await api.post("/api/invoices", dto);
            setToast({ open: true, type: "success", msg: "Delivery received and stock updated!" });
            setOpenAdd(false);
            setSupplier("");
            setItems([{ ingredientId: "", quantity: "", cost: "", expiry: "" }]);
            fetchData();
        } catch (error) {
            console.error("Failed to save invoice", error);
            const respData = error.response?.data;
            const msg = respData?.error || respData?.message || (typeof respData === 'string' ? respData : "Failed to save delivery");
            setToast({ open: true, type: "error", msg });
        }
    };

    const totalValue = invoices.reduce((s, inv) => s + (inv.totalCost || 0), 0);
    const totalBatches = invoices.reduce((s, inv) => s + (inv.items?.length || 0), 0);

    if (loading && invoices.length === 0) {
        return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%", pb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Incoming Orders</Typography>
                    <Typography variant="body2" color="text.secondary">Track supplier invoices and deliveries</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddRoundedIcon />} 
                    onClick={() => setOpenAdd(true)}
                    sx={{ bgcolor: "#111827", borderRadius: 2.5, "&:hover": { bgcolor: "#374151" } }}
                >
                    Add New Delivery
                </Button>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Invoices", value: invoices.length, icon: <LocalShippingRoundedIcon />, color: "#4F46E5" },
                    { label: "Batches Received", value: totalBatches, icon: <CheckCircleRoundedIcon />, color: "#10B981" },
                    { label: "Suppliers", value: new Set(invoices.map(i => i.supplierName)).size, icon: <ShoppingBagRoundedIcon />, color: "#2563EB" },
                    { label: "Inventory Value", value: euro(totalValue), color: "#F59E0B" },
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

            {/* Invoices Table */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 } }}>
                            <TableCell width={40} />
                            <TableCell>Invoice ID</TableCell>
                            <TableCell>Supplier</TableCell>
                            <TableCell>Total Value</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>No delivery records found.</TableCell></TableRow>
                        ) : invoices.map((inv) => (
                            <InvoiceRow key={inv.invoiceId} inv={inv} />
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* New Delivery Dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 800 }}>Receive New Delivery</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <TextField label="Supplier Name" fullWidth value={supplier} onChange={e => setSupplier(e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Invoice Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                            </Grid>
                        </Grid>

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Line Items</Typography>
                        <Stack spacing={1.5}>
                            {items.map((it, idx) => (
                                <Box key={idx} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                                    <TextField 
                                        select 
                                        label="Ingredient" 
                                        sx={{ minWidth: 200, flex: 2 }} 
                                        value={it.ingredientId} 
                                        onChange={e => updateItem(idx, "ingredientId", e.target.value)}
                                        size="small"
                                    >
                                        {ingredients.map(ing => (
                                            <MuiMenuItem key={ing.ingredientId} value={ing.ingredientId}>{ing.name}</MuiMenuItem>
                                        ))}
                                    </TextField>
                                    <TextField label="Qty" type="number" sx={{ flex: 1 }} value={it.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} size="small" />
                                    <TextField label="Cost (€)" type="number" sx={{ flex: 1 }} value={it.cost} onChange={e => updateItem(idx, "cost", e.target.value)} size="small" />
                                    <TextField label="Expiry" type="date" sx={{ flex: 1.5 }} InputLabelProps={{ shrink: true }} value={it.expiry} onChange={e => updateItem(idx, "expiry", e.target.value)} size="small" />
                                    <IconButton color="error" onClick={() => removeItemLine(idx)} disabled={items.length === 1}>
                                        <DeleteOutlineRoundedIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Stack>
                        
                        <Button startIcon={<AddRoundedIcon />} sx={{ mt: 2 }} onClick={addItemLine}>Add Another Item</Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={!supplier || items.some(it => !it.ingredientId || !it.quantity)} sx={{ bgcolor: "#111827", "&:hover": { bgcolor: "#374151" } }}>
                        Save Invoice & Update Stock
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
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
