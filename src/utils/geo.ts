import { Coordinates } from '@/types/restaurant';

/**
 * 두 좌표 간의 거리를 Haversine 공식을 이용하여 미터(m) 단위로 계산합니다.
 */
export function calculateDistanceInMeters(
  coord1: Coordinates | null | undefined,
  coord2: Coordinates | null | undefined
): number | undefined {
  if (!coord1 || !coord2) return undefined;
  if (typeof coord1.lat !== 'number' || typeof coord1.lng !== 'number') return undefined;
  if (typeof coord2.lat !== 'number' || typeof coord2.lng !== 'number') return undefined;

  const R = 6371e3; // 지구 반경 (미터)
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * 미터 단위 거리를 'OOOm' 또는 'O.Okm' 포맷으로 변환합니다.
 */
export function formatDistance(meters?: number): string {
  if (meters === undefined || isNaN(meters)) return '-';
  if (meters < 1000) {
    return `${meters}m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km}km`;
}
