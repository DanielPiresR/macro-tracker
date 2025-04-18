// scripts/loadTacoData.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const tacoData = require("../taco/taco.json");

const db = new sqlite3.Database(path.resolve(__dirname, "../db/meals.db"));

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO taco_items
      (id, name, energy, protein, carbs, fat)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  tacoData.forEach((item, idx) => {
    // usa idx+1 como ID (ou gere com AUTOINCREMENT: neste caso, remova “id” do INSERT)
    stmt.run(
      idx + 1,
      item.name,
      item.energy,
      item.protein,
      item.carbs,
      item.fat
    );
  });

  stmt.finalize((err) => {
    if (err) console.error("Erro ao inserir taco_items:", err);
    else console.log("Dados TACO carregados em taco_items!");
    db.close();
  });
});
