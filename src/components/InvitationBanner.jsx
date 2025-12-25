import { useState, useEffect } from "react";
import { Mail, Check, X, ChevronRight, Loader2 } from "lucide-react";

export default function InvitationBanner({
  fetchMyInvitations,
  acceptInvitation,
  declineInvitation,
  addNotification,
  onAccepted,
}) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    const { data } = await fetchMyInvitations();
    setInvitations(data || []);
    setLoading(false);
  };

  const handleAccept = async (invitation) => {
    setProcessingId(invitation.id);
    const { error } = await acceptInvitation(invitation.id);
    if (error) {
      addNotification("초대 수락 실패: " + error.message);
    } else {
      addNotification(`${invitation.travels?.title} 여행에 참여했습니다!`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      onAccepted?.();
    }
    setProcessingId(null);
  };

  const handleDecline = async (invitation) => {
    if (!confirm("초대를 거절하시겠습니까?")) return;

    setProcessingId(invitation.id);
    const { error } = await declineInvitation(invitation.id);
    if (error) {
      addNotification("초대 거절 실패: " + error.message);
    } else {
      addNotification("초대를 거절했습니다.");
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    }
    setProcessingId(null);
  };

  if (loading) return null;
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 px-1">
        <Mail className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-bold text-slate-700">
          받은 초대 ({invitations.length})
        </span>
      </div>
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 shadow-sm"
        >
          <div className="flex items-start gap-3">
            {/* 여행 이미지 */}
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-500">
              {invitation.travels?.image_url ? (
                <img
                  src={invitation.travels.image_url}
                  alt={invitation.travels.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                  {invitation.travels?.title?.charAt(0) || "?"}
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 truncate">
                {invitation.travels?.title || "여행"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {invitation.travels?.start_date} ~ {invitation.travels?.end_date}
              </p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <span className="font-medium">
                  {invitation.inviter?.name ||
                    invitation.inviter?.email?.split("@")[0] ||
                    "누군가"}
                </span>
                님이 초대했습니다
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-2 flex-shrink-0">
              {processingId === invitation.id ? (
                <div className="w-9 h-9 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleDecline(invitation)}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    title="거절"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAccept(invitation)}
                    className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    title="수락"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
