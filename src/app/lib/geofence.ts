/**
 * Calculates the distance between two GPS coordinate points in meters using the Haversine Formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

/**
 * Checks if the check-in time is past the official start time.
 * @param checkInTimeStr - The date/time of check-in
 * @param officialStartTimeStr - The target start time (formatted as "HH:MM:SS" or "HH:MM")
 */
export function checkIfLate(checkInTimeStr: string | Date, officialStartTimeStr: string): boolean {
  const checkIn = new Date(checkInTimeStr);
  const [targetHour, targetMinute, targetSecond] = officialStartTimeStr.split(':').map(Number);
  
  const officialTimeToday = new Date(checkIn);
  officialTimeToday.setHours(targetHour, targetMinute, targetSecond || 0, 0);

  return checkIn.getTime() > officialTimeToday.getTime();
}