/**
 * Humanize technical data into emotional/inspirational language.
 * Standard: "Tinh tế - Truyền cảm - Không sến"
 */

export const humanizeDistance = (lat1?: number, lng1?: number, lat2?: number, lng2?: number): string => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return "Chưa rõ khoảng cách";

  // Simple haversine (approx)
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km

  if (d > 300) return `${Math.round(d / 40)} giờ di chuyển (Liên tỉnh)`;
  
  // Convert to time (avg 30km/h for discovery)
  const mins = Math.round(d * 2); // ~30km/h = 2 mins per km
  
  if (mins < 5) return "Ngay gần bạn";
  if (mins > 60) return `${Math.round(mins/60)} giờ di chuyển`;
  return `${mins} phút di chuyển`;
};

export const humanizeMatch = (score?: number): { text: string; level: 'high' | 'medium' | 'none' } => {
  if (!score) return { text: '', level: 'none' };
  
  if (score >= 85) return { text: 'Rất phù hợp', level: 'high' };
  if (score >= 60) return { text: 'Có thể bạn sẽ thích', level: 'medium' };
  
  return { text: '', level: 'none' };
};
