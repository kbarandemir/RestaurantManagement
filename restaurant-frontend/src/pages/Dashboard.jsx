import { Paper, Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Dashboard</Typography>
      <Typography variant="body2" color="text.secondary">
        Next: show totals (sales count, low stock, expiring batches).
      </Typography>
    </Paper>
  );
}
