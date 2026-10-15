import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Restaurant, CategoryType } from '@/types/restaurant';

function mapDbRowToRestaurant(row: any): Restaurant {
  const latVal = row.lat !== null && row.lat !== undefined ? parseFloat(row.lat) : null;
  const lngVal = row.lng !== null && row.lng !== undefined ? parseFloat(row.lng) : null;
  const hasValidCoords =
    latVal !== null && lngVal !== null && !isNaN(latVal) && !isNaN(lngVal) && latVal > 0 && lngVal > 0;

  return {
    id: String(row.id || row.bizes_id || row.origin_id),
    name: row.name,
    category: row.category as CategoryType,
    subCategory: row.sub_category || undefined,
    roadAddress: row.road_address,
    jibunAddress: row.jibun_address || '',
    phone: row.phone || undefined,
    coordinates: hasValidCoords ? { lat: latVal, lng: lngVal } : null,
    hasCoordinates: hasValidCoords,
    tags: Array.isArray(row.tags) ? row.tags : [],
    source: 'supabase',
    bizesId: row.bizes_id || row.origin_id,
    originId: row.origin_id || row.bizes_id,
    businessStatus: row.business_status || undefined,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    isSample: false,
    ratingInfo: '공공데이터/DB에 평점 정보가 제공되지 않습니다.',
    reviewInfo: '공공데이터/DB에 리뷰 정보가 제공되지 않습니다.',
    businessHoursInfo: '공공데이터/DB에 영업시간 정보가 제공되지 않습니다.',
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID가 필요합니다.' }, { status: 400 });
  }

  try {
    // 1. 숫자 ID인 경우
    const numId = parseInt(id, 10);
    let query = supabaseServer.from('restaurants').select('*');

    if (!isNaN(numId)) {
      query = query.or(`id.eq.${numId},bizes_id.eq.${id}`);
    } else {
      query = query.eq('bizes_id', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: '해당 음식점을 DB에서 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dataSource: 'supabase',
      data: mapDbRowToRestaurant(data),
    });
  } catch (err: any) {
    console.error('[Restaurant Detail DB Fetch Error]', err);
    return NextResponse.json(
      { success: false, message: 'DB 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
