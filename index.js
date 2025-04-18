const express = require("express");
const app = express();
const mealRoutes = require("./routes/meals");

app.use(express.json());
app.use("/meals", mealRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
