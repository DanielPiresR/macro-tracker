const express = require("express");
const router = express.Router();
const db = require("../db/database");
const tacoData = require("../taco/taco.json");
const { MealDLL } = require("../utils/dll");

// POST /meals
router.post("/", (req, res) => {
  const { name, foods } = req.body;

  if (!name || !Array.isArray(foods)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const meal = new MealDLL(name, tacoData);
  foods.forEach((f) => meal.addFood(f.name, f.weight));

  const mealFoods = meal.toArray();
  const totals = meal.getTotals();

  db.run("INSERT INTO meals (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const mealId = this.lastID;
    const stmt =
      db.prepare(`INSERT INTO foods (meal_id, name, weight, calories, protein, carbs, fat)
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`);

    mealFoods.forEach((food) => {
      stmt.run(
        mealId,
        food.name,
        food.weight,
        food.calories,
        food.protein,
        food.carbs,
        food.fat
      );
    });

    stmt.finalize();

    res.status(201).json({
      meal: name,
      foods: mealFoods,
      totals,
    });
  });
});

module.exports = router;
