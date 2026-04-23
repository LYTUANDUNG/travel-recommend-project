export function formatPriceLevel(level?: number | null) {
  if (!level) {
    return 'Flexible pricing';
  }

  return '$'.repeat(level);
}

export function formatTimeRange(openingHour?: string | null, closingHour?: string | null) {
  if (!openingHour || !closingHour) {
    return 'Open hours unavailable';
  }

  return `${openingHour.slice(0, 5)} - ${closingHour.slice(0, 5)}`;
}

export function calculateDistanceKm(
  origin?: { lat?: number | null; lng?: number | null },
  destination?: { lat?: number | null; lng?: number | null },
) {
  if (
    origin?.lat == null ||
    origin?.lng == null ||
    destination?.lat == null ||
    destination?.lng == null
  ) {
    return null;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRad(destination.lat - origin.lat);
  const lngDelta = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(1));
}

export function estimateTravelMinutes(distanceKm?: number | null) {
  if (distanceKm == null) {
    return null;
  }

  return Math.round((distanceKm / 35) * 60);
}
