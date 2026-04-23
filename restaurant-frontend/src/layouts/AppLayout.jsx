import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

const SIDEBAR_WIDTH = 270;
const SIDEBAR_COLLAPSED_WIDTH = 72;

function LayoutInner() {
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${sidebarW}px`,
          transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#F9FAFB",
        }}
      >
        <Topbar />
        <Box
          sx={{
            flex: 1,
            p: 2.5,
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
