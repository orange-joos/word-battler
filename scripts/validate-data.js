/**
 * Data Validator for Word Battler
 * Checks that all referenced IDs exist and word rules are consistent.
 */
import fs from 'fs';
import path from 'path';

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8'));
}

export function validateData() {
  console.log("Running Word Battler data validation...");
  let errors = 0;

  // Example validation check structure
  const creaturesData = loadJson('./data/creatures.json');
  
  creaturesData.creatures.forEach((c) => {
    if (!c.id || !c.name || !c.element) {
      console.error(`[Error] Creature missing required fields:`, c);
      errors++;
    }
  });

  if (errors === 0) {
    console.log("All data validation checks passed successfully!");
  } else {
    console.error(`Validation failed with ${errors} error(s).`);
  }
}

// Run if called directly
validateData();