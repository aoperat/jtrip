import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X, ZoomIn, ZoomOut } from "lucide-react";
import PlaceSearchInput from "./PlaceSearchInput";
import { uploadItineraryImage, captureImageFromCamera, selectImageFromAlbum } from "../lib/storage";
import { supabase } from "../lib/supabase";

export default function AddItineraryModal({
  selectedTripData,
  travelDays,
  createItineraryItem,
  addNotification,
  setShowAddItineraryModal,
  setSelectedDay,
  defaultTime,
  defaultDay,
  planGroupContext,
  onAddToPlanGroup,
}) {
  const [locationData, setLocationData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePositionX, setImagePositionX] = useState(0);
  const [imagePositionY, setImagePositionY] = useState(0);
  const [imageScale, setImageScale] = useState(400);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const cardPreviewRef = useRef(null);
  
  // 드래그 관련 상태 (모달 드래그용)
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const scrollStartY = useRef(0);

  const handlePlaceSelect = (data) => {
    setLocationData(data);
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
    setImagePositionX(0);
    setImagePositionY(0);
    setImageScale(400);
  };

  // 확대/축소 핸들러 (픽셀 단위)
  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(2000, prev + 50));
  };

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(200, prev - 50));
  };

  // 마우스 휠로 확대/축소 (픽셀 단위)
  const handleWheel = (e) => {
    if (!imagePreview) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -50 : 50;
    setImageScale((prev) => Math.max(200, Math.min(2000, prev + delta)));
  };

  // 이미지 위치 드래그 시작
  const handleImageDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  // 이미지 위치 드래그 중 (백분율 기반, 실제 카드 크기 기준)
  const handleImageDragMove = (e) => {
    if (!isDraggingImage || !cardPreviewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const cardRect = cardPreviewRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // 카드 내부의 픽셀 좌표 계산
    const x = clientX - cardRect.left;
    const y = clientY - cardRect.top;
    
    // 미리보기 카드 크기를 기준으로 백분율 계산
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    // 백분율로 계산 (0-100)
    const percentX = (x / cardWidth) * 100;
    const percentY = (y / cardHeight) * 100;
    
    // 실제 카드 크기를 기준으로 픽셀 값 계산
    // 표준 크기: 450px 너비, 130px 높이를 기준으로 계산
    const standardWidth = 450;
    const standardHeight = 130;
    
    setImagePositionX(Math.round((percentX / 100) * standardWidth));
    setImagePositionY(Math.round((percentY / 100) * standardHeight));
  };

  // 이미지 위치 드래그 종료
  const handleImageDragEnd = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDraggingImage(false);
  };

  // 드래그 시작
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 스크롤 가능한 경우 스크롤 위치 확인
    if (contentRef.current) {
      scrollStartY.current = contentRef.current.scrollTop;
    }
    
    setIsDragging(true);
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY;
    setDragY(0);
  };

  // 모달 콘텐츠 드래그 시작 (모바일 전체 드래그용)
  const handleContentDragStart = (e) => {
    // 스크롤이 최상단일 때만 드래그 시작
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      handleDragStart(e);
    }
  };

  // 드래그 중
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY.current;
    
    // 아래로 드래그하고 있고, 스크롤이 최상단이거나 드래그가 이미 시작된 경우에만 적용
    if (deltaY > 0) {
      // 스크롤이 있는 경우 드래그를 방지
      if (contentRef.current && contentRef.current.scrollTop > 0 && scrollStartY.current === 0) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setDragY(deltaY);
    }
  };

  // 드래그 종료
  const handleDragEnd = () => {
    if (!isDragging) return;
    
    // 일정 거리(100px) 이상 드래그하면 모달 닫기
    if (dragY > 100) {
      setShowAddItineraryModal(false);
      setLocationData(null);
      setImagePreview(null);
      setImageFile(null);
    }
    
    setIsDragging(false);
    setDragY(0);
  };

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowAddItineraryModal(false);
      setLocationData(null);
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const day = parseInt(formData.get("day"));
    const time = formData.get("time");
    const title = formData.get("title");
    const description = formData.get("description") || "";

    if (!day || !title) {
      alert("일차와 제목을 입력해주세요.");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = null;

      // 이미지 업로드
      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("로그인이 필요합니다.");
        
        const uploadResult = await uploadItineraryImage(imageFile, user.id);
        if (uploadResult.error) {
          throw uploadResult.error;
        }
        imageUrl = uploadResult.data.publicUrl;
      }

      // 플랜 그룹 컨텍스트가 있으면 플랜 그룹에 직접 추가
      if (planGroupContext && onAddToPlanGroup) {
        const variantItem = {
          title,
          time: time || '',
          image: imageUrl || null,
          imagePositionX: imageUrl ? imagePositionX : 0,
          imagePositionY: imageUrl ? imagePositionY : 0,
          imageScale: imageUrl ? imageScale : 400,
          desc: description || null,
          locationName: locationData?.locationName || null,
          address: locationData?.address || null,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
        };
        await onAddToPlanGroup(variantItem);
        addNotification("플랜 그룹에 일정이 추가되었습니다.");
        setShowAddItineraryModal(false);
        setLocationData(null);
        setImagePreview(null);
        setImageFile(null);
      } else {
        // 일반 일정으로 추가
        const result = await createItineraryItem({
          day,
          time: time || null,
          title,
          description,
          locationName: locationData?.locationName || null,
          address: locationData?.address || null,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          imageUrl: imageUrl,
          imagePositionX: imageUrl ? imagePositionX : 0,
          imagePositionY: imageUrl ? imagePositionY : 0,
          imageScale: imageUrl ? imageScale : 400,
        });

        if (result.error) {
          alert("일정 생성 실패: " + result.error.message);
        } else {
          addNotification("일정이 추가되었습니다.");
          setShowAddItineraryModal(false);
          setSelectedDay(day);
          setLocationData(null);
          setImagePreview(null);
          setImageFile(null);
        }
      }
    } catch (error) {
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="absolute inset-0 z-[210] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          touchAction: isDragging ? 'pan-y' : 'auto',
        }}
        onTouchStart={handleContentDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div 
          className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing drag-handle touch-none select-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        />
        <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">
          일정 추가 📅
        </h2>
        <form 
          ref={contentRef}
          onSubmit={handleSubmit} 
          className="space-y-4 mb-10"
          onTouchStart={(e) => {
            // 폼 내부에서 스크롤 가능하도록
            if (contentRef.current && contentRef.current.scrollTop > 0) {
              e.stopPropagation();
            }
          }}
        >
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              일차
            </label>
            <select
              name="day"
              required
              defaultValue={defaultDay || ""}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
            >
              <option value="">일차 선택</option>
              {travelDays.map((dayInfo) => (
                <option key={dayInfo.day} value={dayInfo.day}>
                  Day {dayInfo.day} ({dayInfo.dateString})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              시간 (선택)
            </label>
            <input
              name="time"
              type="time"
              defaultValue={defaultTime || ""}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              제목
            </label>
            <input
              name="title"
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
              name="description"
              rows={3}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="상세 설명을 입력하세요"
            />
          </div>

          {/* 사진 업로드 섹션 */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              사진 추가 (선택)
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
                        disabled={imageScale <= 200}
                        className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="축소"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-600 min-w-[4rem] text-center">
                        {imageScale}px
                      </span>
                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={imageScale >= 2000}
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
                        backgroundSize: `${imageScale}px`,
                        backgroundPosition: (() => {
                          // 저장된 픽셀 값을 백분율로 변환
                          const standardWidth = 450;
                          const standardHeight = 130;
                          const percentX = ((imagePositionX || 0) / standardWidth) * 100;
                          const percentY = ((imagePositionY || 0) / standardHeight) * 100;
                          return `${percentX}% ${percentY}%`;
                        })(),
                        touchAction: "none",
                      }}
                      onMouseDown={handleImageDragStart}
                      onMouseMove={handleImageDragMove}
                      onMouseUp={handleImageDragEnd}
                      onMouseLeave={handleImageDragEnd}
                      onTouchStart={handleImageDragStart}
                      onTouchMove={handleImageDragMove}
                      onTouchEnd={handleImageDragEnd}
                      onTouchCancel={handleImageDragEnd}
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
                            10:00
                          </span>
                        </div>
                        <h3 className="font-bold text-sm leading-tight text-white">
                          일정 제목
                        </h3>
                        <p className="text-[11px] mt-0.5 leading-tight text-white/80">
                          설명
                        </p>
                      </div>
                      
                      {/* 드래그 안내 */}
                      {!isDraggingImage && (
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

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <p className="text-xs font-bold text-slate-600 mb-3">📍 장소 정보 (맵 표시용)</p>
            
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                장소 검색
              </label>
              <PlaceSearchInput
                onPlaceSelect={handlePlaceSelect}
                placeholder="장소명을 입력하세요 (예: 인천국제공항, Tokyo Station)"
              />
            </div>

            {locationData && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 mb-2">선택된 장소:</p>
                <p className="text-sm font-bold text-slate-800 mb-1">{locationData.locationName}</p>
                <p className="text-xs text-slate-600">{locationData.address}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  좌표: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddItineraryModal(false);
                setLocationData(null);
              }}
              className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-400 text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "업로드 중..." : "추가하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

