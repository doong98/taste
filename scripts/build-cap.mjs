import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const tempApiDir = path.join(rootDir, 'src', 'app', '_api_build_temp');
const nextCacheDir = path.join(rootDir, '.next');

console.log('==============================================');
console.log('🚀 [Capacitor] 모바일 앱 정적 빌드 및 동기화 시작');
console.log('==============================================');

let moved = false;

try {
  // 0. 이전 dev 빌드 캐시(.next) 정리하여 stale type 에러 방지
  if (fs.existsSync(nextCacheDir)) {
    try {
      fs.rmSync(nextCacheDir, { recursive: true, force: true });
    } catch {}
  }

  // 1. Next.js export 시 Node.js 전용 API Routes 제외를 위해 임시 이동
  if (fs.existsSync(apiDir)) {
    try {
      fs.renameSync(apiDir, tempApiDir);
      moved = true;
      console.log('✓ API Routes 임시 격리 완료 (앱은 Vercel 원격 HTTPS API 호출)');
    } catch (e) {
      console.warn('! API 폴더 이동 건너뜀:', e);
    }
  }

  // 2. Next.js 정적 HTML/JS/CSS 내보내기 빌드 (out 폴더 생성)
  console.log('\n📦 Next.js 정적 SPA 번들 빌드 중 (output: export)...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, NEXT_EXPORT: 'true' },
  });
  console.log('✓ out 폴더 정적 번들 생성 완료!');

} catch (err) {
  console.error('\n❌ 빌드 중 오류 발생:', err);
  process.exit(1);
} finally {
  // 3. API Routes 즉시 원래 위치로 복구 (기존 웹 서버 무중단 유지)
  if (moved && fs.existsSync(tempApiDir)) {
    try {
      fs.renameSync(tempApiDir, apiDir);
      console.log('✓ API Routes 원래 위치로 안전하게 복원 완료');
    } catch (e) {
      console.error('! API Routes 복구 실패 (수동 복구 필요):', e);
    }
  }
}

// 4. Capacitor 플랫폼(Android, iOS)으로 정적 웹 에셋 및 플러그인 동기화
try {
  console.log('\n📱 Capacitor Android & iOS 플랫폼 에셋 동기화 중 (cap sync)...');
  execSync('npx cap sync', { stdio: 'inherit' });
  console.log('\n==============================================');
  console.log('🎉 Capacitor 앱 동기화 완료! Android Studio / Xcode에서 실행 가능합니다.');
  console.log('==============================================');
} catch (syncErr) {
  console.error('Capacitor sync 실패:', syncErr);
}
