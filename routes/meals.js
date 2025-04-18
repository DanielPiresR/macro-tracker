const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { buildMeal } = require("../services/nutrition");

/**
 * GET /meals?date=YYYY-MM-DD
 * Lista todas as refeições de um dia, com itens e totais.
 */
router.get("/", (req, res, next) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  db.all(
    "SELECT id, name, date FROM meals WHERE date = ? ORDER BY created_at",
    [date],
    (err, meals) => {
      if (err) return res.status(500).json({ error: err.message });

      Promise.all(
        meals.map((meal) => {
          return new Promise((resolve, reject) => {
            db.all(
              `SELECT
                 mf.id            AS id,
                 mf.taco_item_id  AS taco_item_id,
                 ti.name          AS name,
                 mf.weight,
                 mf.calories,
                 mf.protein,
                 mf.carbs,
                 mf.fat
               FROM meal_foods mf
               JOIN taco_items ti ON ti.id = mf.taco_item_id
               WHERE mf.meal_id = ?`,
              [meal.id],
              (err, foods) => {
                if (err) return reject(err);
                const totals = foods.reduce(
                  (t, f) => ({
                    calories: t.calories + f.calories,
                    protein: t.protein + f.protein,
                    carbs: t.carbs + f.carbs,
                    fat: t.fat + f.fat,
                  }),
                  { calories: 0, protein: 0, carbs: 0, fat: 0 }
                );
                resolve({
                  id: meal.id,
                  name: meal.name,
                  date: meal.date,
                  foods,
                  totals,
                });
              }
            );
          });
        })
      )
        .then((results) => res.json(results))
        .catch((err) => next(err));
    }
  );
});

/**
 * POST /meals
 * Cria uma refeição (vazia ou com alimentos).
 * Body: { name: string, foods?: [{ taco_item_id: number, weight: number }] }
 */
router.post("/", (req, res, next) => {
  const { name, foods } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Campo 'name' é obrigatório" });
  }

  db.run("INSERT INTO meals (name) VALUES (?)", [name], async function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const mealId = this.lastID;

    if (Array.isArray(foods) && foods.length > 0) {
      try {
        const { foods: foodsDetails, totals } = await buildMeal(name, foods);
        const stmt = db.prepare(`
            INSERT INTO meal_foods
              (meal_id, taco_item_id, weight, calories, protein, carbs, fat)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
        foodsDetails.forEach((f) => {
          stmt.run(
            mealId,
            f.taco_item_id,
            f.weight,
            f.calories,
            f.protein,
            f.carbs,
            f.fat
          );
        });
        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({
            id: mealId,
            name,
            foods: foodsDetails,
            totals,
          });
        });
      } catch (err) {
        next(err);
      }
    } else {
      // refeição criada sem alimentos
      res.status(201).json({
        id: mealId,
        name,
        foods: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      });
    }
  });
});

/**
 * POST /meals/:mealId/foods
 * Adiciona um alimento a uma refeição existente.
 * Body: { taco_item_id: number, weight: number }
 */
router.post("/:mealId/foods", (req, res, next) => {
  const mealId = parseInt(req.params.mealId, 10);
  const { taco_item_id, weight } = req.body;

  if (!taco_item_id || !weight) {
    return res
      .status(400)
      .json({ error: "Campos 'taco_item_id' e 'weight' são obrigatórios" });
  }

  // Valida existência da refeição
  db.get("SELECT id FROM meals WHERE id = ?", [mealId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Refeição não encontrada" });

    // Calcula macros para o item
    buildMeal("", [{ taco_item_id, weight }])
      .then(({ foods }) => {
        const f = foods[0];
        const stmt = db.prepare(`
            INSERT INTO meal_foods
              (meal_id, taco_item_id, weight, calories, protein, carbs, fat)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
        stmt.run(
          mealId,
          taco_item_id,
          weight,
          f.calories,
          f.protein,
          f.carbs,
          f.fat,
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            // Recalcula totais da refeição
            db.all(
              "SELECT calories, protein, carbs, fat FROM meal_foods WHERE meal_id = ?",
              [mealId],
              (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                const totals = rows.reduce(
                  (t, x) => ({
                    calories: t.calories + x.calories,
                    protein: t.protein + x.protein,
                    carbs: t.carbs + x.carbs,
                    fat: t.fat + x.fat,
                  }),
                  { calories: 0, protein: 0, carbs: 0, fat: 0 }
                );
                res.status(201).json({ food: f, totals });
              }
            );
          }
        );
        stmt.finalize();
      })
      .catch(next);
  });
});

/**
 * DELETE /meals/:mealId/foods/:foodId
 * Remove um alimento de uma refeição.
 */
router.delete("/:mealId/foods/:foodId", (req, res, next) => {
  const mealId = parseInt(req.params.mealId, 10);
  const foodId = parseInt(req.params.foodId, 10);

  db.run(
    "DELETE FROM meal_foods WHERE id = ? AND meal_id = ?",
    [foodId, mealId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: "Alimento não encontrado nesta refeição" });
      }
      res.status(204).end();
    }
  );
});

/**
 * DELETE /meals/:mealId
 * Remove uma refeição e todos os seus alimentos.
 */
router.delete("/:mealId", (req, res, next) => {
  const mealId = parseInt(req.params.mealId, 10);

  // 1) Remove todos os alimentos da refeição
  db.run("DELETE FROM meal_foods WHERE meal_id = ?", [mealId], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // 2) Remove a própria refeição
    db.run("DELETE FROM meals WHERE id = ?", [mealId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Refeição não encontrada" });
      }
      res.status(204).end();
    });
  });
});

module.exports = router;
