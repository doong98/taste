import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = '음식점 이름이나 메뉴 키워드를 검색하세요',
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-gray-900 placeholder-gray-400 text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="검색어 지우기"
        >
          <X className="w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-full p-0.5" />
        </button>
      )}
    </div>
  );
}
