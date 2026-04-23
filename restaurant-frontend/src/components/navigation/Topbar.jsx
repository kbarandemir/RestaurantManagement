import { useState } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Badge,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Chip,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../context/SidebarContext";
import { useNavigate, useLocation } from "react-router-dom";

/* Title lookup by route */
const ROUTE_TITLES = {
  "/": "Dashboard",
  "/pos": "Point of Sale",
  "/analytics": "Analytics",
  "/users": "User Management",
  "/forms": "Forms",
  "/menu": "Menu Editor",
  "/recipes": "Recipes",
  "/roster": "Roster",
  "/inventory/incoming-orders": "Incoming Orders",
  "/inventory/wastage": "Wastage",
  "/inventory/line-checks": "Line Checks",
  "/inventory/stock-count": "Stock Count",
  "/inventory/settings": "Inventory Settings",
  "/profile": "Profile",
  "/settings": "Settings",
};

const roleColorMap = {
  Admin: "#4F46E5",
  Manager: "#0891B2",
  Chef: "#D97706",
  "Head Chef": "#D97706",
  Staff: "#6B7280",
  Waiter: "#6B7280",
};

export default function Topbar() {
  const { logout, user, role } = useAuth();
  const { toggle } = useSidebar();
  const nav = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const pageTitle = ROUTE_TITLES[location.pathname] || "Dashboard";
  const rc = roleColorMap[role] || "#6B7280";

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, md: 3 },
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky",
        top: 0,
        zIndex: 1100,
      }}
    >
      {/* Left: hamburger + page title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={toggle}
          size="small"
          sx={{
            borderRadius: 2,
            color: "#6B7280",
            "&:hover": { bgcolor: "#F3F4F6" },
          }}
        >
          <MenuRoundedIcon sx={{ fontSize: 22 }} />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: -0.3,
            color: "#111827",
            display: { xs: "none", sm: "block" },
          }}
        >
          {pageTitle}
        </Typography>
      </Box>

      {/* Right: search + notifications + user */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* User avatar */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            ml: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 2.5,
            transition: "background-color 0.15s ease",
            "&:hover": { bgcolor: "#F3F4F6" },
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            }}
          >
            {(user?.firstName?.[0] || user?.email?.[0] || role?.[0] || "U").toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: "none", lg: "block" } }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.3, color: "#111827" }}
            >
              {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || "User"}
            </Typography>
            <Chip
              label={role || "Unknown"}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: `${rc}15`,
                color: rc,
                border: `1px solid ${rc}25`,
              }}
            />
          </Box>
        </Box>

        {/* User dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                borderRadius: 2.5,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                border: "1px solid #E5E7EB",
                minWidth: 180,
              },
            },
          }}
        >
          <MenuItem onClick={() => { setAnchorEl(null); nav("/profile"); }}>
            <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); nav("/settings"); }}>
            <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
            <ListItemIcon><LogoutRoundedIcon fontSize="small" sx={{ color: "#EF4444" }} /></ListItemIcon>
            <Typography sx={{ color: "#EF4444", fontWeight: 500, fontSize: 14 }}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
