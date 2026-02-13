import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";

async function fetchIngredients() {
  const res = await api.get("/api/ingredients");
  return res.data;
}

export default function Ingredients() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ingredients"],
    queryFn: fetchIngredients,
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Failed to load ingredients</Typography>;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Ingredients</Typography>
      <List>
        {data?.map((i) => (
          <ListItem key={i.ingredientId} divider>
            <ListItemText primary={i.name} secondary={`BaseUnit: ${i.baseUnit}`} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
