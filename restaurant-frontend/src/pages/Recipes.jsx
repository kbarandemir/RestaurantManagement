import { useState, useMemo } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip, Divider,
    Accordion, AccordionSummary, AccordionDetails, InputBase, CircularProgress, Alert,
    Tabs, Tab
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import EuroRoundedIcon from "@mui/icons-material/EuroRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

function euro(n) {
    if (typeof n !== 'number') return "€0,00";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

const safeParseJson = (str) => {
    if (!str) return ["Prepare ingredients.", "Cook according to standard procedure.", "Plate and serve hot."];
    try {
        return JSON.parse(str);
    } catch {
        return [str];
    }
};

export default function Recipes() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    const { data: recipes = [], isLoading, isError } = useQuery({
        queryKey: ["recipes"],
        queryFn: async () => {
            const res = await api.get("/api/recipes");
            return res.data;
        }
    });

    // Extract unique categories sorted alphabetically
    const categories = useMemo(() => {
        const cats = [...new Set(recipes.map((r) => r.categoryName || "Uncategorized"))].sort();
        return ["All", ...cats];
    }, [recipes]);

    const filtered = recipes.filter((r) => {
        const matchesSearch =
            r.menuItemName?.toLowerCase().includes(search.toLowerCase()) ||
            r.categoryName?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
            activeTab === 0 || (r.categoryName || "Uncategorized") === categories[activeTab];
        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", flex: 1, p: 4, pt: 8, justifyContent: "center" }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">Failed to load recipes. Please check connection.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Recipes</Typography>
                <Typography variant="body2" color="text.secondary">
                    View recipe details, ingredient breakdowns, and preparation steps — Chef access only
                </Typography>
            </Box>

            {/* Search */}
            <Box
                sx={{
                    display: "flex", alignItems: "center",
                    backgroundColor: "var(--bg-card)", borderRadius: 2.5,
                    px: 2, py: 0.8, mb: 2,
                    border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-sm)", maxWidth: 400,
                }}
            >
                <SearchRoundedIcon sx={{ fontSize: 18, color: "var(--text-tertiary)", mr: 1 }} />
                <InputBase
                    placeholder="Search recipes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ fontSize: 13, fontFamily: "var(--font-family)", flex: 1 }}
                />
            </Box>

            {/* Category tabs */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    mb: 3,
                    borderBottom: "1px solid var(--border-color)",
                    "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        minHeight: 40,
                        px: 2,
                    },
                    "& .Mui-selected": { color: "#4F46E5" },
                    "& .MuiTabs-indicator": { backgroundColor: "#4F46E5" },
                }}
            >
                {categories.map((cat) => {
                    const count = cat === "All"
                        ? recipes.length
                        : recipes.filter((r) => (r.categoryName || "Uncategorized") === cat).length;
                    return <Tab key={cat} label={`${cat} (${count})`} />;
                })}
            </Tabs>

            {/* Recipe cards */}
            {filtered.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                        No recipes found{activeTab > 0 ? ` in "${categories[activeTab]}"` : ""}{search ? ` matching "${search}"` : ""}.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2.5}>
                    {filtered.map((recipe) => {
                        const totalCost = recipe.items ? recipe.items.reduce((s, i) => s + (i.unitCost * i.quantityPerUnit), 0) : 0;
                        const steps = safeParseJson(recipe.instructions);
                        return (
                            <Grid item xs={12} lg={6} key={recipe.recipeId}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid var(--border-color)",
                                        boxShadow: "var(--shadow-sm)",
                                        transition: "all 0.2s ease",
                                        "&:hover": { boxShadow: "var(--shadow-md)" },
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        {/* Header */}
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700}>{recipe.menuItemName}</Typography>
                                                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                                    <Chip label={recipe.categoryName || "Uncategorized"} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }} />
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Quick stats */}
                                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                            {[
                                                { icon: <TimerRoundedIcon sx={{ fontSize: 16 }} />, label: "Prep Time", value: recipe.prepTime || "15 min" },
                                                { icon: <EuroRoundedIcon sx={{ fontSize: 16 }} />, label: "Cost", value: euro(totalCost) },
                                                { icon: <RestaurantRoundedIcon sx={{ fontSize: 16 }} />, label: "Servings", value: recipe.servings || 1 },
                                            ].map((s) => (
                                                <Grid item xs={4} key={s.label}>
                                                    <Box sx={{ bgcolor: "#F9FAFB", borderRadius: 2, p: 1.5, textAlign: "center" }}>
                                                        <Box sx={{ color: "var(--text-tertiary)", mb: 0.3 }}>{s.icon}</Box>
                                                        <Typography variant="caption" color="text.secondary" fontSize={10}>{s.label}</Typography>
                                                        <Typography variant="body2" fontWeight={700} fontSize={13}>{s.value}</Typography>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>

                                        {/* Ingredients accordion */}
                                        <Accordion
                                            elevation={0}
                                            sx={{
                                                border: "1px solid var(--border-color)",
                                                borderRadius: "8px !important",
                                                mb: 1,
                                                "&:before": { display: "none" },
                                            }}
                                        >
                                            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                                                <Typography variant="body2" fontWeight={600} fontSize={13}>
                                                    Ingredients ({recipe.items?.length || 0})
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0 }}>
                                                {recipe.items?.map((ing, i) => (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            display: "flex", justifyContent: "space-between",
                                                            py: 0.75,
                                                            borderBottom: i < recipe.items.length - 1 ? "1px solid #F3F4F6" : "none",
                                                        }}
                                                    >
                                                        <Typography variant="body2" fontSize={12.5}>{ing.ingredientName}</Typography>
                                                        <Box sx={{ display: "flex", gap: 2 }}>
                                                            <Typography variant="body2" fontSize={12.5} color="text.secondary">{ing.quantityPerUnit}x</Typography>
                                                            <Typography variant="body2" fontSize={12.5} fontWeight={600}>{euro(ing.unitCost * ing.quantityPerUnit)}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography variant="body2" fontWeight={700} fontSize={12.5}>Total Cost</Typography>
                                                    <Typography variant="body2" fontWeight={700} fontSize={12.5} color="var(--primary)">
                                                        {euro(totalCost)}
                                                    </Typography>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>

                                        {/* Steps accordion */}
                                        <Accordion
                                            elevation={0}
                                            sx={{
                                                border: "1px solid var(--border-color)",
                                                borderRadius: "8px !important",
                                                "&:before": { display: "none" },
                                            }}
                                        >
                                            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                                                <Typography variant="body2" fontWeight={600} fontSize={13}>
                                                    Preparation Steps ({steps.length})
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0 }}>
                                                {steps.map((step, i) => (
                                                    <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: 22, height: 22, minWidth: 22,
                                                                borderRadius: "50%",
                                                                bgcolor: "var(--primary-light)",
                                                                color: "var(--primary)",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: 11, fontWeight: 700, mt: 0.2,
                                                            }}
                                                        >
                                                            {i + 1}
                                                        </Box>
                                                        <Typography variant="body2" fontSize={12.5}>{step}</Typography>
                                                    </Box>
                                                ))}
                                            </AccordionDetails>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}
