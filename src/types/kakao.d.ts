declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new () => KakaoLatLngBounds;
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
        Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
        CustomOverlay: new (options: KakaoOverlayOptions) => KakaoCustomOverlay;
        Circle: new (options: KakaoCircleOptions) => KakaoCircle;
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void;
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  panTo: (latlng: KakaoLatLng) => void;
  setLevel: (level: number, options?: { animate?: boolean }) => void;
  getLevel: () => number;
  setBounds: (bounds: KakaoLatLngBounds) => void;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLng;
  map?: KakaoMap;
  title?: string;
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
}

export interface KakaoOverlayOptions {
  position: KakaoLatLng;
  content: HTMLElement | string;
  map?: KakaoMap;
  yAnchor?: number;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

export interface KakaoCircleOptions {
  center: KakaoLatLng;
  radius: number;
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
  fillColor?: string;
  fillOpacity?: number;
  map?: KakaoMap;
}

export interface KakaoCircle {
  setMap: (map: KakaoMap | null) => void;
}

export {};
