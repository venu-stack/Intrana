/**
 * Picks specified properties from an object and creates a new object with those properties
 * @param {Object} obj - The source object to pick properties from
 * @param {Array} keys - Array of property keys to pick from the source object
 * @param {*} defaultValue - Optional default value to use when a key doesn't exist
 * @returns {Object} A new object containing only the picked properties
 * @throws {Error} If a key is not found and no default value is provided
 */
const pick = (obj, keys, defaultValue) => {
  // Initialize empty object to store picked properties
  const picked = {};

  // Iterate through each requested key
  keys.forEach((key) => {
    // Check if the key exists in source object
    if (obj.hasOwnProperty(key)) {
      // Copy existing property value
      picked[key] = obj[key];
    }
    // If key doesn't exist but default value is provided
    else if (defaultValue !== undefined) {
      // Use the default value
      picked[key] = defaultValue;
    }
    // If key doesn't exist and no default value
    else {
      // Throw error for missing property
      throw new Error(`Property '${key}' not found`);
    }
  });

  return picked;
};

module.exports = pick;