const normalize = require("./normalize");

class FoodNode {
  constructor(name, weight, tacoData) {
    this.name = name;
    this.weight = weight;

    const query = normalize(name);
    const match = tacoData.find((item) => normalize(item.name).includes(query));

    if (match) {
      const ratio = weight / 100;
      this.calories = match.energy * ratio;
      this.protein = match.protein * ratio;
      this.carbs = match.carbs * ratio;
      this.fat = match.fat * ratio;
    } else {
      this.calories = this.protein = this.carbs = this.fat = 0;
    }

    this.prev = null;
    this.next = null;
  }
}

class MealDLL {
  constructor(name, tacoData) {
    this.name = name;
    this.head = null;
    this.tail = null;
    this.tacoData = tacoData;
  }

  addFood(name, weight) {
    const node = new FoodNode(name, weight, this.tacoData);
    if (!this.head) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
  }

  toArray() {
    let current = this.head;
    const result = [];
    while (current) {
      result.push({
        name: current.name,
        weight: current.weight,
        calories: current.calories,
        protein: current.protein,
        carbs: current.carbs,
        fat: current.fat,
      });
      current = current.next;
    }
    return result;
  }

  getTotals() {
    let current = this.head;
    const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    while (current) {
      total.calories += current.calories;
      total.protein += current.protein;
      total.carbs += current.carbs;
      total.fat += current.fat;
      current = current.next;
    }
    return total;
  }
}

module.exports = { MealDLL };
