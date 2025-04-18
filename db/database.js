// db/database.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/meals.db");

db.serialize(() => {
  // 1) tabela de itens TACO
  db.run(`
    CREATE TABLE IF NOT EXISTS taco_items (
      id       INTEGER PRIMARY KEY,
      name     TEXT UNIQUE,
      energy   REAL,
      protein  REAL,
      carbs    REAL,
      fat      REAL
    )
  `);

  // 2) refeições (agora com campo date)
  db.run(`
    CREATE TABLE IF NOT EXISTS meals (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      date       DATE NOT NULL DEFAULT (DATE('now','localtime')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3) alimentos em cada refeição
  db.run(`
    CREATE TABLE IF NOT EXISTS meal_foods (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id       INTEGER NOT NULL REFERENCES meals(id),
      taco_item_id  INTEGER NOT NULL REFERENCES taco_items(id),
      weight        REAL NOT NULL,
      calories      REAL NOT NULL,
      protein       REAL NOT NULL,
      carbs         REAL NOT NULL,
      fat           REAL NOT NULL
    )
  `);
});

module.exports = db;
