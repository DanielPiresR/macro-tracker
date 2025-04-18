const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const normalize = require("../utils/normalize");

const workbook = xlsx.readFile("./Taco.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const raw = xlsx.utils.sheet_to_json(sheet);

const cleanData = raw.map((item) => {
  const name = normalize(item["Descrição do Alimento"] || "");
  return {
    name,
    originalName: item["Descrição do Alimento"],
    energy: item["Energia(kcal)"] || 0,
    protein: item["Proteína(g)"] || 0,
    fat: item["Lipídeos(g)"] || 0,
    carbs: item["Carboidrato(g)"] || 0,
  };
});

fs.writeFileSync("./taco/taco.json", JSON.stringify(cleanData, null, 2));
console.log("TACO JSON gerado com sucesso!");
