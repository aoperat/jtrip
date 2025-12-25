import { 
  X, 
  MapPin, 
  Clock, 
  FileText, 
  Calendar, 
  Edit2, 
  Trash2, 
  Navigation,
  ChevronRight,
  ChevronLeft,
  Ticket,
  CheckSquare,
  DollarSign,
  Info,
  MoreVertical,
} from "lucide-react";

export default function ItineraryDetailModal({
  item,
  trip,
  onClose,
  onToggleCheck,
  onEdit,
  onDelete,
  onNavigate,
  onViewTicket,
  isChecked,
  onCreateTicket,
  onCreatePrep,
  onCreateExpense,
  onCreateInfo,
}) {
  if (!item) return null;

  // Linked 정보 찾기
  const linkedTicket = trip?.ticketTypes?.find(
    (t) => t.linkedItineraryId === item.id
  );
  const linkedPrep = trip?.preparations?.find(
    (p) => p.linkedItineraryId === item.id
  );
  const linkedInfo = trip?.sharedInfo?.find(
    (i) => i.linkedItineraryId === item.id
  );
  const linkedExpense = trip?.expenses?.find(
    (ex) => ex.linkedItineraryId === item.id
  );

  // 길 찾기 기능
  const handleNavigation = () => {
    if (item.latitude && item.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
      window.open(url, '_blank');
    } else if (item.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`;
      window.open(url, '_blank');
    }
  };

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
            장소 상세 정보
          </h2>
        </div>
        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Header Image */}
        {item.image && (
          <div className="relative h-64 -mx-6 -mt-6 mb-6 overflow-hidden bg-slate-100">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
          </div>
        )}

        {/* Header Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            {item.time && (
              <span className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-full uppercase tracking-widest shadow-md shadow-blue-100">
                {item.time}
              </span>
            )}
            {trip?.participants && (
              <div className="flex -space-x-2">
                {trip.participants.map((p, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold"
                    title={p.name}
                  >
                    {typeof p.image === 'string' && p.image.startsWith('http') ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      p.image || p.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
            {item.title}
          </h1>
          {item.desc && (
            <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
              {item.desc}
            </p>
          )}
          
          {/* 장소 정보 */}
          {(item.locationName || item.address) && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
              <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {item.locationName && (
                  <p className="text-sm font-bold text-green-700 mb-1">
                    {item.locationName}
                  </p>
                )}
                {item.address && (
                  <p className="text-xs text-green-600 leading-relaxed">
                    {item.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 길 찾기 버튼 */}
          {(item.latitude || item.address) && (
            <button
              onClick={handleNavigation}
              className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest pt-2 group"
            >
              <Navigation className="w-4 h-4 group-hover:animate-bounce" /> 길 찾기 시작
            </button>
          )}
        </section>

        {/* Linked Data Section */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 leading-none">
            Linked Information
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {/* Ticket Card */}
            {linkedTicket ? (
              <div
                onClick={() => onViewTicket && onViewTicket(linkedTicket)}
                className="bg-orange-50 border border-orange-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-0.5">
                    Quick-Pass Linked
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    {linkedTicket.name}
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-200" />
              </div>
            ) : (
              <EmptyLink
                icon={Ticket}
                label="티켓 연결하기"
                color="orange"
                onClick={onCreateTicket}
              />
            )}

            {/* Prep Card */}
            {linkedPrep ? (
              <div
                onClick={() => onNavigate && onNavigate("preps")}
                className="bg-blue-50 border border-blue-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">
                    Preparation
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    {linkedPrep.content}
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-200" />
              </div>
            ) : (
              <EmptyLink
                icon={CheckSquare}
                label="준비물 연결하기"
                color="blue"
                onClick={onCreatePrep}
              />
            )}

            {/* Expense Card */}
            {linkedExpense ? (
              <div
                onClick={() => onNavigate && onNavigate("budget")}
                className="bg-green-50 border border-green-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-0.5">
                    Budget Spent
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    ₩{linkedExpense.amount?.toLocaleString()} ({linkedExpense.title})
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-green-200" />
              </div>
            ) : (
              <EmptyLink
                icon={DollarSign}
                label="지출 내역 기록"
                color="green"
                onClick={onCreateExpense}
              />
            )}

            {/* Info Card */}
            {linkedInfo ? (
              <div
                onClick={() => onNavigate && onNavigate("info")}
                className="bg-slate-100 border border-slate-200 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <Info className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Travel Info Tip
                  </p>
                  <h4 className="font-black text-slate-800 text-sm">
                    {linkedInfo.title}
                  </h4>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ) : (
              <EmptyLink
                icon={Info}
                label="여행 팁 추가하기"
                color="slate"
                onClick={onCreateInfo}
              />
            )}
          </div>
        </section>
      </main>

      <div className="absolute bottom-10 left-6 right-6 z-20">
        <div className="flex gap-3 mb-3">
          <button
            onClick={onToggleCheck}
            className={`flex-1 py-4 rounded-[32px] font-black text-xs uppercase tracking-widest transition-all ${
              isChecked
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {isChecked ? "완료 취소" : "완료 처리"}
          </button>
          <button
            onClick={() => {
              onEdit();
            }}
            className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            수정
          </button>
          <button
            onClick={async () => {
              if (confirm("정말 이 일정을 삭제하시겠습니까?")) {
                const result = await onDelete();
                if (!result.error) {
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

// EmptyLink 컴포넌트
const EmptyLink = ({ icon: Icon, label, color, onClick }) => {
  const colors = {
    orange: "text-orange-200 border-orange-100 bg-orange-50/20",
    blue: "text-blue-200 border-blue-100 bg-blue-50/20",
    green: "text-green-200 border-green-100 bg-green-50/20",
    slate: "text-slate-200 border-slate-200 bg-slate-50/20",
  };
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-[28px] border-2 border-dashed flex items-center justify-center gap-3 transition-all ${
        onClick
          ? "cursor-pointer hover:opacity-100 hover:scale-105 active:scale-95 opacity-60"
          : "opacity-60"
      } ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

