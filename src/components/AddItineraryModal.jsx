import { useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
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
}) {
  const [locationData, setLocationData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
    } catch (error) {
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
      <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">
          일정 추가 📅
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              일차
            </label>
            <select
              name="day"
              required
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

