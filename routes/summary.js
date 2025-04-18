// routes/summary.js
const express = require("express");
const router = express.Router();
const db = require("../db/database");

/**
 * GET /summary?date=YYYY-MM-DD
 * Retorna o total de macros para um dia.
 */
router.get("/summary", (req, res, next) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  db.get(
    `SELECT
       m.date,
       ROUND(SUM(mf.calories),2) AS calories,
       ROUND(SUM(mf.protein),2)  AS protein,
       ROUND(SUM(mf.carbs),2)    AS carbs,
       ROUND(SUM(mf.fat),2)      AS fat
     FROM meals m
     JOIN meal_foods mf ON mf.meal_id = m.id
     WHERE m.date = ?`,
    [date],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      // Se não houver dados, retornar zeros
      const totals =
        row && row.calories !== null
          ? {
              calories: row.calories,
              protein: row.protein,
              carbs: row.carbs,
              fat: row.fat,
            }
          : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      res.json({ date, totals });
    }
  );
});

/**
 * GET /history?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Retorna resumo diário de vários dias.
 */
router.get("/history", (req, res, next) => {
  const start = req.query.start;
  const end = req.query.end;
  if (!start || !end) {
    return res
      .status(400)
      .json({ error: "Parâmetros start e end são obrigatórios" });
  }

  db.all(
    `SELECT
       m.date,
       ROUND(SUM(mf.calories),2) AS calories,
       ROUND(SUM(mf.protein),2)  AS protein,
       ROUND(SUM(mf.carbs),2)    AS carbs,
       ROUND(SUM(mf.fat),2)      AS fat
     FROM meals m
     JOIN meal_foods mf ON mf.meal_id = m.id
     WHERE m.date BETWEEN ? AND ?
     GROUP BY m.date
     ORDER BY m.date`,
    [start, end],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      // Garante que cada dia no intervalo apareça (mesmo sem refeições)?
      // Para simplificar, retornamos apenas os dias com dados.
      res.json(
        rows.map((r) => ({
          date: r.date,
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
        }))
      );
    }
  );
});

module.exports = router;
