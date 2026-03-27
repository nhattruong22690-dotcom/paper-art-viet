/**
 * Formats a number or string into a Vietnamese-style numeric string.
 * Example: 1000000.5 -> "1.000.000,5"
 */
export const formatNumber = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  
  // Convert to string and handle potential existing formatting
  let str = val.toString().replace(/[^0-9.]/g, '');
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = str.split('.');
  
  // Format integer part with dots
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Return combined parts with comma for decimal if it exists
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
};

/**
 * Parses a Vietnamese-style formatted string back to a number.
 * Example: "1.000.000,5" -> 1000000.5
 */
export const parseNumber = (val: string | null | undefined): number => {
  if (!val) return 0;
  
  // Replace dots with empty string and comma with dot
  const clean = val.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  
  return isNaN(num) ? 0 : num;
};

/**
 * Formats a number specifically for currency display (VND).
 */
export const formatVND = (val: number | string | null | undefined): string => {
  const formatted = formatNumber(val);
  return formatted ? `${formatted}đ` : '0đ';
};
