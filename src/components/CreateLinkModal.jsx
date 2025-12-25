import { useState, useEffect } from 'react';
import { Link as LinkIcon } from 'lucide-react';

const CreateLinkModal = ({ 
  title, 
  placeholder, 
  onClose, 
  isPrep, 
  isInfo, 
  isExpense,
  travelId,
  itinerary,
  participants,
  onCreate,
  onUpdate,
  initialData,
  defaultLinkedItineraryId
}) => {
  const [name, setName] = useState(initialData?.title || initialData?.name || initialData?.content || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [prepType, setPrepType] = useState(initialData?.type || 'common');
  const [assignedTo, setAssignedTo] = useState(initialData?.assignedTo || '');
  const [category, setCategory] = useState(initialData?.category || 'Tip');
  const [ticketMode, setTicketMode] = useState(initialData?.mode || 'individual');
  const [linkedItineraryId, setLinkedItineraryId] = useState(initialData?.linkedItineraryId || defaultLinkedItineraryId || '');
  const [itineraryOptions, setItineraryOptions] = useState([]);
  const isEditMode = !!initialData;

  useEffect(() => {
    // 일정 옵션 생성
    if (itinerary) {
      const options = [];
      Object.keys(itinerary).forEach(day => {
        itinerary[day].forEach(item => {
          options.push({
            value: item.id,
            label: `Day ${day}: ${item.title}`,
            day: parseInt(day)
          });
        });
      });
      setItineraryOptions(options);
    }
  }, [itinerary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (isExpense && !amount) {
      alert('금액을 입력해주세요.');
      return;
    }

    try {
      let data = {};
      
      if (isExpense) {
        data = {
          title: name,
          amount: parseInt(amount) || 0,
          category: category || 'Other',
          linkedItineraryId: linkedItineraryId || null,
        };
      } else if (isPrep) {
        data = {
          content: name,
          type: prepType,
          linkedItineraryId: linkedItineraryId || null,
          assignedTo: prepType === 'common' ? (assignedTo || null) : null,
        };
      } else if (isInfo) {
        data = {
          title: name,
          content: content || name, // 내용이 없으면 제목 사용
          category: category,
          linkedItineraryId: linkedItineraryId || null,
        };
      } else {
        // Ticket
        data = {
          name: name,
          mode: ticketMode, // 선택된 모드 사용
          linkedItineraryId: linkedItineraryId || null,
        };
      }

      if (isEditMode && onUpdate) {
        await onUpdate(initialData.id, data);
      } else if (onCreate) {
        await onCreate(data);
      }
      
      onClose();
    } catch (error) {
      console.error('생성 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="absolute inset-0 z-[210] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
      <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              기본 정보
            </label>
            {isExpense ? (
              <div className="flex gap-2">
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-[2] bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm" 
                  placeholder={placeholder}
                  required
                />
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm" 
                  placeholder="금액"
                  required
                  min="0"
                />
              </div>
            ) : isInfo ? (
              <div className="space-y-3">
                <input 
                  autoFocus 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm" 
                  placeholder={placeholder}
                  required
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="정보 내용을 입력하세요..."
                  rows={4}
                  required
                />
              </div>
            ) : (
              <input 
                autoFocus 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder={placeholder}
                required
              />
            )}
          </div>
          
          {isPrep && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setPrepType('common')}
                  className={`py-4 rounded-2xl font-bold text-xs border uppercase tracking-widest tracking-tighter leading-none transition-all ${
                    prepType === 'common'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}
                >
                  Common
                </button>
                <button 
                  type="button"
                  onClick={() => setPrepType('personal')}
                  className={`py-4 rounded-2xl font-bold text-xs border uppercase tracking-widest tracking-tighter leading-none transition-all ${
                    prepType === 'personal'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}
                >
                  Personal
                </button>
              </div>
              
              {prepType === 'common' && participants && participants.length > 0 && (
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                    담당자 (선택사항)
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">담당자 미지정</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.email?.split('@')[0] || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {!isPrep && !isInfo && !isExpense && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                티켓 타입
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setTicketMode('individual')}
                  className={`py-4 rounded-2xl font-bold text-xs border uppercase tracking-widest tracking-tighter leading-none transition-all ${
                    ticketMode === 'individual'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}
                >
                  개별
                </button>
                <button 
                  type="button"
                  onClick={() => setTicketMode('group')}
                  className={`py-4 rounded-2xl font-bold text-xs border uppercase tracking-widest tracking-tighter leading-none transition-all ${
                    ticketMode === 'group'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}
                >
                  공통
                </button>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 ml-1 font-medium leading-none">
                * 개별: 각 참여자가 따로 등록 / 공통: 한 번만 등록
              </p>
            </div>
          )}

          {isInfo && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                카테고리
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
              >
                <option value="Tip">Tip</option>
                <option value="Info">Info</option>
                <option value="Warning">Warning</option>
                <option value="Note">Note</option>
              </select>
            </div>
          )}

          {itineraryOptions.length > 0 && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
                일정 연동 (Itinerary Link)
              </label>
              <div className="relative">
                <select 
                  value={linkedItineraryId}
                  onChange={(e) => setLinkedItineraryId(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                >
                  <option value="">연동하지 않음</option>
                  {itineraryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <LinkIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-300 mt-2 ml-1 font-medium leading-none">
                * 일정을 연동하면 해당 장소 카드에서 내용을 바로 확인할 수 있습니다.
              </p>
            </div>
          )}
        </form>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-400 text-sm"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all"
          >
            {isEditMode ? '수정하기' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLinkModal;

