import React from 'react';
import { CategoryType } from '@/types/restaurant';

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

const CATEGORIES: { label: string; value: CategoryType }[] = [
  { label: '전체', value: 'ALL' },
  { label: '한식', value: '한식' },
  { label: '중식', value: '중식' },
  { label: '일식', value: '일식' },
  { label: '양식', value: '양식' },
  { label: '분식', value: '분식' },
  { label: '카페/디저트', value: '카페/디저트' },
  { label: '패스트푸드', value: '패스트푸드' },
  { label: '기타', value: '기타' },
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 min-w-max">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
