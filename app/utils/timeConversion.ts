/**
 * Time conversion utilities
 *
 * Useful for converting milliseconds from midnight to human-readable time formats,
 * commonly used in pump settings schedules.
 */

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;

/**
 * Convert milliseconds from midnight to time string (HH:MM)
 * @param ms - Milliseconds from midnight
 * @returns Time string in HH:MM format (24-hour)
 */
export function msToTime(ms: number): string {
  const hours = Math.floor(ms / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert milliseconds to hours (decimal)
 * @param ms - Milliseconds
 * @returns Hours as a decimal number
 */
export function msToHours(ms: number): number {
  return ms / MS_PER_HOUR;
}

/**
 * Convert milliseconds to minutes
 * @param ms - Milliseconds
 * @returns Minutes as a number
 */
export function msToMinutes(ms: number): number {
  return ms / MS_PER_MINUTE;
}

/**
 * Convert time string (HH:MM) to milliseconds from midnight
 * @param time - Time string in HH:MM format
 * @returns Milliseconds from midnight
 */
export function timeToMs(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE;
}

/**
 * Convert hours to milliseconds
 * @param hours - Hours as a number
 * @returns Milliseconds
 */
export function hoursToMs(hours: number): number {
  return hours * MS_PER_HOUR;
}

/**
 * Convert minutes to milliseconds
 * @param minutes - Minutes as a number
 * @returns Milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * MS_PER_MINUTE;
}

/**
 * Format milliseconds as a duration string (e.g., "2h 30m")
 * @param ms - Milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
