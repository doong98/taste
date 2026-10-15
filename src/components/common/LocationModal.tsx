import React from 'react';
import { X, MapPin, Check, AlertTriangle } from 'lucide-react';
import { Region } from '@/types/restaurant';
import { AVAILABLE_REGIONS } from '@/constants/regions';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: Region;
  onSelectRegion: (region: Region) => void;
  isPermissionDenied?: boolean;
  locationErrorReason?: string;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentRegion,
  onSelectRegion,
  isPermissionDenied,
  locationErrorReason,
}: LocationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-900 text-lg">지역 직접 선택</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isPermissionDenied && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">
                  {locationErrorReason || '현재 위치를 확인할 수 없습니다'}
                </p>
                <p className="mt-0.5 text-rose-700">
                  원하는 지역(동)을 직접 선택하시면 해당 지역 중심 반경으로 음식점을 탐색할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 font-medium">탐색할 지역(동)을 선택하세요:</p>

          <div className="grid grid-cols-1 gap-2">
            {AVAILABLE_REGIONS.map((region) => {
              const isSelected = region.id === currentRegion.id;
              return (
                <button
                  key={region.id}
                  onClick={() => {
                    onSelectRegion(region);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span>{region.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-normal">
                        {region.district}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {region.city} {region.district} {region.name}
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
