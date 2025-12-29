import {
  CheckSquare,
  Square,
  Check,
  Edit2,
  Trash2,
  Plus,
  Ticket,
  Info,
  DollarSign,
} from "lucide-react";
import LinkedBadge from "./LinkedBadge";

/**
 * 일정 카드 공통 컴포넌트
 * - 전체 뷰와 개별 날짜 뷰에서 동일하게 사용
 * - selectionMode, isSelected props로 선택 모드 지원
 */
export default function ItineraryCard({
  item,
  isChecked,
  isSelected = false,
  selectionMode = false,
  onToggleCheck,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  onAddSchedule, // 개별 뷰에서만 사용 (시간대별 일정 추가)
  linkedExpense,
  onNavigateToTickets,
  onNavigateToPreps,
  onNavigateToInfo,
  onNavigateToBudget,
}) {
  // 이미지 배경 위치 계산 (백분율 방식으로 통일)
  const getBackgroundStyle = () => {
    if (!item.image) return undefined;

    const standardWidth = 450;
    const standardHeight = 130;
    const percentX = ((item.imagePositionX ?? 0) / standardWidth) * 100;
    const percentY = ((item.imagePositionY ?? 0) / standardHeight) * 100;

    return {
      backgroundImage: `url(${item.image})`,
      backgroundSize: `${item.imageScale || 400}px`,
      backgroundPosition: `${percentX}% ${percentY}%`,
    };
  };

  // 카드 클래스 생성
  const getCardClassName = () => {
    let base =
      "flex-1 p-4 rounded-3xl border transition-all cursor-pointer active:scale-[0.98] flex gap-3 relative group overflow-hidden";

    // Border 및 ring 스타일
    if (isSelected) {
      base += " border-blue-500 ring-2 ring-blue-200";
    } else if (isChecked) {
      base += " opacity-40 border-slate-100";
    } else {
      base += " shadow-sm border-slate-100";
    }

    // 배경색 (이미지가 없을 때만)
    if (!item.image) {
      if (isSelected) {
        base += " bg-blue-50";
      } else if (isChecked) {
        base += " bg-slate-50";
      } else {
        base += " bg-white";
      }
    }

    return base;
  };

  // 텍스트 색상 클래스
  const getTimeClassName = () => {
    const baseClass = "text-[10px] font-bold uppercase tracking-widest";
    if (isChecked) {
      return `${baseClass} ${item.image ? "text-white/60" : "text-slate-300"}`;
    }
    return `${baseClass} ${item.image ? "text-white" : "text-blue-500"}`;
  };

  const getTitleClassName = () => {
    const baseClass = "font-bold text-sm leading-tight mt-1";
    if (isChecked) {
      return `${baseClass} ${item.image ? "text-white/70 line-through" : "text-slate-400 line-through"}`;
    }
    return `${baseClass} ${item.image ? "text-white" : "text-slate-800"}`;
  };

  const getDescClassName = () => {
    const baseClass = "text-[11px] mt-0.5 leading-tight";
    return `${baseClass} ${item.image ? "text-white/80" : "text-slate-400"}`;
  };

  // 배지 표시 여부
  const showBadges =
    !selectionMode &&
    (item.hasTicket || item.prepId || item.infoId || linkedExpense);

  return (
    <div className="relative pl-8 flex items-start gap-3 animate-in slide-in-from-bottom-2">
      {/* 체크박스 / 선택박스 */}
      {selectionMode ? (
        <button
          onClick={() => onSelect?.(item.id)}
          className={`absolute left-0 top-2 w-[24px] h-[24px] rounded-lg bg-white flex items-center justify-center z-10 transition-all border-2 ${
            isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300"
          }`}
        >
          {isSelected && (
            <Check className="w-5 h-5 text-white" strokeWidth={3} />
          )}
        </button>
      ) : (
        <button
          onClick={() => onToggleCheck?.(item.id)}
          className="absolute left-0 top-2 p-0.5 z-10 transition-all"
        >
          {isChecked ? (
            <CheckSquare className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
          ) : (
            <Square className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
          )}
        </button>
      )}

      {/* 카드 본체 */}
      <div
        onClick={() => {
          if (selectionMode) {
            onSelect?.(item.id);
          } else {
            onClick?.(item);
          }
        }}
        className={getCardClassName()}
        style={getBackgroundStyle()}
      >
        {/* 배경 이미지 오버레이 */}
        {item.image && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-[1] pointer-events-none" />
        )}

        {/* 액션 버튼들 */}
        {!selectionMode && (
          <div
            className="absolute top-2 right-2 flex gap-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {onAddSchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSchedule(item);
                }}
                className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-500 transition-colors"
                title="일정 추가"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(item);
              }}
              className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
              title="수정"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(item);
              }}
              className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden relative z-10">
          <span className={getTimeClassName()}>{item.time}</span>
          <h3 className={getTitleClassName()}>{item.title}</h3>
          {item.desc && <p className={getDescClassName()}>{item.desc}</p>}

          {/* 연결 배지 */}
          {showBadges && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.hasTicket && (
                <LinkedBadge
                  color="orange"
                  icon={Ticket}
                  label="TICKET"
                  onClick={() => onNavigateToTickets?.()}
                />
              )}
              {item.prepId && (
                <LinkedBadge
                  color="blue"
                  icon={CheckSquare}
                  label="PREP"
                  onClick={() => onNavigateToPreps?.()}
                />
              )}
              {item.infoId && (
                <LinkedBadge
                  color="slate"
                  icon={Info}
                  label="INFO"
                  onClick={() => onNavigateToInfo?.()}
                />
              )}
              {linkedExpense && (
                <LinkedBadge
                  color="green"
                  icon={DollarSign}
                  label={`₩${linkedExpense.amount.toLocaleString()}`}
                  onClick={() => onNavigateToBudget?.()}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
