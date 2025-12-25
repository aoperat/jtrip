import { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Loader2, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

/**
 * Google Maps를 사용하여 일정 장소들을 마커로 표시하는 컴포넌트
 */
export default function MapView({ itineraryItems, selectedDay }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const animationIntervalRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [isZooming, setIsZooming] = useState(false);
  const { error, isLoading, isReady } = useGoogleMaps();

  const MIN_ZOOM = 3;
  const MAX_ZOOM = 20;

  // 파스텔 톤 지도 스타일 (경로가 잘 보이도록)
  const mapStyles = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9e4f6' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ecae1' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#e8f4e8' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e0e0e0' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#ffeaa7' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ];

  // 위치 정보가 있는 항목만 필터링 (메모이제이션)
  const itemsWithLocation = useMemo(() => {
    return (itineraryItems || []).filter(
      (item) => item.latitude && item.longitude && !isNaN(item.latitude) && !isNaN(item.longitude)
    );
  }, [itineraryItems]);

  // 지도 초기화
  useEffect(() => {
    if (!isReady || !mapRef.current) {
      return;
    }

    // 지도가 이미 초기화되었으면 스킵
    if (mapInstanceRef.current) {
      return;
    }

    // 기본 중심점 (서울)
    let center = { lat: 37.5665, lng: 126.9780 };
    let initialZoom = 10;

    if (itemsWithLocation.length > 0) {
      // 모든 마커의 중심점 계산
      const bounds = new window.google.maps.LatLngBounds();
      itemsWithLocation.forEach((item) => {
        bounds.extend(
          new window.google.maps.LatLng(item.latitude, item.longitude)
        );
      });
      center = bounds.getCenter();
    }

    // 지도 초기화
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: initialZoom,
      center: center,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      styles: mapStyles,
    });

    // 초기 줌 레벨 설정
    setZoomLevel(mapInstanceRef.current.getZoom());

    // 줌 레벨 변경 리스너 (사용자 줌 제어 허용)
    const zoomListener = mapInstanceRef.current.addListener('zoom_changed', () => {
      if (mapInstanceRef.current && !isZooming) {
        const currentZoom = mapInstanceRef.current.getZoom();
        setZoomLevel(currentZoom);
      }
    });

    // 초기 bounds 설정 (마커가 있는 경우)
    if (itemsWithLocation.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      itemsWithLocation.forEach((item) => {
        bounds.extend(
          new window.google.maps.LatLng(item.latitude, item.longitude)
        );
      });
      
      // fitBounds로 모든 마커가 보이도록 조정
      mapInstanceRef.current.fitBounds(bounds, { 
        padding: 80,
        maxZoom: 18 // 너무 확대되지 않도록 최대 줌 제한
      });
      
      // fitBounds 완료 후 줌 레벨 업데이트
      // bounds_changed와 idle 이벤트를 함께 사용하여 확실하게 업데이트
      let boundsListener = null;
      let idleListener = null;
      let timeoutId = null;
      
      const updateZoom = () => {
        if (mapInstanceRef.current) {
          const currentZoom = mapInstanceRef.current.getZoom();
          setZoomLevel(currentZoom);
        }
      };
      
      const cleanup = () => {
        if (boundsListener) {
          window.google.maps.event.removeListener(boundsListener);
          boundsListener = null;
        }
        if (idleListener) {
          window.google.maps.event.removeListener(idleListener);
          idleListener = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      
      // bounds_changed 이벤트 리스너 추가 (fitBounds 직후 발생)
      boundsListener = mapInstanceRef.current.addListener('bounds_changed', () => {
        updateZoom();
        cleanup();
      });
      
      // idle 이벤트 리스너 추가 (애니메이션 완료 후 발생)
      idleListener = mapInstanceRef.current.addListener('idle', () => {
        updateZoom();
        cleanup();
      });
      
      // 백업: 일정 시간 후에도 업데이트
      timeoutId = setTimeout(() => {
        updateZoom();
        cleanup();
      }, 500);
    }

    // 정리 함수
    return () => {
      if (zoomListener) {
        window.google.maps.event.removeListener(zoomListener);
      }
    };
  }, [isReady, itemsWithLocation.length]);

  // 마커 및 경로 업데이트
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) {
      return;
    }

    // 기존 애니메이션 정리
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    // 위치 정보가 없는 경우 기존 마커만 제거
    if (itemsWithLocation.length === 0) {
      markersRef.current.forEach((m) => {
        if (m.marker) m.marker.setMap(null);
        if (m.infoWindow) m.infoWindow.close();
      });
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    // 기존 마커 및 경로 제거
    markersRef.current.forEach((m) => {
      if (m.marker) m.marker.setMap(null);
      if (m.infoWindow) m.infoWindow.close();
    });
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 시간 순서대로 정렬 (시간이 있는 것 먼저, 그 다음 시간 순서)
    const sortedItems = [...itemsWithLocation].sort((a, b) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      return 0;
    });

    // 중복 좌표 감지 (locationCounts)
    const locationCounts = {};
    sortedItems.forEach((item, index) => {
      // 좌표를 소수점 5자리까지 비교 (약 1m 오차 허용)
      const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
      if (!locationCounts[key]) {
        locationCounts[key] = {
          indices: [],
          items: [],
          lat: item.latitude,
          lng: item.longitude,
        };
      }
      locationCounts[key].indices.push(index + 1);
      locationCounts[key].items.push(item);
    });

    // 경로 좌표 배열 생성
    const pathCoordinates = sortedItems.map((item) => ({
      lat: item.latitude,
      lng: item.longitude,
    }));

    // 경로 그리기 (2개 이상의 장소가 있을 때만)
    if (pathCoordinates.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 4,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#1d4ed8',
              strokeWeight: 1,
            },
            offset: '0%',
            repeat: '80px',
          },
        ],
      });
      polylineRef.current.setMap(mapInstanceRef.current);

      // 화살표 흐르는 애니메이션
      let animationOffset = 0;
      animationIntervalRef.current = setInterval(() => {
        animationOffset = (animationOffset + 1) % 80;
        if (polylineRef.current) {
          polylineRef.current.set('icons', [
            {
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 4,
                fillColor: '#2563eb',
                fillOpacity: 1,
                strokeColor: '#1d4ed8',
                strokeWeight: 1,
              },
              offset: `${animationOffset}px`,
              repeat: '80px',
            },
          ]);
        }
      }, 50);
    }

    // 중복 위치에 대해 하나의 마커만 생성 (첫 번째 방문 번호만 표시)
    const processedLocations = new Set();

    Object.entries(locationCounts).forEach(([key, data]) => {
      if (processedLocations.has(key)) return;
      processedLocations.add(key);

      const { indices, items, lat, lng } = data;
      const visitCount = indices.length;
      const isHub = visitCount > 1; // 여러 번 방문하는 거점

      // 첫 번째 방문 번호만 표시
      const labelText = `${indices[0]}`;

      // 거점 마커는 크기와 색상 강조
      const markerScale = isHub ? 12 : 10;
      const markerColor = isHub ? '#dc2626' : '#2563eb'; // 거점은 빨간색

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: items.map(i => i.title).join(' → '),
        label: {
          text: labelText,
          color: 'white',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: markerScale,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: isHub ? 1000 : 100,
      });

      // 정보창 생성 (여러 일정이 있으면 모두 표시)
      const contentParts = items.map((item, idx) => `
        <div style="padding: 8px; ${idx > 0 ? 'border-top: 1px solid #e2e8f0;' : ''}">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${isHub ? '#dc2626' : '#2563eb'}; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px;">
              ${indices[idx]}
            </span>
            <h3 style="margin: 0; font-weight: bold; font-size: 14px; color: #1e293b;">
              ${item.title}
            </h3>
          </div>
          ${item.time ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">⏰ ${item.time}</p>` : ''}
          ${item.locationName ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">📍 ${item.locationName}</p>` : ''}
          ${item.address ? `<p style="margin: 0; font-size: 10px; color: #94a3b8;">${item.address}</p>` : ''}
        </div>
      `).join('');

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="min-width: 220px; max-height: 300px; overflow-y: auto;">
            ${isHub ? `<div style="background: #dc2626; color: white; padding: 6px 12px; font-size: 11px; font-weight: bold; text-align: center;">📍 ${visitCount}회 방문</div>` : ''}
            ${contentParts}
          </div>
        `,
      });

      // 마커 클릭 시 정보창 표시
      marker.addListener('click', () => {
        // 다른 정보창 닫기
        markersRef.current.forEach((m) => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push({ marker, infoWindow });
    });

    // 마커가 추가된 후 bounds 조정 (일차 변경 시)
    if (mapInstanceRef.current && sortedItems.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      sortedItems.forEach((item) => {
        bounds.extend(
          new window.google.maps.LatLng(item.latitude, item.longitude)
        );
      });
      
      // fitBounds로 모든 마커가 보이도록 조정 (사용자 줌 제어 허용)
      mapInstanceRef.current.fitBounds(bounds, { 
        padding: 80,
        maxZoom: 18 // 너무 확대되지 않도록 최대 줌 제한
      });
      
      // fitBounds 완료 후 줌 레벨 업데이트
      // bounds_changed와 idle 이벤트를 함께 사용하여 확실하게 업데이트
      let boundsListener = null;
      let idleListener = null;
      let timeoutId = null;
      
      const updateZoom = () => {
        if (mapInstanceRef.current) {
          const currentZoom = mapInstanceRef.current.getZoom();
          setZoomLevel(currentZoom);
        }
      };
      
      const cleanup = () => {
        if (boundsListener) {
          window.google.maps.event.removeListener(boundsListener);
          boundsListener = null;
        }
        if (idleListener) {
          window.google.maps.event.removeListener(idleListener);
          idleListener = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      
      // bounds_changed 이벤트 리스너 추가 (fitBounds 직후 발생)
      boundsListener = mapInstanceRef.current.addListener('bounds_changed', () => {
        updateZoom();
        cleanup();
      });
      
      // idle 이벤트 리스너 추가 (애니메이션 완료 후 발생)
      idleListener = mapInstanceRef.current.addListener('idle', () => {
        updateZoom();
        cleanup();
      });
      
      // 백업: 일정 시간 후에도 업데이트
      timeoutId = setTimeout(() => {
        updateZoom();
        cleanup();
      }, 500);
    }

    // cleanup 함수 (애니메이션 정리 포함)
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [isReady, itemsWithLocation, selectedDay]);

  // 로딩 중인 경우
  if (isLoading) {
    return (
      <div className="p-6 h-[400px] animate-in zoom-in-95">
        <div className="w-full h-full bg-slate-100 rounded-[40px] border-4 border-white shadow-inner flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">지도를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러가 발생한 경우
  if (error) {
    return (
      <div className="p-6 h-[400px] animate-in zoom-in-95">
        <div className="w-full h-full bg-red-50 rounded-[40px] border-4 border-red-100 shadow-inner flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div className="text-center px-4">
            <p className="text-sm font-bold text-red-800 mb-2">지도를 불러올 수 없습니다</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // API가 준비되지 않은 경우
  if (!isReady) {
    return (
      <div className="p-6 h-[400px] animate-in zoom-in-95">
        <div className="w-full h-full bg-slate-100 rounded-[40px] border-4 border-white shadow-inner flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">지도를 준비하는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 지도는 항상 표시하되, 위치 정보가 없으면 메시지 오버레이 표시
  return (
    <div className="p-6 h-[400px] animate-in zoom-in-95 relative">
      <div className="w-full h-full rounded-[40px] border-4 border-white shadow-inner overflow-hidden relative">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
        
        {/* 슬라이더형 줌 컨트롤 */}
        {isReady && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-4 rounded-xl shadow-lg border border-slate-200 z-20 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current && zoomLevel < MAX_ZOOM) {
                  setIsZooming(true);
                  mapInstanceRef.current.zoomIn();
                  setTimeout(() => setIsZooming(false), 300);
                }
              }}
              disabled={zoomLevel >= MAX_ZOOM}
              className="p-1.5 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="줌 인"
            >
              <ZoomIn className="w-4 h-4 text-blue-500" />
            </button>
            
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative" style={{ height: '120px', width: '4px' }}>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  value={zoomLevel}
                  step={0.5}
                  onChange={(e) => {
                    const newZoom = parseFloat(e.target.value);
                    setZoomLevel(newZoom);
                    setIsZooming(true);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setZoom(newZoom);
                      setTimeout(() => setIsZooming(false), 100);
                    }
                  }}
                  className="zoom-slider-vertical"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    width: '120px',
                    height: '4px',
                  }}
                  title={`줌 레벨: ${Math.round(zoomLevel)}`}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-600 min-w-[30px] text-center">
                {Math.round(zoomLevel)}
              </span>
            </div>
            
            <button
              onClick={() => {
                if (mapInstanceRef.current && zoomLevel > MIN_ZOOM) {
                  setIsZooming(true);
                  mapInstanceRef.current.zoomOut();
                  setTimeout(() => setIsZooming(false), 300);
                }
              }}
              disabled={zoomLevel <= MIN_ZOOM}
              className="p-1.5 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="줌 아웃"
            >
              <ZoomOut className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        )}

        {itemsWithLocation.length === 0 && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
            <MapPin className="w-12 h-12 text-slate-400" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">
                Day {selectedDay} 일정에 위치 정보가 없습니다.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                일정 추가 시 장소를 검색하면 맵에 표시됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

