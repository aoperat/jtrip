import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Mail,
  Check,
  Clock,
  Trash2,
  Copy,
  Link as LinkIcon,
  Users,
  Crown,
  Loader2,
} from "lucide-react";

export default function MemberManagementModal({
  travel,
  currentUserId,
  onClose,
  sendInvitation,
  fetchTravelInvitations,
  cancelInvitation,
  removeParticipant,
  addNotification,
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [inviteResult, setInviteResult] = useState(null);
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'pending'

  useEffect(() => {
    loadInvitations();
  }, [travel.id]);

  const loadInvitations = async () => {
    const { data } = await fetchTravelInvitations(travel.id);
    setInvitations(data.filter((inv) => inv.status === "pending"));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setInviteResult(null);

    const result = await sendInvitation(travel.id, email.trim());

    if (result.error) {
      addNotification(result.error.message || "초대 실패");
      setInviteResult({ type: "error", message: result.error.message });
    } else {
      setInviteResult(result);
      if (result.type === "registered") {
        addNotification(result.message);
        setEmail("");
        loadInvitations();
      }
    }

    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (inviteResult?.inviteUrl) {
      await navigator.clipboard.writeText(inviteResult.inviteUrl);
      addNotification("초대 링크가 복사되었습니다!");
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (confirm("초대를 취소하시겠습니까?")) {
      const { error } = await cancelInvitation(invitationId);
      if (error) {
        addNotification("초대 취소 실패");
      } else {
        addNotification("초대가 취소되었습니다.");
        loadInvitations();
      }
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (confirm(`${memberName}님을 여행에서 제거하시겠습니까?`)) {
      const { error } = await removeParticipant(travel.id, userId);
      if (error) {
        addNotification("멤버 제거 실패");
      } else {
        addNotification("멤버가 제거되었습니다.");
      }
    }
  };

  const isOwner = travel.created_by === currentUserId;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-[32px] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">멤버 관리</h3>
                <p className="text-xs text-slate-400">{travel.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "members"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              멤버 ({travel.participants?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              대기중 ({invitations.length})
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "members" ? (
            <div className="space-y-3">
              {travel.participants?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    {typeof member.image === "string" &&
                    member.image.startsWith("http") ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.image || member.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {member.name}
                        </span>
                        {member.id === travel.created_by && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                        {member.id === currentUserId && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                            나
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwner &&
                    member.id !== currentUserId &&
                    member.id !== travel.created_by && (
                      <button
                        onClick={() =>
                          handleRemoveMember(member.id, member.name)
                        }
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">대기 중인 초대가 없습니다</p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 text-sm">
                          {invitation.invitee_email}
                        </span>
                        <p className="text-[10px] text-amber-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          초대 대기중
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 초대 폼 */}
        <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50">
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setInviteResult(null);
                  }}
                  placeholder="이메일 주소 입력"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    초대
                  </>
                )}
              </button>
            </div>

            {/* 초대 결과 */}
            {inviteResult && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  inviteResult.type === "error"
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : inviteResult.type === "registered"
                    ? "bg-green-50 text-green-600 border border-green-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}
              >
                {inviteResult.type === "unregistered" ? (
                  <div className="space-y-2">
                    <p className="font-medium">{inviteResult.message}</p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-200">
                      <LinkIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs truncate flex-1 text-slate-600">
                        {inviteResult.inviteUrl}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {inviteResult.type === "registered" && (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{inviteResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
