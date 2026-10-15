export type CategoryType = 
  | 'ALL'
  | '한식'
  | '중식'
  | '일식'
  | '양식'
  | '분식'
  | '카페/디저트'
  | '패스트푸드'
  | '기타';

export type DistanceFilterType = 'ALL' | 500 | 1000 | 3000;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Region {
  id: string;
  name: string;
  district: string;
  city: string;
  center: Coordinates;
}

export interface Restaurant {
  id: string;
  name: string;
  category: CategoryType;
  subCategory?: string;
  roadAddress: string;
  jibunAddress: string;
  phone?: string;
  coordinates: Coordinates | null;
  hasCoordinates?: boolean;
  distanceMeter?: number;
  tags?: string[];
  
  // 데이터 출처
  source?: 'supabase' | 'public_data' | 'local_store' | 'sample';
  bizesId?: string; // 공공데이터 상가업소번호 (원본 ID)
  originId?: string; // 출처 원본 ID
  businessStatus?: string; // 영업상태 (제공되는 데이터에만 표기, 미제공 시 없음)
  updatedAt?: string; // 갱신일
  createdAt?: string; // 최초 수집일

  // 하위 호환 옵셔널 필드
  isSample?: boolean;
  sampleNotice?: string;
  ratingInfo?: string;
  reviewInfo?: string;
  businessHoursInfo?: string;
}

export type ViewMode = 'list' | 'map';
