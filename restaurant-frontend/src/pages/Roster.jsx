import { useState, useEffect, useMemo } from "react";
import {
    Box, Typography, Card, CardContent, Chip, Avatar,
    Table, TableBody, TableRow, TableCell, TableHead, IconButton,
    Select, MenuItem, FormControl, InputLabel, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Alert, Tooltip, TableContainer
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

/* ── Constants & Helpers ───────────────────────────────────────────────── */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getRoleAbbreviation = (roleName) => {
    switch (roleName) {
        case "Admin": return "AD";
        case "Manager": return "MG";
        case "Head Chef": return "HC";
        case "Assistant Head Chef": return "AH";
        case "Chef": return "CH";
        case "Assistant Manager": return "AM";
        case "Waiter": return "WT";
        case "Staff": return "ST";
        default: return (roleName || "??").substring(0, 2).toUpperCase();
    }
};

const formatTimeLabel = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5); // "10:00:00" -> "10:00"
};

const getMonday = (offset) => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7); // Sunday is 0
    d.setDate(diff);
    return d;
};

const formatDateForAPI = (dateObject) => {
    const yyyy = dateObject.getFullYear();
    const mm = String(dateObject.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObject.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

/* ── Subcomponents ─────────────────────────────────────────────────────── */

// The customized blue time-slot chip from the reference image
function ShiftChip({ shift, onClick, canEdit }) {
    const isDraft = !shift.isPublished;
    return (
        <Box
            onClick={(e) => { e.stopPropagation(); onClick(shift); }}
            title={shift.note ? `Note: ${shift.note}` : ""}
            sx={{
                display: "flex",
                alignItems: "stretch",
                bgcolor: isDraft ? "#E2E8F0" : "#A7C5F9",
                border: "1px solid",
                borderColor: isDraft ? "#CBD5E1" : "#5687D6",
                borderRadius: "4px",
                mb: 0.5,
                width: "100%",
                cursor: canEdit ? "pointer" : "default",
                overflow: 'hidden',
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                backgroundImage: isDraft
                    ? "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)"
                    : "none",
                "&:hover": { bgcolor: canEdit ? (isDraft ? "#CBD5E1" : "#98BBF5") : (isDraft ? "#E2E8F0" : "#A7C5F9") }
            }}
        >
            {/* Time part */}
            <Box sx={{ flexGrow: 1, py: 0.5, px: 0.5, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", "& .hover-edit": { opacity: 0 }, "&:hover": { "& .hover-edit": { opacity: canEdit ? 1 : 0 } } }}>
                <Typography sx={{ fontWeight: 700, fontSize: "12.5px", color: isDraft ? "#475569" : "#1E3A8A", letterSpacing: -0.2 }}>
                    {formatTimeLabel(shift.startTime)} - {formatTimeLabel(shift.endTime)} {isDraft && "*"}
                </Typography>
                {canEdit && (
                    <EditRoundedIcon
                        className="hover-edit"
                        sx={{ position: "absolute", right: 2, fontSize: 13, color: isDraft ? "#475569" : "#1E3A8A", transition: "opacity 0.2s" }}
                    />
                )}
            </Box>
            {/* Role part */}
            <Box sx={{
                bgcolor: isDraft ? "#94A3B8" : "#5B86F4",
                color: "#0F172A",
                minWidth: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderLeft: "1px solid",
                borderColor: isDraft ? "#CBD5E1" : "#5687D6",
                px: 1
            }}>
                <Typography sx={{ fontWeight: 800, fontSize: "11px", color: isDraft ? "#F8FAFC" : "#1E3A8A" }}>
                    {getRoleAbbreviation(shift.roleName)}
                </Typography>
            </Box>
        </Box>
    );
}

function StatCard({ label, value, color }) {
    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E5E7EB", flex: 1 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontSize={11.5} fontWeight={600} textTransform="uppercase">
                    {label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.25 }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
}

/* ── Main Roster Page ──────────────────────────────────────────────────── */

export default function Roster() {
    const { role } = useAuth();
    
    let roleStr = "";
    if (typeof role === "string") roleStr = role.toLowerCase();
    else if (Array.isArray(role) && role.length > 0) roleStr = role[0].toLowerCase();
    
    const canEdit = roleStr === "admin" || roleStr === "manager";
    const { showToast } = useToast();

    const [weekOffset, setWeekOffset] = useState(0);
    const [filterRole, setFilterRole] = useState("All");

    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState("create");
    const [selectedCell, setSelectedCell] = useState(null);
    const [editingShift, setEditingShift] = useState(null);
    const [form, setForm] = useState({ startTime: "10:00", endTime: "17:00", note: "" });

    // Computed Dates
    const weekStartDate = useMemo(() => getMonday(weekOffset), [weekOffset]);
    const weekStartStr = useMemo(() => formatDateForAPI(weekStartDate), [weekStartDate]);

    const weekDays = useMemo(() => {
        return DAYS.map((d, i) => {
            const dateObj = new Date(weekStartDate);
            dateObj.setDate(weekStartDate.getDate() + i);
            return {
                dayName: d,
                dateStr: formatDateForAPI(dateObj),
                display: `${d.substring(0, 3)} ${dateObj.getDate()}/${dateObj.getMonth() + 1}`
            };
        });
    }, [weekStartDate]);

    const weekLabel = useMemo(() => {
        const end = new Date(weekStartDate);
        end.setDate(end.getDate() + 6);
        const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        return `${fmt(weekStartDate)} – ${fmt(end)}`;
    }, [weekStartDate]);

    useEffect(() => {
        loadData();
    }, [weekStartStr]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, shiftsRes] = await Promise.all([
                api.get("/api/users?includeInactive=false"),
                api.get(`/api/roster?weekStart=${weekStartStr}`)
            ]);
            setUsers(usersRes.data);
            setShifts(shiftsRes.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load roster data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddShift = () => {
        if (!canEdit) return;
        setSelectedCell(null);
        setEditingShift(null);
        setForm({ startTime: "10:00", endTime: "17:00", note: "" });
        setDialogMode("create");
        setOpenDialog(true);
    };

    // Derived states
    const filteredStaff = filterRole === "All"
        ? users
        : users.filter((u) => u.roleName === filterRole);

    const shiftMap = useMemo(() => {
        const map = {};
        shifts.forEach(s => {
            const key = `${s.userId}_${s.date}`;
            if (!map[key]) map[key] = [];
            map[key].push(s);
        });
        return map;
    }, [shifts]);

    const totalHours = useMemo(() => {
        return shifts.reduce((total, s) => {
            const [h1, m1] = s.startTime.split(":");
            const [h2, m2] = s.endTime.split(":");
            const d1 = new Date(); d1.setHours(h1, m1, 0);
            const d2 = new Date(); d2.setHours(h2, m2, 0);
            let diff = (d2 - d1) / (1000 * 60 * 60);
            if (diff < 0) diff += 24; // overnight shift
            return total + diff;
        }, 0);
    }, [shifts]);

    const hasDrafts = useMemo(() => shifts.some(s => !s.isPublished), [shifts]);

    // Handlers
    const handleCellClick = (userId, dateStr) => {
        if (!canEdit) return;
        setSelectedCell({ userId, dateStr });
        setForm({ startTime: "10:00", endTime: "17:00", note: "" });
        setDialogMode("create");
        setOpenDialog(true);
    };

    const handleShiftClick = (shift) => {
        if (!canEdit) return;
        setEditingShift(shift);
        setForm({
            startTime: formatTimeLabel(shift.startTime),
            endTime: formatTimeLabel(shift.endTime),
            note: shift.note || ""
        });
        setDialogMode("edit");
        setOpenDialog(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (dialogMode === "create") {
                await api.post("/api/roster", {
                    userId: selectedCell ? selectedCell.userId : form.userId,
                    date: selectedCell ? selectedCell.dateStr : form.date || weekStartStr,
                    startTime: form.startTime + ":00",
                    endTime: form.endTime + ":00",
                    note: form.note
                });
            } else {
                await api.put(`/api/roster/${editingShift.shiftId}`, {
                    startTime: form.startTime + ":00",
                    endTime: form.endTime + ":00",
                    note: form.note
                });
            }
            setOpenDialog(false);
            showToast(dialogMode === "create" ? "Shift assigned successfully." : "Shift updated.", "success");
            loadData();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.error || "Error saving shift. Ensure end time is after start time.", "error");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this shift?")) return;
        try {
            await api.delete(`/api/roster/${editingShift.shiftId}`);
            setOpenDialog(false);
            showToast("Shift deleted.", "success");
            loadData();
        } catch (err) {
            console.error(err);
            showToast("Error deleting shift.", "error");
        }
    };

    const handlePublishWeek = async () => {
        if (!window.confirm("Publish all draft shifts for this week? They will become visible to all staff.")) return;
        try {
            await api.post(`/api/roster/publish?weekStart=${weekStartStr}`);
            showToast("Roster published successfully!", "success");
            loadData();
        } catch (err) {
            console.error(err);
            showToast("Error publishing roster.", "error");
        }
    };

    return (
        <Box sx={{ minHeight: "100%", pb: 4 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>
                        Staff Weekly Roster
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {canEdit ? "Click on a grid cell to assign a time-slot or click a shift to edit." : "View your scheduled shifts."}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {canEdit && (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<AddRoundedIcon />}
                                onClick={handleAddShift}
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
                                Assign Shift
                            </Button>
                            {shifts.length > 0 && (
                                <Button
                                    variant="outlined"
                                    onClick={handlePublishWeek}
                                    disabled={!hasDrafts}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 2.5,
                                        borderColor: "#4F46E5",
                                        color: "#4F46E5",
                                        "&:hover": { borderColor: "#4338CA", bgcolor: "rgba(79, 70, 229, 0.04)" },
                                        "&:disabled": { borderColor: "#E5E7EB", color: "#9CA3AF" }
                                    }}
                                >
                                    {hasDrafts ? (shifts.some(s => s.isPublished) ? "Republish Week" : "Publish Week") : "✓ Published"}
                                </Button>
                            )}
                        </>
                    )}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Filter Role</InputLabel>
                        <Select
                            value={filterRole}
                            label="Filter Role"
                            onChange={(e) => setFilterRole(e.target.value)}
                            sx={{ borderRadius: 2, bgcolor: "white" }}
                        >
                            <MenuItem value="All">All Roles</MenuItem>
                            <MenuItem value="Manager">Manager</MenuItem>
                            <MenuItem value="Head Chef">Head Chef</MenuItem>
                            <MenuItem value="Chef">Chef</MenuItem>
                            <MenuItem value="Waiter">Waiter</MenuItem>
                            <MenuItem value="Staff">Staff</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <StatCard label="Total Staff Shown" value={filteredStaff.length} color="#111827" />
                <StatCard label="Total Weekly Shifts" value={shifts.length} color="#2563EB" />
                <StatCard label="Total Scheduled Hours" value={Math.round(totalHours)} color="#059669" />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                {/* Navigation */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "white", p: 0.5, borderRadius: 2, border: "1px solid #E5E7EB" }}>
                    <IconButton size="small" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeftRoundedIcon /></IconButton>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 160, textAlign: "center" }}>
                        {weekLabel}
                    </Typography>
                    <IconButton size="small" onClick={() => setWeekOffset(w => w + 1)}><ChevronRightRoundedIcon /></IconButton>
                    {weekOffset !== 0 && (
                        <Button size="small" variant="text" onClick={() => setWeekOffset(0)} sx={{ fontWeight: 600 }}>
                            Today
                        </Button>
                    )}
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Roster Grid */}
            <TableContainer sx={{
                border: "1px solid #D1D5DB",
                borderBottom: "none",
                borderRadius: 2,
                bgcolor: "white",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
            }}>
                <Table size="small" sx={{ "& th, & td": { borderRight: "1px solid #D1D5DB", borderBottom: "1px solid #D1D5DB" } }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#F3F4F6" }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: 13, minWidth: 180, py: 1.5 }}>
                                Staff Member
                            </TableCell>
                            {weekDays.map((wd) => (
                                <TableCell key={wd.dateStr} align="center" sx={{ fontWeight: 700, fontSize: 13, minWidth: 140, py: 1.5 }}>
                                    {wd.display}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    No staff members found for the selected view.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStaff.map((u) => (
                                <TableRow key={u.userId} hover>
                                    <TableCell sx={{ bgcolor: "#FAFAFA" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }}>
                                                {`${u.firstName || ""} ${u.lastName || ""}`.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} fontSize={13} noWrap>
                                                    {`${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unnamed"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontSize={11}>
                                                    {u.roleName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {weekDays.map((wd) => {
                                        const key = `${u.userId}_${wd.dateStr}`;
                                        const dayShifts = shiftMap[key] || [];
                                        return (
                                            <TableCell
                                                key={wd.dateStr}
                                                align="center"
                                                sx={{
                                                    p: 1,
                                                    verticalAlign: "top",
                                                    cursor: canEdit ? "pointer" : "default",
                                                    "&:hover": { bgcolor: canEdit ? "rgba(0,0,0,0.02)" : "transparent" },
                                                }}
                                                onClick={() => handleCellClick(u.userId, wd.dateStr)}
                                            >
                                                {dayShifts.map((s) => (
                                                    <ShiftChip key={s.shiftId} shift={s} onClick={handleShiftClick} canEdit={canEdit} />
                                                ))}
                                                {canEdit && dayShifts.length === 0 && (
                                                    <Box sx={{ height: 26, opacity: 0, transition: "opacity 0.2s", "&:hover": { opacity: 0.5 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <AddRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                                    </Box>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Shift Form Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {dialogMode === "create" ? "Assign New Shift" : "Edit Shift"}
                    {dialogMode === "edit" && canEdit && (
                        <Tooltip title="Delete Shift">
                            <IconButton color="error" size="small" onClick={handleDelete}>
                                <DeleteRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </DialogTitle>
                <form onSubmit={handleSave}>
                    <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {dialogMode === "create" && !selectedCell && (
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Staff Member</InputLabel>
                                    <Select
                                        required
                                        value={form.userId || ""}
                                        label="Staff Member"
                                        onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                    >
                                        {users.map(u => (
                                            <MenuItem key={u.userId} value={u.userId}>
                                                {`${u.firstName || ""} ${u.lastName || ""}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Date"
                                    type="date"
                                    required
                                    fullWidth
                                    size="small"
                                    value={form.date || weekStartStr}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        )}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                label="Start Time"
                                type="time"
                                required
                                fullWidth
                                variant="outlined"
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }} // 5 min
                            />
                            <TextField
                                label="End Time"
                                type="time"
                                required
                                fullWidth
                                variant="outlined"
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                            />
                        </Box>
                        <TextField
                            label="Note (Optional)"
                            multiline
                            rows={2}
                            fullWidth
                            variant="outlined"
                            placeholder="e.g. Closing duties"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                        <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                        <Button type="submit" variant="contained" sx={{ fontWeight: 600, bgcolor: "#4F46E5", color: "#FFFFFF", boxShadow: "none", "&:hover": { bgcolor: "#4338CA" } }}>
                            {dialogMode === "create" ? "Assign Shift" : "Save Changes"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
