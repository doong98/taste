import React, { useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { formatDistance } from '@/utils/geo';
import { X, MapPin, Phone, Check, Copy, Compass, ExternalLink } from 'lucide-react';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  onViewOnMap?: (restaurant: Restaurant) => void;
}

export default function RestaurantDetailModal({
  restaurant,
  onClose,
  onViewOnMap,
}: RestaurantDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!restaurant) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(restaurant.roadAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {restaurant.category}
            </span>
            {restaurant.subCategory && (
              <span className="text-xs text-gray-500 font-medium">
                {restaurant.subCategory}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 내용 스크롤 */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* 기본 정보 */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {restaurant.name}
              </h2>
              {restaurant.distanceMeter !== undefined && (
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
                  직선거리 {formatDistance(restaurant.distanceMeter)}
                </span>
              )}
            </div>
            {restaurant.bizesId && (
              <p className="text-[11px] text-gray-400 mt-1">
                상가업소 등록번호: {restaurant.bizesId}
              </p>
            )}
          </div>

          {/* 태그 목록 */}
          {restaurant.tags && restaurant.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {restaurant.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 위치 및 연락처 상세 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-800">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{restaurant.roadAddress}</p>
                    {restaurant.jibunAddress && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        (지번) {restaurant.jibunAddress}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 px-2 py-1 bg-white border border-gray-200 rounded-md shrink-0 shadow-2xs font-medium"
                  title="주소 복사"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사됨' : '주소 복사'}</span>
                </button>
              </div>
            </div>

            {restaurant.phone && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-800">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 px-2.5 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  전화 걸기
                </a>
              </div>
            )}
          </div>

          {/* 지도 바로가기 카드 또는 좌표 미제공 안내 */}
          {restaurant.coordinates && restaurant.hasCoordinates !== false ? (
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-gray-800 block">카카오 지도에서 위치 확인</span>
                <span className="text-gray-400 text-[11px]">
                  위도: {restaurant.coordinates.lat.toFixed(5)}, 경도: {restaurant.coordinates.lng.toFixed(5)}
                </span>
              </div>
              <a
                href={`https://map.kakao.com/link/map/${encodeURIComponent(restaurant.name)},${restaurant.coordinates.lat},${restaurant.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <span>카카오맵 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>공공데이터에 좌표(위도/경도) 정보가 제공되지 않아 지도를 표시할 수 없습니다.</span>
            </div>
          )}

          {/* 공공데이터 정직성 고지 (평점/리뷰/사진/영업시간 미제공 원칙) */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 text-xs text-indigo-900 space-y-1.5">
            <div className="font-semibold flex items-center justify-between">
              <span>📋 공공데이터 제공 범위 안내</span>
              <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                {restaurant.source === 'public_data' ? '소상공인시장진흥공단' : '기본 데이터'}
              </span>
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              본 서비스는 신뢰성 있는 공공데이터를 그대로 제공하며, <strong>임의의 가짜 평점, 리뷰, 사진, 영업시간을 일절 생성하지 않습니다.</strong>
            </p>
            <div className="pt-1 text-[11px] text-gray-500 space-y-0.5">
              <div>· 평점/리뷰: 공공데이터포털 미제공 (평점 정보 없음)</div>
              <div>· 영업시간: 지자체/소상공인 공공데이터 미등록 (전화 문의 권장)</div>
              <div>· 사진: 공식 상권정보 미제공 (기본 업종 아이콘 적용)</div>
            </div>
          </div>
        </div>

        {/* 모달 하단 버튼 액션 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
          {onViewOnMap && restaurant.coordinates && restaurant.hasCoordinates !== false && (
            <button
              onClick={() => {
                onViewOnMap(restaurant);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
            >
              <Compass className="w-4 h-4" />
              <span>화면 지도에서 위치 보기</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex-1"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
