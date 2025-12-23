import { useRef, useEffect, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

/**
 * Google Places Autocomplete를 사용한 장소 검색 입력 컴포넌트
 */
export default function PlaceSearchInput({ 
  onPlaceSelect, 
  placeholder = "장소를 검색하세요...",
  className = "",
  initialValue = ""
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);
  const [value, setValue] = useState(initialValue);
  const { error, isLoading, isReady } = useGoogleMaps();

  useEffect(() => {
    // Google Maps API가 준비되었는지 확인
    if (!isReady || !inputRef.current) {
      return;
    }

    // Autocomplete 초기화
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['establishment', 'geocode'], // 장소 및 주소 모두 검색
        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
        language: 'ko',
      }
    );

    autocompleteRef.current = autocomplete;

    // 장소 선택 이벤트 리스너
    const placeChangedListener = autocomplete.addListener('place_changed', () => {
      setIsSearching(true);
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        console.warn('선택한 장소에 위치 정보가 없습니다.');
        setIsSearching(false);
        return;
      }

      const locationData = {
        locationName: place.name || '',
        address: place.formatted_address || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        placeId: place.place_id || '',
      };

      setValue(place.name || place.formatted_address || '');
      
      if (onPlaceSelect) {
        onPlaceSelect(locationData);
      }
      
      setIsSearching(false);
    });

    return () => {
      if (placeChangedListener) {
        window.google.maps.event.removeListener(placeChangedListener);
      }
    };
  }, [isReady, onPlaceSelect]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={!isReady || isLoading}
          className={`w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600">
          <AlertCircle className="w-3 h-3" />
          <p className="text-[10px] font-medium leading-none">{error}</p>
        </div>
      )}
      {!error && (
        <p className="text-[10px] text-slate-300 mt-2 ml-1 font-medium leading-none">
          * 장소명을 입력하면 자동완성됩니다. 해외 장소도 검색 가능합니다.
        </p>
      )}
    </div>
  );
}

