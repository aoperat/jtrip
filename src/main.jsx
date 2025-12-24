import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthGuard from './components/AuthGuard.jsx'

// 버전 체크 및 캐시 무효화
const checkForUpdates = () => {
  // 빌드 타임스탬프를 사용하여 새 버전 감지
  const buildVersion = import.meta.env.VITE_BUILD_VERSION || Date.now().toString();
  const storedVersion = localStorage.getItem('app_version');
  
  if (storedVersion && storedVersion !== buildVersion) {
    // 새 버전이 감지되면 캐시 클리어 및 새로고침
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    localStorage.clear();
    localStorage.setItem('app_version', buildVersion);
    window.location.reload();
  } else if (!storedVersion) {
    localStorage.setItem('app_version', buildVersion);
  }
};

// 앱 시작 전 버전 체크
checkForUpdates();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGuard>
      <App />
    </AuthGuard>
  </StrictMode>,
)
