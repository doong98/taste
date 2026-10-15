import { Region } from '@/types/restaurant';

export const DEFAULT_REGION: Region = {
  id: 'incheon-seogu-cheongna',
  name: '청라1동',
  district: '서구',
  city: '인천광역시',
  center: {
    lat: 37.5348,
    lng: 126.6575, // 인천광역시 서구 청라동 (커낼웨이 중심)
  },
};

export const AVAILABLE_REGIONS: Region[] = [
  DEFAULT_REGION,
  {
    id: 'incheon-seogu-yeonhui',
    name: '연희동 (서구청)',
    district: '서구',
    city: '인천광역시',
    center: {
      lat: 37.5453,
      lng: 126.6761,
    },
  },
  {
    id: 'incheon-seogu-gajeong',
    name: '가정1동 (루원시티)',
    district: '서구',
    city: '인천광역시',
    center: {
      lat: 37.5255,
      lng: 126.6742,
    },
  },
  {
    id: 'incheon-seogu-geomam',
    name: '검암경서동',
    district: '서구',
    city: '인천광역시',
    center: {
      lat: 37.5647,
      lng: 126.6792,
    },
  },
  {
    id: 'goyang-seongsa1',
    name: '성사1동',
    district: '고양시 덕양구',
    city: '경기도',
    center: {
      lat: 37.6564,
      lng: 126.8350,
    },
  },
  {
    id: 'gangnam-yeoksam1',
    name: '역삼1동',
    district: '강남구',
    city: '서울특별시',
    center: {
      lat: 37.5006,
      lng: 127.0365,
    },
  },
];
