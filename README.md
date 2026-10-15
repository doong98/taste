# 🍲 동네밥상 (Taste) - 우리 동네 맛집 탐색 서비스

공공데이터포털(소상공인시장진흥공단 상가정보 API)과 **Supabase PostGIS**, **카카오 지도 API**를 연동하여 동네별/반경별 음식점을 실시간으로 탐색할 수 있는 반응형 웹 애플리케이션입니다.

---

## 📌 주요 기능

1. **실제 공공데이터 실시간 연동**
   - 소상공인시장진흥공단 상가(상권)정보 API를 서버 사이드에서 호출하여 안전하게 데이터 수집
   - 원본 ID와 출처를 조합한 중복 방지 및 갱신 파이프라인 구축

2. **Supabase PostGIS 기반 공간 데이터베이스**
   - 위도/경도를 PostGIS Geometry(`POINT`) 좌표로 변환하여 공간 인덱스(GIST) 적용
   - 현재 위치 기준 `500m`, `1km`, `3km` 반경 내 음식점 고속 검색 및 직선거리 자동 계산/정렬
   - RLS(Row Level Security) 정책 적용을 통한 데이터 무결성 및 보안 유지

3. **카카오 지도(Kakao Maps SDK) 연동**
   - 실제 도로, 건물, 아파트 및 음식점 핀 마커가 표시되는 인터랙티브 타일 맵 제공
   - 반경 가이드 원(500m / 1km / 3km) 시각화 및 마커 클릭 시 음식점 요약/상세 정보 팝업
   - 브라우저 GPS 위치 기반 내 주변 음식점 탐색 지원

4. **검색 및 필터링**
   - 상호명 및 메뉴 실시간 검색
   - 한식, 중식, 일식, 양식, 분식, 카페/디저트, 패스트푸드 등 업종별 필터

---

## 🛠 기술 스택

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS
- **Database & Spatial**: Supabase (PostgreSQL, PostGIS Extension)
- **Map & External API**: Kakao Maps JavaScript API, 소상공인시장진흥공단 상가정보 API
- **Icons**: Lucide React

---

## 🚀 시작하기

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
루트 디렉토리에 `.env.local` 파일을 생성하고 아래 항목을 입력합니다:
```env
# 카카오 지도 JavaScript API Key
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_javascript_key

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 공공데이터포털 API Key (서버 전용)
DATA_GO_KR_API_KEY=your_data_go_kr_api_key
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 서비스를 확인합니다.
