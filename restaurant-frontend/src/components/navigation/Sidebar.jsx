import { NavLink } from "react-router-dom";
import { Box, Divider, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

const ALL_MENU = [
  { label: "Dashboard", path: "/", roles: ["Admin", "Manager", "Head Chef", "Chef", "Waiter"] },
  { label: "Ingredients", path: "/ingredients", roles: ["Admin", "Manager", "Head Chef", "Chef"] },
  { label: "Sales", path: "/sales", roles: ["Admin", "Manager", "Waiter"] },
  { label: "Users", path: "/users", roles: ["Admin"] },
];

export default function Sidebar() {
  const { role } = useAuth();

  const items = ALL_MENU.filter((x) => !x.roles || (role && x.roles.includes(role)));

  return (
    <Box sx={{ width: 260, height: "100vh", borderRight: "1px solid", borderColor: "divider" }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Restaurant Admin</Typography>
        <Typography variant="body2" color="text.secondary">
          Role: {role ?? "Unknown"}
        </Typography>
      </Box>

      <Divider />

      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            sx={{
              "&.active": { backgroundColor: "action.selected" },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
