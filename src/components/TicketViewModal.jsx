import { useState, useEffect } from 'react';
import { X, QrCode, Barcode, ExternalLink, Trash2, Sun, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TicketViewModal({
  ticket,
  ticketType,
  onClose,
  onDelete,
}) {
  const [brightness, setBrightness] = useState(100);
  const [imageUrl, setImageUrl] = useState(null);
  const [wakeLock, setWakeLock] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 이미지 URL 가져오기
  useEffect(() => {
    if (ticket?.imagePath) {
      const { data } = supabase.storage
        .from('tickets')
        .getPublicUrl(ticket.imagePath);
      setImageUrl(data.publicUrl);
    }
  }, [ticket?.imagePath]);

  // 화면 꺼짐 방지 (WakeLock API)
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch (err) {
        // WakeLock 미지원 또는 실패 - 조용히 무시
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  if (!ticket) return null;

  const handleDelete = async () => {
    if (confirm('이 티켓 등록을 삭제하시겠습니까?')) {
      setIsDeleting(true);
      try {
        await onDelete();
        onClose();
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  const isUrl = ticket.type === 'URL';

  return (
    <div
      className="absolute inset-0 z-[200] bg-white flex flex-col"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* 헤더 */}
      <header className="px-6 pt-12 pb-5 bg-white flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">
            {isUrl ? 'Web Link' : 'Ready to Scan'}
          </span>
        </div>
        <div className="w-12" />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 pb-40">
        <h2 className="text-2xl font-black text-slate-900 mb-10 text-center">
          {ticketType?.name}
        </h2>

        {/* 티켓 카드 */}
        <div className="bg-white p-8 rounded-[50px] border-[6px] border-slate-900 shadow-2xl w-full max-w-[320px] flex flex-col items-center gap-6">
          {isUrl ? (
            // URL 타입
            <a
              href={ticket.code}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-4 text-blue-600 group"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <ExternalLink className="w-12 h-12" />
              </div>
              <span className="font-bold text-sm underline">링크 열기</span>
            </a>
          ) : imageUrl ? (
            // 이미지가 있는 경우
            <div className="w-full">
              <img
                src={imageUrl}
                alt="티켓 이미지"
                className="w-full max-h-64 object-contain rounded-2xl"
              />
            </div>
          ) : (
            // QR/Barcode 아이콘
            <div className="py-8">
              {ticket.type === 'QR' ? (
                <QrCode className="w-48 h-48 text-slate-900" strokeWidth={1} />
              ) : (
                <Barcode className="w-48 h-28 text-slate-900" strokeWidth={1} />
              )}
            </div>
          )}

          {/* 코드 표시 */}
          {ticket.code && !isUrl && (
            <div className="w-full pt-6 border-t-4 border-dashed border-slate-100 text-center">
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-2">
                Voucher Number
              </p>
              <p className="text-lg font-mono font-black text-slate-900 break-all">
                {ticket.code}
              </p>
            </div>
          )}
        </div>

        {/* 밝기 조절 */}
        <div className="mt-10 w-full max-w-[320px] flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
          <Sun className="w-5 h-5 text-slate-400" />
          <input
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-sm text-slate-500 font-bold w-12 text-right">{brightness}%</span>
        </div>
      </main>

      {/* 하단 액션 버튼 */}
      <div className="absolute bottom-8 left-6 right-6 flex gap-3">
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-4 bg-red-50 text-red-600 rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-[2] py-4 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
