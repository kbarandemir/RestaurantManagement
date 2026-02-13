import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { logout, user } = useAuth();
  const nav = useNavigate();

  return (
    
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {user?.email ?? ""}
          </Typography>
          <Button variant="contained" onClick={() => nav("/pos")}>
            New Order
          </Button>
          <Button variant="outlined" onClick={logout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
