import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { REAL_RESTAURANTS } from '@/constants/realStoreData';
import { Restaurant, CategoryType } from '@/types/restaurant';
import { calculateDistanceInMeters } from '@/utils/geo';

// 공공데이터 서비스키 안전 인코딩/디코딩 처리
function getServiceKey(): string {
  const rawKey = process.env.DATA_GO_KR_API_KEY?.trim() || '';
  if (!rawKey) return '';
  try {
    const decoded = decodeURIComponent(rawKey);
    return encodeURIComponent(decoded);
  } catch {
    return rawKey;
  }
}

// DB 행(Row) 데이터를 프론트엔드 Restaurant 규격으로 변환
function mapDbRowToRestaurant(row: any, userLat?: number, userLng?: number): Restaurant {
  const latVal = row.lat !== null && row.lat !== undefined ? parseFloat(row.lat) : null;
  const lngVal = row.lng !== null && row.lng !== undefined ? parseFloat(row.lng) : null;
  const hasValidCoords =
    latVal !== null && lngVal !== null && !isNaN(latVal) && !isNaN(lngVal) && latVal > 0 && lngVal > 0;

  // DB RPC에서 이미 계산된 distance_meters가 있으면 우선 사용, 없으면 Haversine 계산
  let distanceMeter: number | undefined = undefined;
  if (row.distance_meters !== undefined && row.distance_meters !== null) {
    distanceMeter = Math.round(row.distance_meters);
  } else if (hasValidCoords && userLat !== undefined && userLng !== undefined) {
    distanceMeter = calculateDistanceInMeters(
      { lat: userLat, lng: userLng },
      { lat: latVal!, lng: lngVal! }
    );
  }

  return {
    id: String(row.id || row.bizes_id || row.origin_id),
    name: row.name,
    category: row.category as CategoryType,
    subCategory: row.sub_category || undefined,
    roadAddress: row.road_address,
    jibunAddress: row.jibun_address || '',
    phone: row.phone || undefined,
    coordinates: hasValidCoords ? { lat: latVal!, lng: lngVal! } : null,
    hasCoordinates: hasValidCoords,
    distanceMeter: distanceMeter,
    tags: Array.isArray(row.tags) ? row.tags : [],
    source: 'supabase',
    bizesId: row.bizes_id || row.origin_id,
    originId: row.origin_id || row.bizes_id,
    businessStatus: row.business_status || undefined, // 제공되는 데이터에만 저장/표시
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    isSample: false,
    ratingInfo: '공공데이터/DB에 평점 정보가 제공되지 않습니다.',
    reviewInfo: '공공데이터/DB에 리뷰 정보가 제공되지 않습니다.',
    businessHoursInfo: '공공데이터/DB에 영업시간 정보가 제공되지 않습니다.',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '37.5348');
  const lng = parseFloat(searchParams.get('lng') || '126.6575');
  const rawRadius = searchParams.get('radius');
  const radius = rawRadius === 'ALL' || !rawRadius ? 0 : parseInt(rawRadius, 10);
  const category = searchParams.get('category') || 'ALL';
  const keyword = (searchParams.get('keyword') || '').trim();
  const limitCount = parseInt(searchParams.get('limit') || searchParams.get('numOfRows') || '50', 10);
  const forceSync = searchParams.get('sync') === 'true';
  const forceSample = searchParams.get('sample') === 'true';

  // 1. 강제 샘플 요청
  if (forceSample) {
    return NextResponse.json({
      success: true,
      dataSource: 'sample',
      sourceLabel: '화면 확인용 샘플 데이터',
      count: REAL_RESTAURANTS.length,
      data: REAL_RESTAURANTS.map((item) => ({ ...item, isSample: true })),
    });
  }

  // 2. PostGIS Stored Procedure (search_nearby_restaurants) 우선 호출
  if (!forceSync) {
    try {
      const { data: rpcData, error: rpcError } = await supabaseServer.rpc(
        'search_nearby_restaurants',
        {
          user_lat: lat,
          user_lng: lng,
          radius_meters: radius,
          category_filter: category,
          keyword_filter: keyword,
          limit_count: limitCount,
        }
      );

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        const restaurants = rpcData.map((row) => mapDbRowToRestaurant(row, lat, lng));
        return NextResponse.json({
          success: true,
          dataSource: 'supabase',
          engine: 'postgis_rpc',
          sourceLabel: 'Supabase PostGIS 공간 인덱스 실시간 검색',
          count: restaurants.length,
          data: restaurants,
        });
      }

      // 만약 RPC 호출은 성공했는데 데이터가 0건인 경우(검색 조건에 맞는 매장 없음)
      if (!rpcError && Array.isArray(rpcData) && rpcData.length === 0) {
        // 테이블 전체에 데이터가 있는지 확인
        const { count: totalDbCount } = await supabaseServer
          .from('restaurants')
          .select('*', { count: 'exact', head: true });

        if (totalDbCount && totalDbCount > 0) {
          // DB에 데이터는 있지만 반경/검색 조건에 맞는 매장이 없음 -> 정상 0건 반환
          return NextResponse.json({
            success: true,
            dataSource: 'supabase',
            engine: 'postgis_rpc',
            sourceLabel: 'Supabase PostGIS 공간 인덱스 검색',
            count: 0,
            data: [],
          });
        }
      }
    } catch (rpcErr) {
      console.warn('[PostGIS RPC Fallback Warning]', rpcErr);
    }

    // 2-1. RPC 미생성 시 일반 DB 쿼리 + 서버 거리 계산/필터링 fallback
    try {
      let query = supabaseServer.from('restaurants').select('*');

      if (category && category !== 'ALL') {
        query = query.eq('category', category);
      }
      if (keyword) {
        query = query.or(
          `name.ilike.%${keyword}%,sub_category.ilike.%${keyword}%,road_address.ilike.%${keyword}%`
        );
      }

      const { data: dbData, error: dbError } = await query;

      if (!dbError && dbData && dbData.length > 0) {
        let list = dbData.map((row) => mapDbRowToRestaurant(row, lat, lng));

        // 반경 필터링 (500m, 1km, 3km)
        if (radius > 0) {
          list = list.filter(
            (item) => item.distanceMeter !== undefined && item.distanceMeter <= radius
          );
        }

        // 직선거리 오름차순 정렬
        list.sort((a, b) => {
          if (a.distanceMeter !== undefined && b.distanceMeter !== undefined) {
            return a.distanceMeter - b.distanceMeter;
          }
          if (a.distanceMeter !== undefined) return -1;
          if (b.distanceMeter !== undefined) return 1;
          return a.name.localeCompare(b.name, 'ko');
        });

        const limitedList = list.slice(0, limitCount);

        return NextResponse.json({
          success: true,
          dataSource: 'supabase',
          engine: 'server_spatial_fallback',
          sourceLabel: 'Supabase DB 공간 정렬 검색',
          count: limitedList.length,
          data: limitedList,
        });
      }
    } catch (fallbackErr) {
      console.warn('[DB Fallback Exception]', fallbackErr);
    }
  }

  // 3. DB에 데이터가 전혀 없거나 forceSync=true 인 경우: 공공데이터 수집 및 DB 저장
  const serviceKey = getServiceKey();
  if (serviceKey) {
    try {
      const publicApiUrl = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius?serviceKey=${serviceKey}&pageNo=1&numOfRows=50&radius=3000&cx=${lng}&cy=${lat}&indsLclsCd=I2&type=json`;

      const response = await fetch(publicApiUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      });

      if (response.ok) {
        const resJson = await response.json();
        const items = resJson?.body?.items || [];

        if (items.length > 0) {
          const rowsToSave = items.map((item: any) => {
            let displayName = (item.bizesNm || '').trim();
            const branchName = (item.brchNm || '').trim();
            if (branchName && !displayName.includes(branchName)) {
              displayName = `${displayName} ${branchName}`;
            }

            const latVal = parseFloat(item.lat);
            const lonVal = parseFloat(item.lon);
            const hasValidCoords =
              !isNaN(latVal) && !isNaN(lonVal) && latVal > 30 && latVal < 45 && lonVal > 120 && lonVal < 135;

            const cat = mapIndsToCategory(item.indsMclsNm, item.indsSclsNm);
            const tags = [item.indsMclsNm, item.indsSclsNm, item.ksicNm, item.bldNm]
              .map((t) => t?.trim())
              .filter((t): t is string => Boolean(t) && t.length > 0);

            const businessStatus = item.bizesStatusNm || item.statNm || null;

            return {
              source: 'public_data',
              origin_id: String(item.bizesId),
              bizes_id: String(item.bizesId),
              name: displayName || '상호 미제공',
              category: cat,
              sub_category: item.indsSclsNm || item.indsMclsNm || null,
              road_address: item.rdnmAdr || item.rdnm || '도로명 주소 없음',
              jibun_address: item.lnoAdr || null,
              phone: item.telNo ? String(item.telNo).trim() : null,
              lat: hasValidCoords ? latVal : null,
              lng: hasValidCoords ? lonVal : null,
              business_status: businessStatus,
              tags: tags,
              updated_at: new Date().toISOString(),
            };
          });

          // DB에 upsert 저장
          try {
            await supabaseServer
              .from('restaurants')
              .upsert(rowsToSave, { onConflict: 'source,origin_id' });
          } catch {
            const fallbackRows = rowsToSave.map(
              ({ origin_id, source, business_status, updated_at, ...rest }) => rest
            );
            await supabaseServer
              .from('restaurants')
              .upsert(fallbackRows, { onConflict: 'bizes_id' });
          }

          // 저장 후 다시 검색 수행
          const { data: savedDb } = await supabaseServer.from('restaurants').select('*');
          if (savedDb && savedDb.length > 0) {
            let list = savedDb.map((row) => mapDbRowToRestaurant(row, lat, lng));
            if (category && category !== 'ALL') {
              list = list.filter((r) => r.category === category);
            }
            if (keyword) {
              const q = keyword.toLowerCase();
              list = list.filter(
                (r) =>
                  r.name.toLowerCase().includes(q) ||
                  r.subCategory?.toLowerCase().includes(q) ||
                  r.roadAddress.toLowerCase().includes(q)
              );
            }
            if (radius > 0) {
              list = list.filter(
                (item) => item.distanceMeter !== undefined && item.distanceMeter <= radius
              );
            }
            list.sort((a, b) => (a.distanceMeter ?? 0) - (b.distanceMeter ?? 0));

            return NextResponse.json({
              success: true,
              dataSource: 'supabase',
              sourceLabel: 'Supabase DB 저장 후 공간 검색',
              count: list.slice(0, limitCount).length,
              data: list.slice(0, limitCount),
            });
          }
        }
      }
    } catch (err: any) {
      console.error('[Public API Fetch Exception]', err);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'NO_DATA',
      message: '해당 조건의 음식점 정보를 찾을 수 없습니다.',
      data: [],
    },
    { status: 404 }
  );
}

function mapIndsToCategory(indsMcls: string = '', indsScls: string = ''): CategoryType {
  const text = `${indsMcls} ${indsScls}`.toLowerCase();

  if (text.includes('카페') || text.includes('커피') || text.includes('비알코올') || text.includes('제과') || text.includes('베이커리') || text.includes('디저트') || text.includes('떡/한과') || text.includes('찻집')) {
    return '카페/디저트';
  }
  if (text.includes('일식') || text.includes('초밥') || text.includes('회') || text.includes('돈가스') || text.includes('라멘') || text.includes('우동') || text.includes('소바')) {
    return '일식';
  }
  if (text.includes('중식') || text.includes('중국집') || text.includes('탕수육') || text.includes('마라') || text.includes('짬뽕') || text.includes('짜장')) {
    return '중식';
  }
  if (text.includes('양식') || text.includes('서양식') || text.includes('스파게티') || text.includes('파스타') || text.includes('스테이크') || text.includes('피자') || text.includes('패밀리레스토랑')) {
    return '양식';
  }
  if (text.includes('분식') || text.includes('떡볶이') || text.includes('김밥') || text.includes('순대') || text.includes('튀김') || text.includes('라면')) {
    return '분식';
  }
  if (text.includes('패스트푸드') || text.includes('버거') || text.includes('샌드위치') || text.includes('치킨') || text.includes('닭강정')) {
    return '패스트푸드';
  }
  if (text.includes('한식') || text.includes('백반') || text.includes('국밥') || text.includes('찌개') || text.includes('고기') || text.includes('삼겹살') || text.includes('갈비') || text.includes('탕') || text.includes('구이') || text.includes('해물') || text.includes('족발') || text.includes('보쌈') || text.includes('죽') || text.includes('국수')) {
    return '한식';
  }
  return '기타';
}
