import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthGuard from './components/AuthGuard.jsx'

// 버전 체크 및 캐시 무효화 (한 번만 실행)
const checkForUpdates = () => {
  // 빌드 버전이 없으면 버전 체크를 건너뜀 (개발 환경)
  const buildVersion = import.meta.env.VITE_BUILD_VERSION;
  
  // 빌드 버전이 없으면 버전 체크 스킵 (개발 환경)
  if (!buildVersion) {
    return;
  }
  
  const storedVersion = localStorage.getItem('app_version');
  
  // 새 버전이 감지된 경우에만 새로고침
  if (storedVersion && storedVersion !== buildVersion) {
    // Supabase 세션 정보 보존
    const keysToKeep = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToKeep.push({ key, value: localStorage.getItem(key) });
      }
    }
    
    // 캐시 클리어
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    
    // 앱 관련 데이터만 클리어
    localStorage.clear();
    
    // Supabase 세션 정보 복원
    keysToKeep.forEach(({ key, value }) => {
      localStorage.setItem(key, value);
    });
    
    localStorage.setItem('app_version', buildVersion);
    window.location.reload();
    return; // 새로고침되므로 여기서 종료
  }
  
  // 버전이 없으면 현재 버전 저장
  if (!storedVersion) {
    localStorage.setItem('app_version', buildVersion);
  }
};

// 앱 시작 전 버전 체크 (한 번만 실행)
checkForUpdates();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGuard>
      <App />
    </AuthGuard>
  </StrictMode>,
)
