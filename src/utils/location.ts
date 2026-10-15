import { Capacitor } from '@capacitor/core';
import { Geolocation, PositionOptions } from '@capacitor/geolocation';
import { Coordinates } from '@/types/restaurant';

export interface LocationResult {
  success: boolean;
  coords?: Coordinates;
  errorReason?: string;
  isPermissionDenied?: boolean;
}

/**
 * 웹 브라우저와 모바일 네이티브(Capacitor) 환경을 자동 감지하여
 * 현재 기기의 GPS 좌표를 안전하게 가져옵니다.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };

  // 1. 모바일 네이티브 환경 (iOS / Android Capacitor 앱)
  if (Capacitor.isNativePlatform()) {
    try {
      let permission = await Geolocation.checkPermissions();

      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions({ permissions: ['location'] });
      }

      if (permission.location !== 'granted') {
        return {
          success: false,
          isPermissionDenied: true,
          errorReason: '앱의 위치 접근 권한이 허용되지 않았습니다. 설정에서 위치 권한을 켜주시거나 원하는 동네를 직접 선택해 주세요.',
        };
      }

      const position = await Geolocation.getCurrentPosition(options);
      return {
        success: true,
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      };
    } catch (err: any) {
      console.warn('[Native Geolocation Error]', err);
      const isDenied = err?.message?.toLowerCase().includes('denied') || err?.code === 1;
      return {
        success: false,
        isPermissionDenied: isDenied,
        errorReason: isDenied
          ? '위치 권한이 거부되었습니다. 기기 설정에서 위치 권한을 허용해 주세요.'
          : '현재 위치 정보를 수신할 수 없습니다. GPS 신호를 확인해 주세요.',
      };
    }
  }

  // 2. 웹 브라우저 환경
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({
        success: false,
        errorReason: '사용하시는 브라우저에서 위치 정보를 지원하지 않습니다.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        let reason = '위치 정보를 가져올 수 없습니다.';
        let isDenied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            reason = '브라우저 위치 접근 권한이 거부되었습니다. (주소창 자물쇠 아이콘에서 허용 가능)';
            isDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            reason = '네트워크 또는 GPS 신호를 수신할 수 없어 위치를 파악하지 못했습니다.';
            break;
          case error.TIMEOUT:
            reason = '위치 요청 시간이 초과되었습니다 (10초). 다시 시도해 주세요.';
            break;
          default:
            reason = `위치 오류 발생: ${error.message}`;
            break;
        }

        resolve({
          success: false,
          isPermissionDenied: isDenied,
          errorReason: reason,
        });
      },
      options
    );
  });
}
