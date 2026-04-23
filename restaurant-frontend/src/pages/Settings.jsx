import { useState } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Switch,
    Divider, Button, FormControl, InputLabel, Select,
    MenuItem, TextField,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";

export default function Settings() {
    const { settings, updateSetting } = useSettings();
    const { showToast } = useToast();

    // Local state for the form to handle "Save" action
    const [localSettings, setLocalSettings] = useState({ ...settings });

    const update = (key, val) => {
        setLocalSettings((p) => ({ ...p, [key]: val }));
        // For dark mode, we apply it immediately if we want instant feedback, 
        // but the user asked for a "Save Settings" button functionality.
        // Actually, it's better UX to apply dark mode immediately but regional on save.
        if (key === 'darkMode') {
            updateSetting(key, val);
        }
    };

    const handleSave = () => {
        Object.entries(localSettings).forEach(([key, val]) => {
            updateSetting(key, val);
        });
        showToast("Settings saved successfully!", "success");
    };

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Settings</Typography>
                    <Typography variant="body2" color="text.secondary">Application preferences and configuration</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<SaveRoundedIcon />} 
                    onClick={handleSave}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, bgcolor: "var(--primary)", boxShadow: "none", "&:hover": { bgcolor: "#4338CA" } }}
                >
                    Save Settings
                </Button>
            </Box>

            <Grid container spacing={2.5}>
                {/* Appearance */}
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Appearance</Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} fontSize={13}>Dark Mode</Typography>
                                    <Typography variant="caption" color="text.secondary">Switch to dark theme</Typography>
                                </Box>
                                <Switch 
                                    checked={localSettings.darkMode} 
                                    onChange={(e) => update("darkMode", e.target.checked)} 
                                    size="small" 
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Regional */}
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Regional Settings</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Language</InputLabel>
                                    <Select value={localSettings.language} onChange={(e) => update("language", e.target.value)} label="Language">
                                        <MenuItem value="en">English</MenuItem>
                                        <MenuItem value="de">Deutsch</MenuItem>
                                        <MenuItem value="nl">Nederlands</MenuItem>
                                        <MenuItem value="tr">Türkçe</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Currency</InputLabel>
                                    <Select value={localSettings.currency} onChange={(e) => update("currency", e.target.value)} label="Currency">
                                        <MenuItem value="EUR">Euro (€)</MenuItem>
                                        <MenuItem value="USD">US Dollar ($)</MenuItem>
                                        <MenuItem value="GBP">British Pound (£)</MenuItem>
                                        <MenuItem value="TRY">Turkish Lira (₺)</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Timezone</InputLabel>
                                    <Select value={localSettings.timezone} onChange={(e) => update("timezone", e.target.value)} label="Timezone">
                                        <MenuItem value="Europe/Berlin">Europe/Berlin (CET)</MenuItem>
                                        <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                                        <MenuItem value="Europe/Istanbul">Europe/Istanbul (TRT)</MenuItem>
                                        <MenuItem value="America/New_York">US Eastern</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Date Format</InputLabel>
                                    <Select value={localSettings.dateFormat} onChange={(e) => update("dateFormat", e.target.value)} label="Date Format">
                                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
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

