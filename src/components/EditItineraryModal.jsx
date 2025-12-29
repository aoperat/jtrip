import { useState, useEffect, useRef } from "react";
import { X, Camera, Image as ImageIcon, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import PlaceSearchInput from "./PlaceSearchInput";
import { uploadItineraryImage, captureImageFromCamera, selectImageFromAlbum } from "../lib/storage";
import { supabase } from "../lib/supabase";

export default function EditItineraryModal({
  item,
  travelDays,
  onClose,
  onUpdate,
  onDelete,
  disableDayChange = false,
}) {
  const [formData, setFormData] = useState({
    day: item?.day || 1,
    time: item?.time || "",
    title: item?.title || "",
    description: item?.desc || "",
    locationName: item?.locationName || "",
    address: item?.address || "",
    latitude: item?.latitude || null,
    longitude: item?.longitude || null,
    imageUrl: item?.image || null,
    imagePositionX: item?.imagePositionX ?? 0,
    imagePositionY: item?.imagePositionY ?? 0,
    imageScale: item?.imageScale || 400,
  });
  const [locationData, setLocationData] = useState(
    item?.latitude && item?.longitude
      ? {
          locationName: item.locationName || "",
          address: item.address || "",
          latitude: item.latitude,
          longitude: item.longitude,
        }
      : null
  );
  const [imagePreview, setImagePreview] = useState(item?.image || null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardPreviewRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handlePlaceSelect = (data) => {
    setLocationData(data);
    setFormData((prev) => ({
      ...prev,
      locationName: data.locationName,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    }));
  };

  const handleImageSelect = async (fromCamera = false) => {
    try {
      const file = fromCamera 
        ? await captureImageFromCamera()
        : await selectImageFromAlbum();
      
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("이미지 선택 실패:", error);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData((prev) => ({
      ...prev,
      imageScale: 400,
      imagePositionX: 0,
      imagePositionY: 0,
    }));
  };

  // 확대/축소 핸들러 (픽셀 단위)
  const handleZoomIn = () => {
    setFormData((prev) => ({
      ...prev,
      imageScale: Math.min(2000, (prev.imageScale || 400) + 50),
    }));
  };

  const handleZoomOut = () => {
    setFormData((prev) => ({
      ...prev,
      imageScale: Math.max(200, (prev.imageScale || 400) - 50),
    }));
  };

  // 마우스 휠로 확대/축소 (픽셀 단위)
  const handleWheel = (e) => {
    if (!imagePreview) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -50 : 50;
    setFormData((prev) => ({
      ...prev,
      imageScale: Math.max(200, Math.min(2000, (prev.imageScale || 400) + delta)),
    }));
  };

  // 드래그 시작
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    if (cardPreviewRef.current) {
      const cardRect = cardPreviewRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      dragStartPos.current = {
        x: clientX - cardRect.left,
        y: clientY - cardRect.top,
      };
    }
  };

  // 드래그 중 (백분율 기반, 실제 카드 크기 기준)
  const handleDragMove = (e) => {
    if (!isDragging || !cardPreviewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const cardRect = cardPreviewRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // 카드 내부의 픽셀 좌표 계산
    const x = clientX - cardRect.left;
    const y = clientY - cardRect.top;
    
    // 실제 카드의 예상 크기 (일정 탭에서의 평균 크기)
    // 실제 카드는 p-6 컨테이너 안에 있고, 화면 너비에서 패딩을 뺀 값
    // 모바일: 약 360px, 데스크톱: 약 400-500px
    // 미리보기 카드 크기를 기준으로 백분율 계산
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    // 백분율로 저장 (0-100)
    const percentX = (x / cardWidth) * 100;
    const percentY = (y / cardHeight) * 100;
    
    // 실제 카드 크기를 기준으로 픽셀 값 계산
    // 실제 카드는 보통 400-500px 너비, 120-150px 높이 정도
    // 표준 크기: 450px 너비, 130px 높이를 기준으로 계산
    const standardWidth = 450;
    const standardHeight = 130;
    
    setFormData((prev) => ({
      ...prev,
      imagePositionX: Math.round((percentX / 100) * standardWidth),
      imagePositionY: Math.round((percentY / 100) * standardHeight),
    }));
  };

  // 드래그 종료
  const handleDragEnd = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl || item?.image || null;

      // 새 이미지 업로드
      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("로그인이 필요합니다.");
        
        const uploadResult = await uploadItineraryImage(imageFile, user.id);
        if (uploadResult.error) {
          throw uploadResult.error;
        }
        imageUrl = uploadResult.data.publicUrl;
      } else if (!imagePreview && item?.image) {
        // 이미지가 제거된 경우 (imagePreview가 null이고 기존 이미지가 있었던 경우)
        imageUrl = null;
      } else if (imagePreview && !imageFile && item?.image) {
        // 기존 이미지가 있고 새로 업로드하지 않은 경우 기존 이미지 URL 유지
        imageUrl = item.image;
      }

      const result = await onUpdate({
        day: parseInt(formData.day),
        time: formData.time || null,
        title: formData.title,
        description: formData.description || "",
        locationName: formData.locationName || null,
        address: formData.address || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
                        imageUrl: imageUrl,
        imagePositionX: formData.imagePositionX,
        imagePositionY: formData.imagePositionY,
        imageScale: formData.imageScale,
      });

      if (result.error) {
        alert("일정 수정 실패: " + result.error.message);
      } else {
        onClose();
      }
    } catch (error) {
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const result = await onDelete();
      if (result.error) {
        alert("일정 삭제 실패: " + result.error.message);
      } else {
        onClose();
      }
    } catch (error) {
      alert("오류가 발생했습니다: " + error.message);
    }
  };

  return (
    <div className="absolute inset-0 z-[210] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center md:justify-center animate-in fade-in duration-300">
      <div className="w-full md:w-auto md:min-w-[600px] md:max-w-4xl bg-white rounded-t-[40px] md:rounded-[32px] p-6 md:p-8 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto md:mx-4">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-black leading-tight tracking-tight">
            일정 수정
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="md:grid md:grid-cols-2 md:gap-8 space-y-4 md:space-y-0 mb-6">
          {/* 왼쪽 컬럼: 기본 정보 */}
          <div className="space-y-4">
            {!disableDayChange && (
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                  일차
                </label>
                <select
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: parseInt(e.target.value) })
                  }
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                >
                  {travelDays.map((dayInfo) => (
                    <option key={dayInfo.day} value={dayInfo.day}>
                      Day {dayInfo.day} ({dayInfo.dateString})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                시간 (선택)
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                제목
              </label>
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                autoFocus
                required
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="예: 인천공항 출발"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                설명 (선택)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="상세 설명을 입력하세요"
              />
            </div>
          </div>

          {/* 오른쪽 컬럼: 사진 및 장소 */}
          <div className="space-y-4">
            {/* 사진 업로드 섹션 */}
            <div className="border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 space-y-3">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              사진 (선택)
            </label>
            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-slate-900/70 backdrop-blur-sm text-white rounded-xl active:scale-90 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* 카드 미리보기 및 드래그로 위치 지정 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block ml-1 leading-none">
                      배경 이미지 위치
                    </label>
                    {/* 확대/축소 버튼 */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={formData.imageScale <= 50}
                        className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="축소"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-600 min-w-[4rem] text-center">
                        {formData.imageScale}px
                      </span>
                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={formData.imageScale >= 2000}
                        className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="확대"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* 실제 카드와 동일한 컨테이너 구조 - p-6 패딩 시뮬레이션 */}
                  <div className="-mx-2 px-2">
                    <div className="relative pl-8 flex items-start gap-3">
                    <div
                      ref={cardPreviewRef}
                      className="flex-1 p-4 rounded-3xl border border-slate-100 overflow-hidden flex gap-3 relative group cursor-move touch-none shadow-sm"
                      style={{
                        backgroundImage: imagePreview ? `url(${imagePreview})` : "none",
                        backgroundSize: `${formData.imageScale || 400}px`,
                        backgroundPosition: (() => {
                          // 저장된 픽셀 값을 백분율로 변환
                          const standardWidth = 450;
                          const standardHeight = 130;
                          const percentX = ((formData.imagePositionX || 0) / standardWidth) * 100;
                          const percentY = ((formData.imagePositionY || 0) / standardHeight) * 100;
                          return `${percentX}% ${percentY}%`;
                        })(),
                        touchAction: "none",
                      }}
                      onMouseDown={handleDragStart}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchStart={handleDragStart}
                      onTouchMove={handleDragMove}
                      onTouchEnd={handleDragEnd}
                      onTouchCancel={handleDragEnd}
                      onWheel={handleWheel}
                    >
                      {/* 오버레이 그라데이션 */}
                      {imagePreview && (
                        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-0" />
                      )}
                      
                      {/* 카드 내용 미리보기 - 실제 카드와 동일한 레이아웃 */}
                      <div className="flex-1 overflow-hidden relative z-10 pointer-events-none">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                            {formData.time || "10:00"}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm leading-tight text-white">
                          {formData.title || "일정 제목"}
                        </h3>
                        <p className="text-[11px] mt-0.5 leading-tight text-white/80">
                          {formData.description || "설명"}
                        </p>
                      </div>
                      
                      {/* 드래그 안내 */}
                      {!isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5">
                            <p className="text-[10px] text-white font-bold text-center">
                              👆 드래그: 위치 조절<br />
                              🖱️ 휠: 확대/축소
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2 ml-1 font-medium leading-none">
                    드래그로 위치 조절, 마우스 휠 또는 버튼으로 확대/축소
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleImageSelect(true)}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-[32px] group hover:bg-blue-50 transition-colors border-2 border-transparent active:border-blue-100 active:scale-95"
                >
                  <Camera className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600">
                    카메라
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleImageSelect(false)}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-[32px] group hover:bg-blue-50 transition-colors border-2 border-transparent active:border-blue-100 active:scale-95"
                >
                  <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600">
                    앨범
                  </span>
                </button>
              </div>
            )}
            </div>

            {/* 장소 정보 섹션 */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <p className="text-xs font-bold text-slate-600 mb-3">
                📍 장소 정보 (맵 표시용)
              </p>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                  장소 검색
                </label>
                <PlaceSearchInput
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="장소명을 입력하세요 (예: 인천국제공항, Tokyo Station)"
                  initialValue={locationData?.locationName || ""}
                />
              </div>

              {locationData && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 mb-2">
                    선택된 장소:
                  </p>
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    {locationData.locationName}
                  </p>
                  <p className="text-xs text-slate-600">{locationData.address}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    좌표: {locationData.latitude.toFixed(6)},{" "}
                    {locationData.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 섹션 - 두 컬럼 걸침 */}
          <div className="flex gap-3 pt-4 md:col-span-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 py-4 bg-red-50 text-red-600 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-400 text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "업로드 중..." : "수정하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

