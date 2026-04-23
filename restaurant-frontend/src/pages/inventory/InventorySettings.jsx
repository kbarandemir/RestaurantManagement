/**
 * Inventory Settings — Configuration page for inventory management preferences.
 *
 * Persistence: Settings are stored in localStorage (key: "inventorySettings")
 * since these are frontend-only UI preferences (notification toggles,
 * default units, count frequency).
 *
 * Settings include:
 *   - Notification toggles (low stock alerts, waste tracking, line check reminders)
 *   - Default values (reorder threshold %, default unit, count frequency)
 *   - Display preferences (currency format, table page size)
 */
import { useState, useEffect } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Switch,
    FormControlLabel, Divider, Button, TextField, Select,
    MenuItem, FormControl, InputLabel, Snackbar, Alert,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { useToast } from "../../context/ToastContext";

const STORAGE_KEY = "inventorySettings";

const DEFAULT_SETTINGS = {
    lowStockAlert: true,
    autoReorder: false,
    wasteTracking: true,
    lineCheckReminders: true,
    reorderThreshold: "20",
    defaultUnit: "kg",
    countFrequency: "daily",
};

// Load settings from localStorage, falling back to defaults
function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { /* ignore parse errors */ }
    return { ...DEFAULT_SETTINGS };
}

export default function InventorySettings() {
    const [settings, setSettings] = useState(loadSettings);
    const [hasChanges, setHasChanges] = useState(false);
    const { showToast } = useToast();

    const update = (key, val) => {
        setSettings((p) => ({ ...p, [key]: val }));
        setHasChanges(true);
    };

    // Save settings to localStorage
    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setHasChanges(false);
        showToast("Settings saved successfully.", "success");
    };

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Inventory Settings</Typography>
                    <Typography variant="body2" color="text.secondary">Configure inventory management preferences</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveRoundedIcon />}
                    onClick={handleSave}
                    disabled={!hasChanges}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, bgcolor: "var(--primary)", boxShadow: "none", "&:hover": { bgcolor: "#4338CA" } }}
                >
                    Save Changes
                </Button>
            </Box>

            <Grid container spacing={2.5}>
                {/* Notifications Panel */}
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Notifications</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Control which alerts and reminders you receive
                            </Typography>
                            {[
                                { key: "lowStockAlert", label: "Low Stock Alerts", desc: "Get notified when items fall below reorder level" },
                                { key: "autoReorder", label: "Auto Reorder", desc: "Automatically flag items that need reordering" },
                                { key: "wasteTracking", label: "Waste Tracking", desc: "Enable stock movement tracking for waste analysis" },
                                { key: "lineCheckReminders", label: "Line Check Reminders", desc: "Daily reminders for FEFO expiry checks" },
                            ].map((s, i) => (
                                <Box key={s.key}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} fontSize={13}>{s.label}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                                        </Box>
                                        <Switch checked={settings[s.key]} onChange={(e) => update(s.key, e.target.checked)} size="small" />
                                    </Box>
                                    {i < 3 && <Divider />}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Defaults Panel */}
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Defaults</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Set default values for inventory operations
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                                <TextField
                                    label="Reorder Threshold (%)"
                                    value={settings.reorderThreshold}
                                    onChange={(e) => update("reorderThreshold", e.target.value)}
                                    size="small" type="number" fullWidth
                                    helperText="Alert when stock falls below this % of maximum level"
                                />
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Default Unit</InputLabel>
                                    <Select value={settings.defaultUnit} onChange={(e) => update("defaultUnit", e.target.value)} label="Default Unit">
                                        <MenuItem value="kg">Kilograms (kg)</MenuItem>
                                        <MenuItem value="L">Liters (L)</MenuItem>
                                        <MenuItem value="pcs">Pieces (pcs)</MenuItem>
                                        <MenuItem value="bottles">Bottles</MenuItem>
                                        <MenuItem value="G">Grams (G)</MenuItem>
                                        <MenuItem value="ML">Milliliters (ML)</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Count Frequency</InputLabel>
                                    <Select value={settings.countFrequency} onChange={(e) => update("countFrequency", e.target.value)} label="Count Frequency">
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="biweekly">Bi-weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
