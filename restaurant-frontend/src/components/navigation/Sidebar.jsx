import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Tooltip,
  Typography,
} from "@mui/material";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../context/SidebarContext";
import { hasPermission } from "../../config/permissions";

/* ── Constants ─────────────────────────────────────────────────────────────── */
const SIDEBAR_WIDTH = 270;
const SIDEBAR_COLLAPSED_WIDTH = 72;

/* ── Menu definition ───────────────────────────────────────────────────────── */
const MAIN_ITEMS = [
  { label: "Dashboard", icon: DashboardRoundedIcon, path: "/", section: "dashboard" },
  { label: "POS", icon: PointOfSaleRoundedIcon, path: "/pos", section: "pos" },
  { label: "Sales & Orders", icon: ReceiptRoundedIcon, path: "/sales", section: "sales" },
  { label: "Analytics", icon: AnalyticsRoundedIcon, path: "/analytics", section: "analytics" },
  { label: "User Management", icon: PeopleAltRoundedIcon, path: "/users", section: "userManagement" },
  { label: "Forms", icon: DescriptionRoundedIcon, path: "/forms", section: "forms" },
  { label: "Menu", icon: RestaurantMenuRoundedIcon, path: "/menu", section: "menu" },
  { label: "Recipes", icon: MenuBookRoundedIcon, path: "/recipes", section: "recipes" },
  { label: "Roster", icon: CalendarMonthRoundedIcon, path: "/roster", section: "roster" },
  { label: "Reservations", icon: DescriptionRoundedIcon, path: "/reservations", section: "reservations" },
];

const INVENTORY_CHILDREN = [
  { label: "Incoming Orders", icon: LocalShippingRoundedIcon, path: "/inventory/incoming-orders" },
  { label: "Wastage", icon: DeleteSweepRoundedIcon, path: "/inventory/wastage" },
  { label: "Line Checks", icon: FactCheckRoundedIcon, path: "/inventory/line-checks" },
  { label: "Current Stock", icon: WarehouseRoundedIcon, path: "/inventory/current-stock" },
  { label: "Inventory Settings", icon: TuneRoundedIcon, path: "/inventory/settings" },
];

const BOTTOM_ITEMS = [
  { label: "Profile", icon: PersonRoundedIcon, path: "/profile", section: "profile" },
  { label: "Settings", icon: SettingsRoundedIcon, path: "/settings", section: "settings" },
];

/* ── Styles ────────────────────────────────────────────────────────────────── */
const activeStyles = {
  backgroundColor: "#EEF2FF",
  color: "#4F46E5",
  "& .MuiListItemIcon-root": { color: "#4F46E5" },
  "&:hover": { backgroundColor: "#EEF2FF" },
};

const itemSx = (collapsed) => ({
  borderRadius: 2,
  mx: collapsed ? 0.75 : 1,
  mb: 0.3,
  px: collapsed ? 1.5 : 1.75,
  py: 0.85,
  color: "#374151",
  transition: "all 0.2s ease",
  justifyContent: collapsed ? "center" : "flex-start",
  "&:hover": {
    backgroundColor: "#F3F4F6",
  },
  "&.active": activeStyles,
});

const iconSx = {
  minWidth: 36,
  color: "#9CA3AF",
  "& .MuiSvgIcon-root": { fontSize: 20 },
};

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { role } = useAuth();
  const { collapsed } = useSidebar();
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );

  const canSeeInventory = hasPermission(role, "inventory");
  const isInventoryActive = location.pathname.startsWith("/inventory");
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const renderItem = (item, isSubItem = false) => {
    const Icon = item.icon;
    const btn = (
      <ListItemButton
        key={item.path}
        component={NavLink}
        to={item.path}
        end={item.path === "/"}
        sx={{
          ...itemSx(collapsed),
          ...(isSubItem && !collapsed ? { pl: 5.5 } : {}),
          ...(isSubItem && collapsed ? { px: 1.5 } : {}),
        }}
      >
        <ListItemIcon sx={iconSx}>
          <Icon />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: isSubItem ? 13 : 13.5,
              fontWeight: 500,
              noWrap: true,
            }}
          />
        )}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip key={item.path} title={item.label} placement="right" arrow>
        {btn}
      </Tooltip>
    ) : (
      btn
    );
  };

  return (
    <Box
      component="nav"
      sx={{
        width: sidebarW,
        minWidth: sidebarW,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5,
          py: 2.25,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: 64,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: 2,
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: -0.5,
          }}
        >
          RM
        </Box>
        {!collapsed && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: 14.5,
                color: "#111827",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
              }}
            >
              RestaurantOS
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#9CA3AF",
                fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              Management Suite
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB", opacity: 0.7 }} />

      {/* ── Main navigation ────────────────────────────────────────────────── */}
      <List sx={{ flex: 1, py: 1 }}>
        {MAIN_ITEMS.filter((item) => hasPermission(role, item.section)).map((item) =>
          renderItem(item)
        )}

        {/* Inventory with nested submenu */}
        {canSeeInventory && (
          <>
            {collapsed ? (
              <Tooltip title="Inventory" placement="right" arrow>
                <ListItemButton
                  component={NavLink}
                  to="/inventory/incoming-orders"
                  sx={{
                    ...itemSx(true),
                    ...(isInventoryActive ? activeStyles : {}),
                  }}
                >
                  <ListItemIcon sx={iconSx}>
                    <InventoryRoundedIcon />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            ) : (
              <>
                <ListItemButton
                  onClick={() => setInventoryOpen(!inventoryOpen)}
                  sx={{
                    ...itemSx(false),
                    ...(isInventoryActive ? activeStyles : {}),
                  }}
                >
                  <ListItemIcon sx={iconSx}>
                    <InventoryRoundedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Inventory"
                    primaryTypographyProps={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      noWrap: true,
                    }}
                  />
                  {inventoryOpen ? (
                    <ExpandLessRoundedIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
                  ) : (
                    <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
                  )}
                </ListItemButton>

                <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {INVENTORY_CHILDREN.map((child) => renderItem(child, true))}
                  </List>
                </Collapse>
              </>
            )}
          </>
        )}
      </List>

      {/* ── Bottom section ─────────────────────────────────────────────────── */}
      <Divider sx={{ borderColor: "#E5E7EB", opacity: 0.7, mx: 1.5 }} />

      <List sx={{ py: 1 }}>
        {BOTTOM_ITEMS.filter((item) => hasPermission(role, item.section)).map((item) => {
          const Icon = item.icon;
          const btn = (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                ...itemSx(collapsed),
                py: 0.7,
              }}
            >
              <ListItemIcon sx={{ ...iconSx, "& .MuiSvgIcon-root": { fontSize: 19 } }}>
                <Icon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "#6B7280",
                    noWrap: true,
                  }}
                />
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={item.path} title={item.label} placement="right" arrow>
              {btn}
            </Tooltip>
          ) : (
            btn
          );
        })}
      </List>
    </Box>
  );
}
