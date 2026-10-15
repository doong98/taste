import React from 'react';
import { DistanceFilterType } from '@/types/restaurant';
import { Compass } from 'lucide-react';

interface DistanceFilterProps {
  selectedDistance: DistanceFilterType;
  onSelectDistance: (distance: DistanceFilterType) => void;
}

const DISTANCE_OPTIONS: { label: string; value: DistanceFilterType }[] = [
  { label: '전체 거리', value: 'ALL' },
  { label: '500m 이내', value: 500 },
  { label: '1km 이내', value: 1000 },
  { label: '3km 이내', value: 3000 },
];

export default function DistanceFilter({
  selectedDistance,
  onSelectDistance,
}: DistanceFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold pl-0.5 mr-1 shrink-0">
        <Compass className="w-3.5 h-3.5 text-indigo-500" />
        <span>반경:</span>
      </div>
      {DISTANCE_OPTIONS.map((opt) => {
        const isSelected = selectedDistance === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onSelectDistance(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
              isSelected
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
