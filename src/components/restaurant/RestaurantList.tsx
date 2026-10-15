import React from 'react';
import { Restaurant } from '@/types/restaurant';
import RestaurantCard from './RestaurantCard';
import { Utensils, RotateCcw } from 'lucide-react';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onViewOnMap?: (restaurant: Restaurant) => void;
  onResetFilters?: () => void;
  totalCount: number;
}

export default function RestaurantList({
  restaurants,
  onSelectRestaurant,
  onViewOnMap,
  onResetFilters,
  totalCount,
}: RestaurantListProps) {
  return (
    <div className="w-full space-y-3">
      {/* 목록 헤더: 건수 표시 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs sm:text-sm font-bold text-gray-700">
          검색 결과 <span className="text-indigo-600">{restaurants.length}</span>곳{' '}
          <span className="text-xs font-normal text-gray-400">(전체 등록 음식점 {totalCount}곳 중)</span>
        </p>
      </div>

      {/* 음식점 카드 그리드 */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={() => onSelectRestaurant(restaurant)}
              onViewOnMap={onViewOnMap}
            />
          ))}
        </div>
      ) : (
        /* 검색 결과 없음 */
        <div className="py-16 px-4 text-center bg-white rounded-2xl border border-gray-150">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
            <Utensils className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-800 text-sm sm:text-base">
            조건에 맞는 음식점이 없습니다
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            검색어를 변경하거나 거리 반경 및 업종 필터를 완화해보세요.
          </p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>필터 초기화</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
