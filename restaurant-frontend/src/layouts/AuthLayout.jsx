import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Box sx={{ width: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Container>
  );
}
