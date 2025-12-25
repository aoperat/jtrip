import { useState } from 'react';

const CreateNoticeModal = ({ 
  onClose, 
  onCreate,
  onUpdate,
  initialData
}) => {
  const [content, setContent] = useState(initialData?.content || '');
  const isEditMode = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('공지사항 내용을 입력해주세요.');
      return;
    }

    try {
      if (isEditMode && onUpdate) {
        await onUpdate(initialData.id, content.trim());
      } else if (onCreate) {
        await onCreate({ content: content.trim() });
      }
      
      onClose();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="absolute inset-0 z-[210] bg-slate-900/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
      <div className="w-full bg-white rounded-t-[40px] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        <h2 className="text-xl font-black mb-6 text-center leading-tight tracking-tight">
          {isEditMode ? '공지사항 수정 📢' : '공지사항 등록 📢'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block ml-1 leading-none">
              공지사항 내용
            </label>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="공지사항 내용을 입력하세요..."
              rows={6}
              required
            />
          </div>
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
            {isEditMode ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNoticeModal;

