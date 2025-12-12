/**
 * Blood glucose unit conversion utilities
 *
 * Standard conversion factor: 1 mmol/L = 18.0182 mg/dL
 */

const CONVERSION_FACTOR = 18.0182;

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
 * @param useMmol - Whether to display in mmol/L (true) or mg/dL (false)
 * @returns Formatted string with units, or null if value is undefined/null
 */
export function formatBgValue(
  value: number | undefined | null,
  useMmol: boolean,
): string | null {
  if (value === undefined || value === null) return null;

  if (useMmol) {
    return `${mgdlToMmol(value)} mmol/L`;
  }
  return `${value} mg/dL`;
}

/**
 * Format an insulin sensitivity value with units
 * Insulin sensitivity is expressed as mg/dL or mmol/L per unit of insulin
 * @param value - Insulin sensitivity value in mg/dL per unit
 * @param useMmol - Whether to display in mmol/L (true) or mg/dL (false)
 * @returns Formatted string with units
 */
export function formatInsulinSensitivity(
  value: number,
  useMmol: boolean,
): string {
  if (useMmol) {
    return `${mgdlToMmol(value)} mmol/L`;
  }
  return `${value} mg/dL`;
}

/**
 * Get the unit label for blood glucose
 * @param useMmol - Whether to use mmol/L (true) or mg/dL (false)
 * @returns Unit label string
 */
export function getBgUnitLabel(useMmol: boolean): string {
  return useMmol ? 'mmol/L' : 'mg/dL';
}
