import React, { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant';
import { formatDistance } from '@/utils/geo';
import { MapPin, Phone, Heart } from 'lucide-react';
import { isFavorite as checkIsFavorite, toggleFavorite } from '@/utils/favorites';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  onViewOnMap?: (restaurant: Restaurant) => void;
}

export default function RestaurantCard({ restaurant, onClick, onViewOnMap }: RestaurantCardProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    checkIsFavorite(restaurant.id).then(setFavorite);

    const handleSync = (e: any) => {
      if (e?.detail?.restaurantId === restaurant.id) {
        setFavorite(e.detail.isFavorite);
      }
    };
    window.addEventListener('taste_favorites_changed', handleSync);
    return () => window.removeEventListener('taste_favorites_changed', handleSync);
  }, [restaurant.id]);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await toggleFavorite(restaurant.id);
    setFavorite(next);
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white rounded-2xl border border-gray-150 p-4 hover:border-indigo-300 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between relative"
    >
      <div>
        {/* 상단: 업종 & 거리 & 즐겨찾기/지도보기 버튼 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {restaurant.category}
            </span>
            {restaurant.subCategory && (
              <span className="text-xs text-gray-500">
                · {restaurant.subCategory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {restaurant.distanceMeter !== undefined ? (
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full">
                직선거리 {formatDistance(restaurant.distanceMeter)}
              </span>
            ) : (!restaurant.coordinates || restaurant.hasCoordinates === false) ? (
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                좌표 미제공
              </span>
            ) : null}
            {onViewOnMap && restaurant.coordinates && restaurant.hasCoordinates !== false && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOnMap(restaurant);
                }}
                className="p-1 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-md transition-colors"
                title="지도에서 마커 위치 보기"
                aria-label="지도에서 마커 위치 보기"
              >
                <MapPin className="w-4 h-4 text-indigo-500" />
              </button>
            )}
            <button
              type="button"
              onClick={handleHeartClick}
              className={`p-1 rounded-md transition-colors ${
                favorite ? 'text-rose-500 bg-rose-50' : 'text-gray-300 hover:text-rose-500 hover:bg-gray-100'
              }`}
              title={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              aria-label="즐겨찾기"
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* 상호명 */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {restaurant.name}
        </h3>

        {/* 주소 */}
        <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
          <span className="line-clamp-1">{restaurant.roadAddress}</span>
        </div>

        {/* 전화번호 */}
        {restaurant.phone && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <Phone className="w-3.5 h-3.5 shrink-0 text-gray-300" />
            <span>{restaurant.phone}</span>
          </div>
        )}

        {/* 태그 목록 */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="mt-3 flex items-center gap-1 flex-wrap">
            {restaurant.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 하단 출처 정보 및 상세보기 안내 */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span>
          {restaurant.isSample
            ? '화면 확인용 샘플'
            : restaurant.source === 'public_data'
            ? '소상공인시장진흥공단 공공데이터'
            : restaurant.source === 'supabase'
            ? 'Supabase 등록 매장'
            : '실제 등록 매장'}
        </span>
        <span className="text-indigo-600 font-medium group-hover:underline">
          상세정보 보기 &gt;
        </span>
      </div>
    </div>
  );
}
