import { useState, useEffect } from 'react';

/**
 * Google Maps API 로드를 중앙화한 커스텀 훅
 * 여러 컴포넌트에서 재사용 가능하며, 중복 로드를 방지합니다.
 */
export function useGoogleMaps() {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    let handleLoad = null;
    let handleError = null;
    let targetScript = null;

    // API 키가 없는 경우
    if (!apiKey) {
      setError('Google Maps API 키가 설정되지 않았습니다. .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 추가하세요.');
      setIsLoading(false);
      return;
    }

    // 이미 로드되었는지 확인
    if (window.google && window.google.maps && window.google.maps.places) {
      setApiLoaded(true);
      setIsLoading(false);
      return;
    }

    // 스크립트가 이미 추가되었는지 확인
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // 잘못된 키로 로드된 스크립트인지 확인
      if (existingScript.src.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
        existingScript.remove();
      } else {
        // 올바른 스크립트가 이미 로드 중인 경우
        if (window.google && window.google.maps && window.google.maps.places) {
          setApiLoaded(true);
          setIsLoading(false);
        } else {
          // 스크립트가 로드 중이면 로드 완료를 기다림
          targetScript = existingScript;

          handleLoad = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
              setApiLoaded(true);
              setIsLoading(false);
            }
          };

          handleError = () => {
            setError('Google Maps API 로드에 실패했습니다. API 키를 확인해주세요.');
            setIsLoading(false);
          };

          existingScript.addEventListener('load', handleLoad);
          existingScript.addEventListener('error', handleError);
        }
        return () => {
          if (targetScript && handleLoad) {
            targetScript.removeEventListener('load', handleLoad);
          }
          if (targetScript && handleError) {
            targetScript.removeEventListener('error', handleError);
          }
        };
      }
    }

    // Google Maps API 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ko`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setApiLoaded(true);
        setIsLoading(false);
        setError(null);
      } else {
        setError('Google Maps API가 올바르게 로드되지 않았습니다.');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Google Maps API 로드에 실패했습니다. 네트워크 연결과 API 키를 확인해주세요.');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  return {
    apiLoaded,
    error,
    isLoading,
    isReady: apiLoaded && window.google && window.google.maps && window.google.maps.places,
  };
}

