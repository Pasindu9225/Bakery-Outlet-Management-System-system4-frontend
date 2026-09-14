/**
 * Formats a numeric value for display according to the following rules:
 * 1. Maximum of 5 decimal places (rounded).
 * 2. No trailing zeros.
 * 3. No decimal part for whole numbers.
 * 
 * Examples:
 * 10.0000 -> 10
 * 5.5000 -> 5.5
 * 2.12 -> 2.12
 * 0.1234567 -> 0.12346
 * 
 * @param {number|string} value - The value to format
 * @returns {string} The formatted value
 */
export const formatQuantity = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // Use Number.toFixed(5) for rounding and precision, 
  // then convert back to Number to strip trailing zeros, 
  // then to String for display.
  return Number(num.toFixed(5)).toString();
};
