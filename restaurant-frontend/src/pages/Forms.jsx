import { useState } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Chip, Button,
    Tabs, Tab, IconButton, Avatar, LinearProgress,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

/* ── Mock data ──────────────────────────────────────────────────────────────── */
const FORMS = [
    { id: 1, title: "Kitchen Assistant - Job Application", type: "Job Application", submitted: "2026-02-18", status: "Pending", author: "Jonas Fischer" },
    { id: 2, title: "Equipment Repair Request", type: "Internal Request", submitted: "2026-02-17", status: "In Progress", author: "Anna K." },
    { id: 3, title: "Slip Incident - Kitchen Area", type: "Incident Report", submitted: "2026-02-15", status: "Resolved", author: "Carlos M." },
    { id: 4, title: "Waiter Position - Application", type: "Job Application", submitted: "2026-02-14", status: "Reviewed", author: "Maria Schulz" },
    { id: 5, title: "Supply Order Override Request", type: "Internal Request", submitted: "2026-02-13", status: "Pending", author: "Sven L." },
    { id: 6, title: "Broken refrigerator door", type: "Incident Report", submitted: "2026-02-12", status: "In Progress", author: "Mia D." },
    { id: 7, title: "Holiday Leave Request", type: "Internal Request", submitted: "2026-02-11", status: "Approved", author: "Laura B." },
    { id: 8, title: "Sous Chef - Job Application", type: "Job Application", submitted: "2026-02-10", status: "Pending", author: "Hans Gruber" },
];

const statusStyle = {
    Pending: { bg: "#FEF3C7", color: "#92400E" },
    "In Progress": { bg: "#DBEAFE", color: "#1E40AF" },
    Resolved: { bg: "#D1FAE5", color: "#065F46" },
    Reviewed: { bg: "#EEF2FF", color: "#4F46E5" },
    Approved: { bg: "#D1FAE5", color: "#065F46" },
};

const typeIcon = {
    "Job Application": <WorkRoundedIcon sx={{ fontSize: 18 }} />,
    "Internal Request": <AssignmentRoundedIcon sx={{ fontSize: 18 }} />,
    "Incident Report": <ReportProblemRoundedIcon sx={{ fontSize: 18 }} />,
};

export default function Forms() {
    const [tab, setTab] = useState(0);

    const types = ["All", "Job Application", "Internal Request", "Incident Report"];
    const filtered = tab === 0 ? FORMS : FORMS.filter((f) => f.type === types[tab]);

    return (
        <Box sx={{ bgcolor: "var(--bg-body)", minHeight: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>Forms</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Job applications, internal requests, and incident reports
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                        bgcolor: "#4F46E5",
                        color: "#FFFFFF",
                        boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
                        "&:hover": { bgcolor: "#4338CA", boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" },
                    }}
                >
                    New Form
                </Button>
            </Box>

            {/* Stats row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Forms", value: FORMS.length, icon: <AssignmentRoundedIcon />, color: "#4F46E5" },
                    { label: "Pending", value: FORMS.filter((f) => f.status === "Pending").length, icon: <ReportProblemRoundedIcon />, color: "#F59E0B" },
                    { label: "In Progress", value: FORMS.filter((f) => f.status === "In Progress").length, icon: <WorkRoundedIcon />, color: "#2563EB" },
                    { label: "Resolved", value: FORMS.filter((f) => ["Resolved", "Approved", "Reviewed"].includes(f.status)).length, icon: <CheckCircleRoundedIcon />, color: "#10B981" },
                ].map((s) => (
                    <Grid item xs={6} md={3} key={s.label}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ width: 40, height: 40, bgcolor: `${s.color}15`, color: s.color }}>
                                    {s.icon}
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                                    <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs + List */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                        px: 2, pt: 1,
                        "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13 },
                        "& .Mui-selected": { color: "var(--primary)" },
                        "& .MuiTabs-indicator": { backgroundColor: "var(--primary)" },
                    }}
                >
                    {types.map((t) => <Tab key={t} label={t} />)}
                </Tabs>

                <Box sx={{ p: 2 }}>
                    {filtered.map((f) => (
                        <Box
                            key={f.id}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 2,
                                mb: 1,
                                borderRadius: 2,
                                border: "1px solid var(--border-color)",
                                transition: "all 0.15s ease",
                                "&:hover": { borderColor: "var(--primary)", boxShadow: "0 0 0 1px var(--primary)" },
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                <Avatar sx={{ width: 38, height: 38, bgcolor: "#F3F4F6", color: "var(--text-secondary)" }}>
                                    {typeIcon[f.type]}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>{f.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {f.author} · {new Date(f.submitted).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Chip label={f.type} size="small" sx={{ height: 22, fontSize: 10, fontWeight: 600, bgcolor: "#F3F4F6", color: "var(--text-secondary)" }} />
                                <Chip
                                    label={f.status}
                                    size="small"
                                    sx={{
                                        height: 22, fontSize: 10, fontWeight: 700,
                                        bgcolor: statusStyle[f.status]?.bg,
                                        color: statusStyle[f.status]?.color,
                                    }}
                                />
                                <IconButton size="small"><VisibilityRoundedIcon sx={{ fontSize: 17 }} /></IconButton>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Card>
        </Box>
    );
}
