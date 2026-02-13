import { Paper, Typography } from "@mui/material";

export default function Sales() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Sales</Typography>
      <Typography variant="body2" color="text.secondary">
        Next: create sale form + show StockMovements audit.
      </Typography>
    </Paper>
  );
}
