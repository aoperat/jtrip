import {
  ChevronLeft,
  Edit2,
  Trash2,
  Megaphone,
  Info,
  Calendar,
  MoreVertical,
  Link as LinkIcon,
} from "lucide-react";

export default function InfoDetailModal({
  item,
  type,
  onClose,
  onEdit,
  onDelete,
  linkedItinerary,
}) {
  if (!item) return null;

  const isNotice = type === "notice";

  return (
    <div className="absolute inset-0 z-[200] bg-[#F8FAFC] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
      <header className="px-6 pt-12 pb-5 bg-white border-b border-slate-50 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {isNotice ? "공지사항" : "여행 정보"}
          </h2>
        </div>
        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Header Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            {isNotice ? (
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-orange-500" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-500" />
              </div>
            )}
            {!isNotice && item.category && (
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-black rounded-full uppercase tracking-widest">
                {item.category}
              </span>
            )}
          </div>

          {!isNotice && item.title && (
            <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
              {item.title}
            </h1>
          )}

          {/* 공지사항 내용 */}
          {isNotice && (
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
              <p className="text-[15px] text-slate-800 font-medium leading-relaxed mb-4">
                {item.content}
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-orange-200">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                  — {item.author || "작성자"}
                </span>
              </div>
            </div>
          )}

          {/* 정보 항목 내용 */}
          {!isNotice && item.content && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                {item.content}
              </p>
            </div>
          )}

          {/* 연동 일정 정보 (정보 항목만) */}
          {!isNotice && linkedItinerary && (
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
              <LinkIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">
                  Linked Itinerary
                </p>
                <p className="text-sm font-bold text-green-700">
                  {linkedItinerary.title}
                </p>
                {linkedItinerary.time && (
                  <p className="text-xs text-green-600 mt-1">
                    {linkedItinerary.time}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Actions */}
      <div className="absolute bottom-10 left-6 right-6 z-20">
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            수정
          </button>
          <button
            onClick={async () => {
              if (
                confirm(
                  `정말 이 ${isNotice ? "공지사항" : "정보"}을 삭제하시겠습니까?`
                )
              ) {
                const result = await onDelete();
                if (!result?.error) {
                  onClose();
                }
              }
            }}
            className="flex-1 py-4 bg-red-50 text-red-600 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-5 bg-slate-900 rounded-[32px] font-black text-white text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
        >
          Close Details
        </button>
      </div>
    </div>
  );
}

