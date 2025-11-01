/**
 * Format calories with commas and unit
 */
export const formatKcal = (kcal: number): string => {
  return `${Math.round(kcal).toLocaleString('es-MX')} kcal`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return Math.round(num).toLocaleString('es-MX');
};

/**
 * Format decimal number
 */
export const formatDecimal = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals);
};
