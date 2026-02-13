import { Paper, Typography } from "@mui/material";

export default function Forbidden() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">403 - Forbidden</Typography>
      <Typography variant="body2" color="text.secondary">
        You don’t have permission to access this page.
      </Typography>
    </Paper>
  );
}
