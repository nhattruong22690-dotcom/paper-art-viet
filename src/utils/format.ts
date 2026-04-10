/**
 * Formats a number or string into a Vietnamese-style numeric string.
 * Example: 1000000.5 -> "1.000.000,5"
 */
export const formatNumber = (
  val: number | string | null | undefined, 
  options: { decimals?: number; currency?: string } = {}
): string => {
  if (val === null || val === undefined || val === '') return '';
  
  let num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
  if (isNaN(num)) return '';

  const isUSD = options.currency === 'USD';
  const decimals = options.decimals !== undefined 
    ? options.decimals 
    : (isUSD ? 2 : 0);

  // Round to specified decimals
  const fixed = num.toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Format integer part with dots
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Return combined parts with comma for decimal if it exists and decimals > 0
  return decimalPart && decimals > 0 ? `${formattedInteger},${decimalPart}` : formattedInteger;
};

/**
 * Parses a Vietnamese-style formatted string back to a number.
 * Example: "1.000.000,5" -> 1000000.5
 */
export const parseNumber = (val: string | null | undefined): number => {
  if (!val) return 0;
  
  // If there's only one dot and no commas, it's likely a decimal separator (international style)
  const hasComma = val.includes(',');
  const dotCount = (val.match(/\./g) || []).length;
  
  let clean = val;
  if (!hasComma && dotCount === 1) {
    // Treat the single dot as a decimal point
    clean = val;
  } else {
    // Traditional Vietnamese: dots are thousands, comma is decimal
    clean = val.replace(/\./g, '').replace(/,/g, '.');
  }
  
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

/**
 * Formats a number specifically for currency display (VND).
 * Rounds to 0 decimal places as requested.
 */
export const formatVND = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '0đ';
  const formatted = formatNumber(val, { currency: 'VND', decimals: 0 });
  return `${formatted}đ`;
};

/**
 * Formats a number specifically for currency display (USD).
 * Uses 2 decimal places as requested.
 */
export const formatUSD = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '$0';
  const formatted = formatNumber(val, { currency: 'USD', decimals: 2 });
  return `$${formatted}`;
};
