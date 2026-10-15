import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { REAL_RESTAURANTS } from '@/constants/realStoreData';

export async function POST() {
  try {
    const formatted = REAL_RESTAURANTS.map((r) => ({
      bizes_id: r.bizesId,
      name: r.name,
      category: r.category,
      sub_category: r.subCategory || '',
      road_address: r.roadAddress,
      jibun_address: r.jibunAddress,
      phone: r.phone || '',
      lat: r.coordinates.lat,
      lng: r.coordinates.lng,
      tags: r.tags || [],
    }));

    const { data, error } = await supabase.from('restaurants').upsert(formatted, {
      onConflict: 'bizes_id',
    });

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
        hint: 'Supabase 테이블이 아직 생성되지 않았습니다. schema.sql을 Supabase SQL Editor에서 실행해 주세요.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${REAL_RESTAURANTS.length}개의 실제 음식점 데이터가 Supabase에 동기화되었습니다.`,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
