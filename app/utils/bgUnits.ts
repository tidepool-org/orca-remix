/**
 * Blood glucose unit conversion utilities
 *
 * Standard conversion factor: 1 mmol/L = 18.01559 mg/dL
 */

const CONVERSION_FACTOR = 18.01559;

/**
 * Convert mg/dL to mmol/L
 * @param mgdl - Blood glucose value in mg/dL
 * @returns Blood glucose value in mmol/L (rounded to 1 decimal place)
 */
export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / CONVERSION_FACTOR) * 10) / 10;
}

/**
 * Convert mmol/L to mg/dL
 * @param mmol - Blood glucose value in mmol/L
 * @returns Blood glucose value in mg/dL (rounded to nearest integer)
 */
export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * CONVERSION_FACTOR);
}

/**
 * Format a blood glucose value with units
 * @param value - Blood glucose value in mg/dL
 * @param useMgdl - Whether to display in mmol/L (false) or mg/dL (true)
 * @returns Formatted string with units, or null if value is undefined/null
 */
export function formatBgValue(
  value: number | undefined | null,
  useMgdl: boolean,
): string | null {
  if (value === undefined || value === null) return null;

  if (useMgdl) {
    return `${mmolToMgdl(value)} mg/dL`;
  }
  return `${value} mmol/L`;
}

/**
 * Format an insulin sensitivity value with units
 * Insulin sensitivity is expressed as mg/dL or mmol/L per unit of insulin
 * @param value - Insulin sensitivity value in mg/dL per unit
 * @param useMgdl - Whether to display in mmol/L (false) or mg/dL (true)
 * @returns Formatted string with units
 */
export function formatInsulinSensitivity(
  value: number,
  useMgdl: boolean,
): string {
  if (useMgdl) {
    return `${mmolToMgdl(value)} mg/dL`;
  }
  return `${value} mmol/L`;
}

/**
 * Get the unit label for blood glucose
 * @param useMgdl - Whether to use mmol/L (false) or mg/dL (true)
 * @returns Unit label string
 */
export function getBgUnitLabel(useMgdl: boolean): string {
  return useMgdl ? 'mg/dL' : 'mmol/L';
}
