const db = require("../db/database");
const { MealDLL } = require("../utils/dll");

// cache em memória
let tacoCache = null;

function loadTacoData() {
  return new Promise((resolve, reject) => {
    if (tacoCache) return resolve(tacoCache);
    db.all(
      "SELECT id, name, energy, protein, carbs, fat FROM taco_items",
      (err, rows) => {
        if (err) return reject(err);
        tacoCache = rows;
        resolve(tacoCache);
      }
    );
  });
}

/**
 * @param {string} mealName
 * @param {Array<{taco_item_id:number, weight:number}>} items
 */
async function buildMeal(mealName, items) {
  const tacoData = await loadTacoData();
  const meal = new MealDLL(mealName, tacoData);

  // adiciona cada item
  items.forEach(({ taco_item_id, weight }) => {
    const tacoItem = tacoData.find((t) => t.id === taco_item_id);
    if (!tacoItem) {
      throw new Error(`Item TACO ${taco_item_id} não encontrado`);
    }
    meal.addFood(tacoItem.name, weight);
  });

  // transforma em array e “cola” o taco_item_id de volta
  const array = meal.toArray();
  const foods = array.map((food, i) => ({
    taco_item_id: items[i].taco_item_id,
    name: food.name,
    weight: food.weight,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
  }));

  const totals = meal.getTotals();
  return { foods, totals };
}

module.exports = { buildMeal };
