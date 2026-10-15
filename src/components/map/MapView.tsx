'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, Coordinates, Region, DistanceFilterType } from '@/types/restaurant';
import { formatDistance } from '@/utils/geo';
import {
  MapPin,
  Navigation,
  Info,
  ChevronRight,
  X,
  AlertTriangle,
  Globe,
  RefreshCw,
  Compass,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react';

interface MapViewProps {
  restaurants: Restaurant[];
  center: Coordinates;
  currentRegion: Region;
  distanceFilter: DistanceFilterType;
  selectedRestaurant: Restaurant | null;
  isUsingGps?: boolean;
  userCoordinates?: Coordinates | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenDetailModal: (restaurant: Restaurant) => void;
}

export default function MapView({
  restaurants,
  center,
  currentRegion,
  distanceFilter,
  selectedRestaurant,
  isUsingGps,
  userCoordinates,
  onSelectRestaurant,
  onOpenDetailModal,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);

  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [useFallbackRadar, setUseFallbackRadar] = useState(false);
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(selectedRestaurant);
  const [currentOrigin, setCurrentOrigin] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const handleCopyOrigin = () => {
    if (currentOrigin && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentOrigin);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const kakaoApiKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim() || 'f0b96440318fcb915daa3423308056a6';

  // 1. 카카오 지도 SDK 비동기 로드
  useEffect(() => {
    if (!kakaoApiKey) {
      setMapStatus('error');
      setErrorMessage('카카오 지도 JavaScript API 키가 .env.local에 설정되지 않았습니다.');
      return;
    }

    setMapStatus('loading');
    setErrorMessage('');

    const handleLoaded = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setMapStatus('ready');
        });
      }
    };

    if (window.kakao && window.kakao.maps) {
      handleLoaded();
      return;
    }

    const scriptId = 'kakao-maps-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&autoload=false`;
      script.async = true;

      script.onload = () => {
        handleLoaded();
      };

      script.onerror = () => {
        setMapStatus('error');
        setErrorMessage(
          '카카오 지도 서비스(OPEN_MAP_AND_LOCAL)가 카카오 개발자 콘솔에서 활성화되지 않았거나 사이트 도메인이 일치하지 않습니다.'
        );
      };

      document.head.appendChild(script);
    } else {
      const checkLoaded = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkLoaded);
          handleLoaded();
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }
  }, [kakaoApiKey]);

  // 2. 카카오 지도 캔버스 초기화
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapContainerRef.current || !window.kakao?.maps) return;

    try {
      const kakaoMaps = window.kakao.maps;
      const initialCenter = new kakaoMaps.LatLng(center.lat, center.lng);
      const zoomLevel = distanceFilter === 500 ? 3 : distanceFilter === 1000 ? 4 : 5;

      const mapOptions = {
        center: initialCenter,
        level: zoomLevel,
      };

      const map = new kakaoMaps.Map(mapContainerRef.current, mapOptions);
      mapInstanceRef.current = map;

      // 브라우저 렌더링 지연에 따른 타일 미표시 방지 (relayout 및 중심 재설정)
      const timer1 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
          mapInstanceRef.current.setCenter(initialCenter);
        }
      }, 100);
      const timer2 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
          mapInstanceRef.current.setCenter(initialCenter);
        }
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } catch (e: any) {
      console.error('카카오 지도 생성 에러:', e);
      setMapStatus('error');
      setErrorMessage(`카카오 지도 생성 중 오류 발생: ${e?.message || '알 수 없는 오류'}`);
    }
  }, [mapStatus]);

  // 3. 중심 이동, 반경 서클 및 내 위치 마커 표시
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.kakao?.maps) return;
    const kakaoMaps = window.kakao.maps;
    const map = mapInstanceRef.current;

    const newCenter = new kakaoMaps.LatLng(center.lat, center.lng);
    map.panTo(newCenter);

    // 기존 반경 원 제거
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    const radiusMeters = distanceFilter === 'ALL' ? 3000 : distanceFilter;
    const circle = new kakaoMaps.Circle({
      center: newCenter,
      radius: radiusMeters,
      strokeWeight: 2,
      strokeColor: isUsingGps ? '#2563eb' : '#4f46e5',
      strokeOpacity: 0.7,
      strokeStyle: 'dashed',
      fillColor: isUsingGps ? '#3b82f6' : '#818cf8',
      fillOpacity: 0.08,
      map: map,
    });
    circlesRef.current.push(circle);

    // 내 위치 커스텀 오버레이 표시
    if (userOverlayRef.current) {
      userOverlayRef.current.setMap(null);
      userOverlayRef.current = null;
    }

    if (isUsingGps && userCoordinates) {
      const userPos = new kakaoMaps.LatLng(userCoordinates.lat, userCoordinates.lng);
      const content = document.createElement('div');
      content.className = 'flex flex-col items-center';
      content.innerHTML = `
        <div style="position:relative; display:flex; align-items:center; justify-content:center;">
          <div style="width:28px; height:28px; border-radius:50%; background:rgba(37,99,235,0.25); position:absolute; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:16px; height:16px; border-radius:50%; background:#2563eb; border:2.5px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
        <span style="font-size:10px; font-weight:bold; color:#1e40af; background:white; padding:1px 5px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.2); margin-top:3px; white-space:nowrap; border:1px solid #bfdbfe;">내 위치</span>
      `;

      const userOverlay = new kakaoMaps.CustomOverlay({
        position: userPos,
        content: content,
        yAnchor: 1.2,
        map: map,
      });
      userOverlayRef.current = userOverlay;
    }

    const zoomLevel = distanceFilter === 500 ? 3 : distanceFilter === 1000 ? 4 : 5;
    map.setLevel(zoomLevel, { animate: true });
  }, [center, distanceFilter, isUsingGps, userCoordinates, mapStatus]);

  // 4. 음식점 마커 생성 및 갱신 (좌표가 유효한 매장만)
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.kakao?.maps) return;
    const kakaoMaps = window.kakao.maps;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const validItems = restaurants.filter(
      (r) => r.coordinates && r.hasCoordinates !== false && typeof r.coordinates.lat === 'number'
    );

    validItems.forEach((restaurant) => {
      if (!restaurant.coordinates) return;
      const position = new kakaoMaps.LatLng(
        restaurant.coordinates.lat,
        restaurant.coordinates.lng
      );

      const marker = new kakaoMaps.Marker({
        position: position,
        title: restaurant.name,
        map: map,
      });

      kakaoMaps.event.addListener(marker, 'click', () => {
        setActiveRestaurant(restaurant);
        onSelectRestaurant(restaurant);
        map.panTo(position);
      });

      markersRef.current.push(marker);
    });
  }, [restaurants, mapStatus, onSelectRestaurant]);

  // 5. 외부 선택 매장으로 지도 이동
  useEffect(() => {
    if (selectedRestaurant && selectedRestaurant.coordinates && selectedRestaurant.hasCoordinates !== false) {
      setActiveRestaurant(selectedRestaurant);
      if (mapInstanceRef.current && window.kakao?.maps) {
        const targetPos = new window.kakao.maps.LatLng(
          selectedRestaurant.coordinates.lat,
          selectedRestaurant.coordinates.lng
        );
        mapInstanceRef.current.panTo(targetPos);
        if (mapInstanceRef.current.getLevel() > 4) {
          mapInstanceRef.current.setLevel(3, { animate: true });
        }
      }
    }
  }, [selectedRestaurant]);

  const maxSpanMeters = distanceFilter === 500 ? 700 : distanceFilter === 1000 ? 1400 : 3500;

  // 유효한 좌표를 가진 매장만 선별
  const validRestaurants = restaurants.filter(
    (r) => r.coordinates && r.hasCoordinates !== false && typeof r.coordinates.lat === 'number'
  );
  const unlocatedCount = restaurants.length - validRestaurants.length;

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] bg-slate-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner flex flex-col justify-between">
      {/* 1. 상단 오버레이 헤더 */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-semibold text-gray-800 flex items-center gap-1.5">
          <Navigation
            className={`w-3.5 h-3.5 ${
              isUsingGps ? 'text-blue-600 fill-blue-600' : 'text-indigo-600 fill-indigo-600'
            }`}
          />
          <span>
            {isUsingGps ? '내 현재 위치 (GPS)' : `중심: ${currentRegion.name}`}
          </span>
          <span className="text-gray-400 font-normal">
            (지도 {validRestaurants.length}곳)
          </span>
          {unlocatedCount > 0 && (
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              좌표 미제공 {unlocatedCount}곳 제외
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-300" />
            <span>반경 {distanceFilter === 'ALL' ? '3km' : `${distanceFilter}m`}</span>
          </div>

          {mapStatus === 'error' && (
            <button
              onClick={() => setUseFallbackRadar((prev) => !prev)}
              className="pointer-events-auto bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Compass className="w-3 h-3" />
              <span>{useFallbackRadar ? '키 활성화 가이드' : '지도 핀 탐색 보기'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 지도 메인 영역 */}
      <div className="w-full h-full relative z-0">
        {/* 정식 카카오 지도 캔버스 (DOM에 상시 마운트되어 즉시 렌더링) */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 로딩 중 안내 오버레이 */}
        {mapStatus === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-2xs">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <p className="text-xs font-semibold text-gray-600">카카오 지도를 불러오는 중입니다...</p>
          </div>
        )}

        {/* API 오류 시에만 노출되는 대체 오버레이 */}
        {mapStatus === 'error' && (
          <div className="absolute inset-0 z-20">
            {!useFallbackRadar ? (
              /* 카카오 지도 활성화 안내 화면 */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-gray-50 to-indigo-50/40 z-10 overflow-y-auto">
                <div className="w-13 h-13 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-3 shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                  카카오 [지도/로컬] 서비스 활성화 안내
                </h3>
                <p className="text-xs text-gray-600 max-w-md mt-1 leading-relaxed">
                  {kakaoApiKey ? (
                    <>
                      카카오 API 키(<code>{kakaoApiKey.slice(0, 8)}...</code>)가 설정되었으나, 카카오 개발자 콘솔에서 <strong>지도/로컬 활성화</strong> 및 <strong>도메인 등록</strong>이 필요합니다.
                    </>
                  ) : (
                    <>
                      카카오 API 키가 설정되지 않았습니다. Vercel 환경 변수에 <code>NEXT_PUBLIC_KAKAO_MAP_KEY</code>를 등록해 주세요.
                    </>
                  )}
                </p>

                <div className="mt-4 w-full max-w-md bg-white rounded-xl p-4 border border-gray-200 text-left shadow-xs space-y-3 text-xs">
                  {/* 1. 카카오맵 활성화 */}
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900">1. 카카오맵 활성화 (필수)</span>
                      <p className="text-gray-500 mt-0.5">
                        좌측 메뉴 &gt; <strong>[제품 설정] &gt; [카카오맵]</strong>으로 이동하여 우측 화면의 <strong>[활성화 설정]을 ON</strong>으로 켜주세요.
                      </p>
                    </div>
                  </div>

                  {/* 2. Web 사이트 도메인 등록 */}
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
                    <Globe className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">2. Web 플랫폼 사이트 도메인 등록</span>
                        {currentOrigin && (
                          <button
                            onClick={handleCopyOrigin}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">복사 완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>현재 주소 복사</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-gray-500 mt-0.5">
                        좌측 상단 &gt; <strong>[앱 설정] &gt; [앱 ∨] 클릭 &gt; [플랫폼] &gt; Web</strong>에 아래 사이트 도메인들을 모두 등록해 주세요:
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[11px]">
                        {currentOrigin && (
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-200">
                            {currentOrigin}
                          </span>
                        )}
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">http://localhost:3000</span>
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">http://localhost:3001</span>
                      </div>
                    </div>
                  </div>

                  {/* 콘솔 바로가기 링크 */}
                  <div className="pt-2 border-t border-gray-100">
                    <a
                      href="https://developers.kakao.com/console/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 transition-colors"
                    >
                      <span>카카오 개발자 콘솔 바로가기</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setUseFallbackRadar(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>실제 음식점 위치 핀 바로 확인하기</span>
                </button>
              </div>
            ) : (
              /* 인터랙티브 레이더 지도 */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-radial from-slate-50 via-slate-100 to-indigo-50/50">
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* 반경 동심원 가이드 */}
                <div
                  className={`absolute rounded-full border border-dashed pointer-events-none flex items-start justify-center ${
                    distanceFilter === 500 ? 'border-blue-500 bg-blue-50/20' : 'border-indigo-300/80'
                  }`}
                  style={{ width: '28%', height: '28%' }}
                >
                  <span className="text-[10px] text-indigo-500 font-medium -mt-3.5 bg-white/80 px-1 rounded shadow-2xs">500m</span>
                </div>
                <div
                  className={`absolute rounded-full border border-dashed pointer-events-none flex items-start justify-center ${
                    distanceFilter === 1000 ? 'border-blue-500 bg-blue-50/20' : 'border-indigo-300/60'
                  }`}
                  style={{ width: '56%', height: '56%' }}
                >
                  <span className="text-[10px] text-indigo-500 font-medium -mt-3.5 bg-white/80 px-1 rounded shadow-2xs">1km</span>
                </div>
                <div
                  className={`absolute rounded-full border pointer-events-none flex items-start justify-center ${
                    distanceFilter === 3000 || distanceFilter === 'ALL' ? 'border-blue-400/80' : 'border-indigo-200/50'
                  }`}
                  style={{ width: '88%', height: '88%' }}
                >
                  <span className="text-[10px] text-indigo-500 font-medium -mt-3.5 bg-white/80 px-1 rounded shadow-2xs">3km</span>
                </div>

                {/* 중심 마커 (내 위치 또는 선택 지역) */}
                <div className="absolute z-20 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-8 h-8 rounded-full animate-ping absolute ${
                        isUsingGps ? 'bg-blue-500/30' : 'bg-indigo-500/20'
                      }`}
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white ${
                        isUsingGps ? 'bg-blue-600' : 'bg-indigo-600'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs border ${
                      isUsingGps
                        ? 'text-blue-900 bg-blue-50 border-blue-200'
                        : 'text-indigo-900 bg-white/95 border-indigo-100'
                    }`}
                  >
                    {isUsingGps ? '내 현재 위치 (GPS)' : `${currentRegion.name} 기준`}
                  </span>
                </div>

                {/* 실제 음식점 핀 마커들 (좌표 유효한 매장만) */}
                {validRestaurants.map((restaurant) => {
                  if (!restaurant.coordinates) return null;
                  const deltaLatMeters = (restaurant.coordinates.lat - center.lat) * 111000;
                  const deltaLngMeters = (restaurant.coordinates.lng - center.lng) * 88000;

                  const leftPercent = Math.min(Math.max(50 + (deltaLngMeters / maxSpanMeters) * 42, 6), 94);
                  const topPercent = Math.min(Math.max(50 - (deltaLatMeters / maxSpanMeters) * 42, 8), 92);

                  const isSelected = activeRestaurant?.id === restaurant.id;

                  return (
                    <div
                      key={restaurant.id}
                      style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
                      onClick={() => {
                        setActiveRestaurant(restaurant);
                        onSelectRestaurant(restaurant);
                      }}
                    >
                      <div
                        className={`flex flex-col items-center transition-all ${
                          isSelected ? 'scale-115 z-40' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                              : 'bg-white text-gray-800 border border-gray-200 hover:border-indigo-400'
                          }`}
                        >
                          <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-rose-500'}`} />
                          <span className="max-w-[85px] truncate">{restaurant.name}</span>
                        </div>
                        <div
                          className={`w-1.5 h-1.5 rounded-full -mt-0.5 ${
                            isSelected ? 'bg-rose-600' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 선택 매장 요약 플로팅 카드 */}
      {activeRestaurant && (
        <div className="absolute bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white rounded-xl p-3.5 shadow-xl border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {activeRestaurant.category}
                </span>
                {activeRestaurant.distanceMeter !== undefined && (
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full">
                    직선거리 {formatDistance(activeRestaurant.distanceMeter)}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-gray-900 truncate">
                {activeRestaurant.name}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {activeRestaurant.roadAddress}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onOpenDetailModal(activeRestaurant)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
              >
                <span>상세보기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveRestaurant(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 하단 상태 바 */}
      <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between z-10">
        <span>
          {isUsingGps
            ? '📍 내 현재 GPS 위치 중심 탐색 활성화'
            : mapStatus === 'ready'
            ? '📍 카카오 지도 SDK 정상 연결됨'
            : '📍 카카오 지도 연동 (인터랙티브 핀 뷰 활성화)'}
        </span>
        <span className="text-gray-400 hidden sm:inline">
          {isUsingGps ? '브라우저 GPS 좌표 사용' : '선택 지역 기준'}
        </span>
      </div>
    </div>
  );
}
