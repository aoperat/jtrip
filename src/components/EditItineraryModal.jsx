import { useState, useEffect } from "react";
import { X, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import PlaceSearchInput from "./PlaceSearchInput";
import { uploadItineraryImage, captureImageFromCamera, selectImageFromAlbum } from "../lib/storage";
import { supabase } from "../lib/supabase";

export default function EditItineraryModal({
  item,
  travelDays,
  onClose,
  onUpdate,
  onDelete,
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl || null;

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
        // 이미지가 제거된 경우
        imageUrl = null;
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
    <div className="absolute inset-0 z-[210] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
      <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">
            일정 수정 📝
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
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

          {/* 사진 업로드 섹션 */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              사진 (선택)
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

          <div className="flex gap-3 pt-4">
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

