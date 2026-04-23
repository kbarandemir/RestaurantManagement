import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation
} from "../../api/reservationsApi";
import { useAuth } from "../../hooks/useAuth";

const STATUS_COLORS = {
  Pending: "warning",
  Confirmed: "info",
  Cancelled: "error",
  Completed: "success",
};

export default function Reservations() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    reservationDate: "",
    numberOfGuests: 2,
    tableNumber: "",
    status: "Pending",
    specialRequests: "",
  });

  const canEdit = role === "Admin" || role === "Manager";

  // Data Fetching
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: getReservations,
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries(["reservations"]);
      handleCloseModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateReservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["reservations"]);
      handleCloseModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries(["reservations"]);
    },
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        customerEmail: item.customerEmail || "",
        // Convert to local datetime string for input
        reservationDate: new Date(item.reservationDate).toISOString().slice(0, 16),
        numberOfGuests: item.numberOfGuests,
        tableNumber: item.tableNumber || "",
        status: item.status,
        specialRequests: item.specialRequests || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        reservationDate: "",
        numberOfGuests: 2,
        tableNumber: "",
        status: "Pending",
        specialRequests: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "customerPhone") {
      // Remove any character that isn't a digit or '+'
      const sanitized = value.replace(/[^0-9+]/g, '');
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Send ISO string UTC format to backend, and treat empty strings as null for optional validation
    const submissionData = {
      ...formData,
      customerEmail: formData.customerEmail?.trim() || null,
      reservationDate: new Date(formData.reservationDate).toISOString(),
    };

    if (editingItem) {
      updateMut.mutate({ id: editingItem.id, data: submissionData });
    } else {
      createMut.mutate(submissionData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this reservation?")) {
      deleteMut.mutate(id);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#111827" }}>
          Reservations
        </Typography>

        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              textTransform: "none",
              px: 3,
              borderRadius: "8px",
            }}
          >
            Add Reservation
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "#6B7280" }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6B7280" }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6B7280" }}>Guests</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6B7280" }}>Table</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6B7280" }}>Status</TableCell>
              {canEdit && <TableCell sx={{ fontWeight: 600, color: "#6B7280", textAlign: "right" }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} align="center" sx={{ py: 3 }}>
                  Loading reservations...
                </TableCell>
              </TableRow>
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} align="center" sx={{ py: 3, color: "#6B7280" }}>
                  No reservations found.
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((res) => (
                <TableRow key={res.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {res.customerName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B7280" }}>
                      {res.customerPhone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(res.reservationDate).toLocaleString()}
                  </TableCell>
                  <TableCell>{res.numberOfGuests}</TableCell>
                  <TableCell>{res.tableNumber || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={res.status}
                      color={STATUS_COLORS[res.status] || "default"}
                      size="small"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenModal(res)} size="small" sx={{ color: "#3B82F6" }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(res.id)} size="small" sx={{ color: "#EF4444" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── CREATE / EDIT MODAL ──────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #E5E7EB", pb: 2 }}>
          {editingItem ? "Edit Reservation" : "New Reservation"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email (Optional)"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reservation Date & Time"
                type="datetime-local"
                name="reservationDate"
                value={formData.reservationDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Guests"
                name="numberOfGuests"
                type="number"
                value={formData.numberOfGuests}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Table Number"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            {editingItem && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  size="small"
                >
                  {["Pending", "Confirmed", "Cancelled", "Completed"].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Requests"
                name="specialRequests"
                multiline
                rows={2}
                value={formData.specialRequests}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={handleCloseModal} sx={{ color: "#6B7280" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMut.isPending || updateMut.isPending}
            sx={{
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              textTransform: "none",
            }}
          >
            {editingItem ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
