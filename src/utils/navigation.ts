import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export type MapAppType = 'kakao' | 'naver';

/**
 * 선택한 외부 지도 앱(카카오맵, 네이버 지도)으로 해당 음식점의 길찾기를 실행합니다.
 */
export async function openRouteInMap(
  type: MapAppType,
  name: string,
  lat: number,
  lng: number
): Promise<void> {
  const encodedName = encodeURIComponent(name);
  let targetUrl = '';

  if (type === 'kakao') {
    // 카카오맵 목적지 길찾기 URL (웹 및 앱 연동)
    targetUrl = `https://map.kakao.com/link/to/${encodedName},${lat},${lng}`;
  } else if (type === 'naver') {
    // 네이버 지도 목적지 길찾기 URL
    targetUrl = `https://map.naver.com/v5/directions/-/-/${lng},${lat},${encodedName}/-/transit`;
  }

  if (!targetUrl) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url: targetUrl });
      return;
    } catch (e) {
      console.warn('[Browser.open failed, fallback to window.open]', e);
    }
  }

  // 웹 브라우저 환경
  if (typeof window !== 'undefined') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}
