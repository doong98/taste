import { Capacitor } from '@capacitor/core';

// Vercel에 배포된 공통 HTTPS 서버 API 주소
export const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_REMOTE_API_BASE_URL?.trim() || 'https://taste-jet.vercel.app';

/**
 * 실행 환경(웹 vs 네이티브 앱)에 따라 올바른 API 호출 전체 URL을 반환합니다.
 * - 일반 웹(브라우저): 상대 경로 '' (예: /api/restaurants)
 * - Capacitor 네이티브 앱(iOS/Android): Vercel HTTPS 원격 서버 절대 주소 (예: https://taste-jet.vercel.app/api/restaurants)
 */
export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (Capacitor.isNativePlatform()) {
    return `${REMOTE_API_BASE}${cleanPath}`;
  }

  // 웹 브라우저 환경에서는 현재 호스트의 API Routes 호출
  return cleanPath;
}
