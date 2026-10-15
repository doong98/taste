import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function SampleNoticeBanner() {
  return (
    <aside
      aria-label="샘플 데이터 안내"
      className="bg-amber-50 border-y sm:border sm:rounded-xl border-amber-200 p-3 sm:p-4 text-xs sm:text-sm text-amber-900 shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950 block sm:inline mr-1">
            [화면 확인용 샘플 안내]
          </span>
          현재 20개의 음식점 데이터는 UI 레이아웃과 반응형 테스트를 위한 샘플입니다.
          평점, 리뷰, 영업시간은 실제 정보가 아니며, 추후 공공데이터포털 및 DB 연동 단계에서 실제 데이터로 연결됩니다.
        </div>
      </div>
    </aside>
  );
}
