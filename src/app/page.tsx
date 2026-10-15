'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '@/components/common/Header';
import DataStatusBanner from '@/components/common/DataStatusBanner';
import LocationModal from '@/components/common/LocationModal';
import SearchBar from '@/components/filter/SearchBar';
import CategoryFilter from '@/components/filter/CategoryFilter';
import DistanceFilter from '@/components/filter/DistanceFilter';
import RestaurantList from '@/components/restaurant/RestaurantList';
import RestaurantDetailModal from '@/components/restaurant/RestaurantDetailModal';
import MapView from '@/components/map/MapView';

import {
  CategoryType,
  DistanceFilterType,
  Restaurant,
  Region,
  Coordinates,
  ViewMode,
} from '@/types/restaurant';
import { REAL_RESTAURANTS } from '@/constants/realStoreData';
import { DEFAULT_REGION } from '@/constants/regions';
import { calculateDistanceInMeters } from '@/utils/geo';
import { buildApiUrl } from '@/utils/api';
import { getCurrentLocation } from '@/utils/location';
import { getFavoriteIds } from '@/utils/favorites';
import { App } from '@capacitor/app';
import { List, Map as MapIcon, Loader2, Navigation, AlertCircle, Heart, RotateCcw } from 'lucide-react';

export default function Home() {
  // 1. 위치 및 지역 상태
  // ※ 보안 원칙: 사용자 위치 좌표는 DB에 일절 저장하지 않고 브라우저 로컬 React 메모리에만 유지합니다.
  const [currentRegion, setCurrentRegion] = useState<Region>(DEFAULT_REGION);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [isUsingGps, setIsUsingGps] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [locationErrorReason, setLocationErrorReason] = useState<string>('');

  // 2. 실제 음식점 데이터 및 상태
  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [dataSource, setDataSource] = useState<string>('public_data');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // 3. 즐겨찾기 상태
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    getFavoriteIds().then(setFavoriteIds);

    const handleFavChange = (e: any) => {
      if (e?.detail?.favorites) {
        setFavoriteIds(e.detail.favorites);
      } else {
        getFavoriteIds().then(setFavoriteIds);
      }
    };
    window.addEventListener('taste_favorites_changed', handleFavChange);
    return () => window.removeEventListener('taste_favorites_changed', handleFavChange);
  }, []);

  // 4. 검색 및 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilterType>('ALL');

  // 즐겨찾기 필터 적용된 최종 음식점 목록
  const filteredRestaurants = useMemo(() => {
    if (!showFavoritesOnly) return rawRestaurants;
    return rawRestaurants.filter((r) => favoriteIds.includes(r.id));
  }, [rawRestaurants, showFavoritesOnly, favoriteIds]);

  // 5. 뷰 모드 및 모달 상태
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // 현재 기준 좌표 (GPS 우선, 없으면 현재 선택된 동 중심)
  const currentCenter: Coordinates = useMemo(() => {
    if (isUsingGps && userCoordinates) {
      return userCoordinates;
    }
    return currentRegion.center;
  }, [isUsingGps, userCoordinates, currentRegion]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Android 하드웨어 뒤로가기 버튼 처리
  useEffect(() => {
    let backListener: any = null;
    try {
      backListener = App.addListener('backButton', () => {
        if (selectedRestaurant) {
          setSelectedRestaurant(null);
        } else if (isLocationModalOpen) {
          setIsLocationModalOpen(false);
        } else if (showFavoritesOnly) {
          setShowFavoritesOnly(false);
        } else if (searchKeyword) {
          setSearchKeyword('');
        } else {
          // 최상단 화면일 때 앱 종료
          App.exitApp();
        }
      });
    } catch {}

    return () => {
      if (backListener) {
        backListener.then((l: any) => l.remove()).catch(() => {});
      }
    };
  }, [selectedRestaurant, isLocationModalOpen, showFavoritesOnly, searchKeyword]);

  // DB 및 공간 검색 API 호출 (웹과 모바일 환경 자동 주소 매핑)
  const fetchRestaurants = useCallback(
    async (isSync = false) => {
      if (isSync) {
        setIsSyncing(true);
      } else {
        setIsLoadingData(true);
      }
      setApiError(null);
      try {
        const syncQuery = isSync ? '&sync=true' : '';
        const radiusQuery = distanceFilter !== 'ALL' ? `&radius=${distanceFilter}` : '';
        const categoryQuery = selectedCategory !== 'ALL' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
        const keywordQuery = searchKeyword.trim() ? `&keyword=${encodeURIComponent(searchKeyword.trim())}` : '';

        const endpoint = buildApiUrl(
          `/api/restaurants?lat=${currentCenter.lat}&lng=${currentCenter.lng}&limit=50${radiusQuery}${categoryQuery}${keywordQuery}${syncQuery}`
        );

        const res = await fetch(endpoint);
        const json = await res.json();

        if (res.ok && json.success) {
          setRawRestaurants(json.data || []);
          setTotalCount(json.count || json.data?.length || 0);
          setDataSource(json.dataSource || 'supabase');
        } else {
          const errMsg = json.message || '음식점 데이터를 불러오지 못했습니다.';
          setApiError(errMsg);
          if (json.fallbackData) {
            setRawRestaurants(json.fallbackData);
            setDataSource('sample');
          }
        }
      } catch (e: any) {
        console.error('[API Fetch Error]', e);
        setApiError('서버 및 DB 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setIsLoadingData(false);
        setIsSyncing(false);
      }
    },
    [currentCenter.lat, currentCenter.lng, distanceFilter, selectedCategory, searchKeyword]
  );

  // 필터 및 위치 변경 시 디바운스 적용하여 서버/DB 검색 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRestaurants]);

  // 웹 브라우저 & Capacitor 모바일 하이브리드 GPS 위치 권한 요청
  const handleRequestGps = useCallback(async () => {
    setIsGpsLoading(true);
    setLocationErrorReason('');

    const result = await getCurrentLocation();
    setIsGpsLoading(false);

    if (result.success && result.coords) {
      setUserCoordinates(result.coords);
      setIsUsingGps(true);
      setIsPermissionDenied(false);
    } else {
      setIsUsingGps(false);
      setIsPermissionDenied(Boolean(result.isPermissionDenied));
      setLocationErrorReason(result.errorReason || '현재 위치를 가져올 수 없습니다.');
      setIsLocationModalOpen(true);
    }
  }, []);

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedCategory('ALL');
    setDistanceFilter('ALL');
  };

  // 로고 클릭 시 첫 화면으로 완전 초기화
  const handleResetToHome = useCallback(() => {
    setSearchKeyword('');
    setSelectedCategory('ALL');
    setDistanceFilter('ALL');
    setViewMode('list');
    setSelectedRestaurant(null);
    setIsLocationModalOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-28 sm:pb-12 text-gray-900 pt-safe pb-safe">
      {/* 상단 헤더 */}
      <Header
        currentRegion={currentRegion}
        isUsingGps={isUsingGps}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onRequestGps={handleRequestGps}
        onLogoClick={handleResetToHome}
        isGpsLoading={isGpsLoading}
      />

      {/* 메인 컨테이너 */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* API 오류 발생 시 안내 배너 */}
        {apiError && (
          <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => fetchRestaurants()}
              className="text-xs font-bold text-rose-700 bg-white border border-rose-200 px-2.5 py-1 rounded-md hover:bg-rose-100 transition-colors shrink-0 ml-2 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 실데이터 & 연동 상태 안내 배너 */}
        <DataStatusBanner
          dataSource={dataSource}
          count={filteredRestaurants.length}
          totalCount={totalCount}
          regionName={currentRegion.name}
          onSync={() => fetchRestaurants(true)}
          isSyncing={isSyncing}
        />

        {/* 내 주변 찾기 활성화 알림 바 (GPS 사용 시 노출) */}
        {isUsingGps && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600 fill-blue-600 shrink-0" />
              <span>
                <strong>내 현재 GPS 위치</strong> 기준으로 직선거리 및 반경을 탐색 중입니다.
                <span className="text-blue-700 hidden sm:inline ml-1">
                  (사용자 위치는 브라우저 메모리에만 사용되며 서버나 DB에 저장되지 않습니다)
                </span>
              </span>
            </div>
            <button
              onClick={() => {
                setIsUsingGps(false);
                setUserCoordinates(null);
              }}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline shrink-0 ml-2 cursor-pointer"
            >
              지역 기준으로 복귀
            </button>
          </div>
        )}

        {/* 검색 및 필터 컨트롤 바 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          {/* 검색창 */}
          <SearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            onClear={() => setSearchKeyword('')}
            placeholder="상호명, 메뉴, 태그 검색 (예: 칼국수, 순대국, 초밥, 버거)"
          />

          {/* 업종 카테고리 태그 */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* 구분선 & 거리/즐겨찾기/뷰 컨트롤 */}
          <div className="border-t border-gray-100 pt-2 flex flex-wrap items-center justify-between gap-2">
            {/* 반경 필터 및 즐겨찾기 토글 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              <DistanceFilter
                selectedDistance={distanceFilter}
                onSelectDistance={setDistanceFilter}
              />
              <button
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  showFavoritesOnly
                    ? 'bg-rose-50 text-rose-600 border-rose-300 shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                title="즐겨찾기한 음식점만 모아보기"
              >
                <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                <span>즐겨찾기 ({favoriteIds.length})</span>
              </button>
            </div>

            {/* 목록 / 지도 전환 버튼 (데스크톱) */}
            <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>목록</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>지도</span>
              </button>
            </div>
          </div>
        </div>

        {/* 메인 뷰: 목록 또는 지도 (동일한 검색 결과 데이터 세트 공유) */}
        {isLoadingData ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm font-medium">우리 동네 음식점 정보를 불러오는 중입니다...</p>
          </div>
        ) : !isLoadingData && apiError && rawRestaurants.length === 0 ? (
          /* 통신/네트워크 에러 시 전면 재시도 화면 */
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">데이터를 불러오지 못했습니다</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4 leading-relaxed">
              {apiError}
              <br />네트워크 연결을 확인한 후 다시 시도해 주세요.
            </p>
            <button
              onClick={() => fetchRestaurants()}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>다시 시도하기</span>
            </button>
          </div>
        ) : showFavoritesOnly && filteredRestaurants.length === 0 ? (
          /* 즐겨찾기 결과 없을 때 안내 */
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">등록된 즐겨찾기가 없습니다</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4 leading-relaxed">
              음식점 카드의 하트(♥) 버튼을 눌러 자주 찾는 맛집을 즐겨찾기에 등록해 보세요!
            </p>
            <button
              onClick={() => setShowFavoritesOnly(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              전체 음식점 목록 보기
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <RestaurantList
            restaurants={filteredRestaurants}
            onSelectRestaurant={(r) => setSelectedRestaurant(r)}
            onViewOnMap={(r) => {
              setSelectedRestaurant(r);
              setViewMode('map');
            }}
            onResetFilters={handleResetFilters}
            totalCount={filteredRestaurants.length}
          />
        ) : (
          <MapView
            restaurants={filteredRestaurants}
            center={currentCenter}
            currentRegion={currentRegion}
            distanceFilter={distanceFilter}
            selectedRestaurant={selectedRestaurant}
            isUsingGps={isUsingGps}
            userCoordinates={userCoordinates}
            onSelectRestaurant={(r) => setSelectedRestaurant(r)}
            onOpenDetailModal={(r) => setSelectedRestaurant(r)}
          />
        )}
      </main>

      {/* 모바일 플로팅 하단 뷰 모드 전환 버튼 */}
      <div className="sm:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setViewMode((prev) => (prev === 'list' ? 'map' : 'list'))}
          className="pointer-events-auto bg-gray-900/95 hover:bg-black text-white px-5 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 border border-gray-700 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        >
          {viewMode === 'list' ? (
            <>
              <MapIcon className="w-4 h-4 text-indigo-400" />
              <span>지도 보기 ({filteredRestaurants.length})</span>
            </>
          ) : (
            <>
              <List className="w-4 h-4 text-indigo-400" />
              <span>목록 보기 ({filteredRestaurants.length})</span>
            </>
          )}
        </button>
      </div>

      {/* 지역 직접 선택 모달 (위치 미지원/거부 시 열림) */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentRegion={currentRegion}
        onSelectRegion={(reg) => {
          setCurrentRegion(reg);
          setIsUsingGps(false);
          setUserCoordinates(null);
        }}
        isPermissionDenied={isPermissionDenied}
        locationErrorReason={locationErrorReason}
      />

      {/* 음식점 상세 모달 */}
      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        onViewOnMap={(r) => {
          setViewMode('map');
          setSelectedRestaurant(r);
        }}
      />
    </div>
  );
}
