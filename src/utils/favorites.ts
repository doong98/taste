import { Preferences } from '@capacitor/preferences';

const FAVORITES_KEY = 'taste_favorite_restaurant_ids';

/**
 * 저장된 즐겨찾기 음식점 ID 목록을 조회합니다.
 */
export async function getFavoriteIds(): Promise<string[]> {
  try {
    const { value } = await Preferences.get({ key: FAVORITES_KEY });
    if (!value) return [];
    return JSON.parse(value);
  } catch {
    // 웹 브라우저 로컬스토리지 fallback
    try {
      const fallback = localStorage.getItem(FAVORITES_KEY);
      return fallback ? JSON.parse(fallback) : [];
    } catch {
      return [];
    }
  }
}

/**
 * 특정 음식점의 즐겨찾기 상태를 토글(추가/삭제)합니다.
 * @returns 토글 후 즐겨찾기 여부 (true: 추가됨, false: 삭제됨)
 */
export async function toggleFavorite(restaurantId: string): Promise<boolean> {
  const currentList = await getFavoriteIds();
  const index = currentList.indexOf(restaurantId);
  let isNowFavorite = false;

  let updatedList: string[];
  if (index >= 0) {
    updatedList = currentList.filter((id) => id !== restaurantId);
    isNowFavorite = false;
  } else {
    updatedList = [...currentList, restaurantId];
    isNowFavorite = true;
  }

  const jsonString = JSON.stringify(updatedList);

  try {
    await Preferences.set({ key: FAVORITES_KEY, value: jsonString });
  } catch {
    try {
      localStorage.setItem(FAVORITES_KEY, jsonString);
    } catch {}
  }

  // 앱 내 모든 컴포넌트 실시간 동기화를 위한 이벤트 발행
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('taste_favorites_changed', {
        detail: { restaurantId, isFavorite: isNowFavorite, favorites: updatedList },
      })
    );
  }

  return isNowFavorite;
}

/**
 * 해당 음식점이 즐겨찾기인지 확인합니다.
 */
export async function isFavorite(restaurantId: string): Promise<boolean> {
  const list = await getFavoriteIds();
  return list.includes(restaurantId);
}
