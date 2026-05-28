/**
 * Humanize technical data into compact Vietnamese UI labels.
 */

export const humanizeDistance = (lat1?: number, lng1?: number, lat2?: number, lng2?: number): string => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return "Chưa rõ khoảng cách";

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  if (d > 100) return `${Math.round(d)} km từ vị trí của bạn`;

  const mins = Math.round(d * 2);

  if (mins < 5) return "Ngay gần bạn";
  if (mins > 60) return `${Math.round(mins / 60)} giờ di chuyển`;
  return `${mins} phút di chuyển`;
};

export const humanizeMatch = (score?: number): { text: string; level: 'high' | 'medium' | 'none' } => {
  if (!score) return { text: '', level: 'none' };

  const percent = score > 1 ? score : score * 100;

  if (percent >= 85) return { text: 'Rất phù hợp', level: 'high' };
  if (percent >= 50) return { text: 'Có thể bạn sẽ thích', level: 'medium' };

  return { text: '', level: 'none' };
};

export const formatOneDecimalFloor = (value?: number): string => {
  const numeric = Number(value || 0);
  return (Math.floor(numeric * 10) / 10).toFixed(1);
};
