/**
 * A stretch of time, short enough to read at a glance in "Class stats":
 * "45 s", "4 min 10 s", "1 h 5 min". The units read the same in English,
 * Spanish and French.
 */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const rest = seconds % 60;
    // Past ten minutes the seconds are noise.
    return rest && minutes < 10 ? `${minutes} min ${rest} s` : `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
