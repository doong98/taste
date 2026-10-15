import React from 'react';
import Link from 'next/link';
import { MapPin, Navigation, ChevronDown, UtensilsCrossed } from 'lucide-react';
import { Region } from '@/types/restaurant';

interface HeaderProps {
  currentRegion: Region;
  isUsingGps: boolean;
  onOpenLocationModal: () => void;
  onRequestGps: () => void;
  onLogoClick?: () => void;
  isGpsLoading?: boolean;
}

export default function Header({
  currentRegion,
  isUsingGps,
  onOpenLocationModal,
  onRequestGps,
  onLogoClick,
  isGpsLoading,
}: HeaderProps) {
  const handleLogoClick = (e: React.MouseEvent) => {
    if (onLogoClick) {
      e.preventDefault();
      onLogoClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 & 타이틀 (클릭 시 첫 화면으로 이동) */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group cursor-pointer select-none transition-transform active:scale-95"
          title="첫 화면으로 이동"
          aria-label="동네밥상 홈으로 이동"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:from-indigo-700 group-hover:to-violet-600 transition-all">
            <UtensilsCrossed className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                동네밥상
              </span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden xs:block -mt-0.5 group-hover:text-gray-500 transition-colors">
              우리 동네 맛집 탐색기
            </p>
          </div>
        </Link>

        {/* 현재 위치 및 GPS 버튼 */}
        <div className="flex items-center gap-2">
          {/* 지역 선택 트리거 버튼 */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200/80 rounded-full text-xs sm:text-sm font-semibold text-gray-800 transition-colors"
            title="지역 직접 선택"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span className="max-w-[100px] truncate sm:max-w-none">
              {currentRegion.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* 내 주변 찾기 (GPS) 버튼 */}
          <button
            onClick={onRequestGps}
            disabled={isGpsLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              isUsingGps
                ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                : 'border border-blue-500 text-blue-600 hover:bg-blue-50'
            }`}
            title="현재 위치 기반 내 주변 찾기"
          >
            <Navigation
              className={`w-3.5 h-3.5 ${
                isGpsLoading ? 'animate-spin' : isUsingGps ? 'fill-current' : ''
              }`}
            />
            <span>
              {isGpsLoading ? '위치 확인중' : isUsingGps ? '내 주변 (GPS)' : '내 주변 찾기'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
