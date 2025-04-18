const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/meals.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id INTEGER,
        name TEXT,
        weight REAL,
        calories REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        FOREIGN KEY (meal_id) REFERENCES meals(id)
    )`);
});

module.exports = db;
