import React from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DataStatusBannerProps {
  dataSource?: string;
  count: number;
  totalCount?: number;
  regionName?: string;
  onSync?: () => void;
  isSyncing?: boolean;
}

export default function DataStatusBanner({
  dataSource = 'supabase',
  count,
  totalCount,
  regionName,
  onSync,
  isSyncing = false,
}: DataStatusBannerProps) {
  const isSupabase = dataSource === 'supabase';
  const isSample = dataSource === 'sample';

  if (isSample) {
    return (
      <aside
        aria-label="샘플 데이터 안내"
        className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-amber-950 shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-900">
              화면 확인용 샘플 데이터 ({count}곳 표시)
            </span>
          </div>
          <span className="text-xs text-amber-700 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
            UI 테스트용 Mock Data
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="데이터 정보 안내"
      className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-emerald-950 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-emerald-900">
            {regionName ? `${regionName} 기준 ` : ''}
            {isSupabase ? 'Supabase DB 연동' : '소상공인 공공데이터'} ({count}곳 저장 및 조회
            {totalCount && totalCount > count ? ` / 총 ${totalCount}곳 중` : ''})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-white/90 px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">
              {isSupabase ? 'Supabase PostgreSQL' : '공공데이터포털(sdsc2)'}
            </span>
          </div>

          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white px-2 py-1 rounded-md border border-emerald-200 transition-all disabled:opacity-50"
              title="공공데이터포털에서 최신 정보를 다시 수집하여 DB를 갱신합니다."
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '수집 중...' : '최신 데이터 갱신'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
