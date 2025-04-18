const express = require("express");
const app = express();

const mealRoutes = require("./routes/meals");
const summaryRoutes = require("./routes/summary");

app.use(express.json());

// rotas de refeições
app.use("/meals", mealRoutes);

// rotas de resumo e histórico
app.use("/", summaryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
