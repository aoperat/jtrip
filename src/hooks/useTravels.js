import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

export function useTravels() {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTravels();

    // Realtime 구독 설정
    const subscription = supabase
      .channel("travels-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "travels",
        },
        (payload) => {
          logger.realtime("Travels 변경 감지", payload);
          fetchTravels();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTravels = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTravels([]);
        setLoading(false);
        return;
      }

      // 1단계: 자신이 참여한 여행의 ID 가져오기 (먼저 확인)
      const { data: participantRecords, error: participantError } =
        await supabase
          .from("travel_participants")
          .select("travel_id")
          .eq("user_id", user.id);

      if (participantError) {
        console.error("참여자 레코드 조회 실패:", participantError);
        throw participantError;
      }

      // 2단계: 참여한 모든 여행 ID 수집
      const allParticipantTravelIds = (participantRecords || []).map(
        (r) => r.travel_id
      );

      // 3단계: 참여한 여행 가져오기 (RLS 정책을 통과하기 위해 참여자 테이블을 통해 조회)
      let allTravels = [];
      if (allParticipantTravelIds.length > 0) {
        // 참여한 여행들을 가져오기
        const { data: participatedTravels, error: travelsError } =
          await supabase
            .from("travels")
            .select("*")
            .in("id", allParticipantTravelIds)
            .order("created_at", { ascending: false });

        if (travelsError) {
          console.error("여행 조회 실패:", travelsError);
          throw travelsError;
        }

        allTravels = participatedTravels || [];
      }

      // 4단계: 여행이 없으면 빈 배열 반환
      if (allTravels.length === 0) {
        setTravels([]);
        setError(null);
        setLoading(false);
        return;
      }

      const travelIds = allTravels.map((t) => t.id);

      // 5단계: 모든 여행의 참여자 가져오기
      // SECURITY DEFINER 함수를 사용하여 travels 정책을 통과한 여행의 참여자 목록 가져오기
      let allParticipants = [];
      if (travelIds.length > 0) {
        const { data: participants, error: participantsError } =
          await supabase.rpc("get_travel_participants", {
            travel_ids: travelIds,
          });

        if (participantsError) {
          console.error("참여자 조회 실패:", participantsError);
          // 함수가 없을 수 있으므로 폴백: 자신의 레코드만 조회
          const { data: myParticipants } = await supabase
            .from("travel_participants")
            .select("travel_id, user_id")
            .in("travel_id", travelIds)
            .eq("user_id", user.id);
          allParticipants = myParticipants || [];
        } else {
          allParticipants = participants || [];
        }
      }

      // 6단계: 모든 참여자의 user_id 수집
      const allUserIds = new Set();
      (allParticipants || []).forEach((tp) => {
        if (tp.user_id) allUserIds.add(tp.user_id);
      });

      // 7단계: profiles 정보 가져오기
      const profilesMap = new Map();
      if (allUserIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email, name, avatar_url")
          .in("id", Array.from(allUserIds));

        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // 8단계: 여행별 참여자 그룹화
      const participantsByTravel = new Map();
      (allParticipants || []).forEach((tp) => {
        if (!participantsByTravel.has(tp.travel_id)) {
          participantsByTravel.set(tp.travel_id, []);
        }
        participantsByTravel.get(tp.travel_id).push(tp.user_id);
      });

      // 9단계: 데이터 변환 (프로토타입 형식에 맞게)
      const transformedTravels = allTravels.map((travel) => {
        const participantUserIds = participantsByTravel.get(travel.id) || [];
        const participants = participantUserIds.map((userId) => {
          const profile = profilesMap.get(userId);
          if (profile) {
            const displayName =
              profile.name || profile.email?.split("@")[0] || "User";
            return {
              id: profile.id,
              name: displayName,
              image: profile.avatar_url || displayName.charAt(0).toUpperCase(),
            };
          }
          // 프로필이 없으면 user_id를 기반으로 기본 정보 생성
          const defaultName = userId?.substring(0, 8) || "User";
          return {
            id: userId,
            name: defaultName,
            image: defaultName.charAt(0).toUpperCase(),
          };
        });

        return {
          id: travel.id,
          title: travel.title,
          date: `${travel.start_date} - ${travel.end_date}`,
          image:
            travel.image_url ||
            "https://images.unsplash.com/photo-1540959733332-e94e270b4052?w=800&q=80",
          participants,
          start_date: travel.start_date,
          end_date: travel.end_date,
          created_at: travel.created_at,
          created_by: travel.created_by,
        };
      });

      setTravels(transformedTravels);
      setError(null);
    } catch (err) {
      console.error("여행 목록 가져오기 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTravel = async (travelData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { data, error: createError } = await supabase
        .from("travels")
        .insert({
          title: travelData.title,
          start_date: travelData.start_date,
          end_date: travelData.end_date,
          image_url: travelData.image_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // 생성자를 참여자로 추가
      await supabase.from("travel_participants").insert({
        travel_id: data.id,
        user_id: user.id,
      });

      await fetchTravels();
      return { data, error: null };
    } catch (err) {
      console.error("여행 생성 실패:", err);
      return { data: null, error: err };
    }
  };

  const updateTravel = async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from("travels")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchTravels();
      return { data, error: null };
    } catch (err) {
      console.error("여행 업데이트 실패:", err);
      return { data: null, error: err };
    }
  };

  const deleteTravel = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from("travels")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchTravels();
      return { error: null };
    } catch (err) {
      console.error("여행 삭제 실패:", err);
      return { error: err };
    }
  };

  // 샘플 데이터 삭제 (제목에 "도쿄 여행" 또는 "샘플"이 포함된 여행)
  const deleteSampleTravels = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // 샘플 여행 찾기 (제목에 "도쿄" 또는 "샘플"이 포함된 여행)
      const { data: sampleTravels, error: findError } = await supabase
        .from("travels")
        .select("id")
        .or("title.ilike.%도쿄%,title.ilike.%샘플%,title.ilike.%sample%");

      if (findError) throw findError;

      if (!sampleTravels || sampleTravels.length === 0) {
        return { deletedCount: 0, error: null };
      }

      const travelIds = sampleTravels.map((t) => t.id);

      // 관련 데이터 삭제 (CASCADE로 자동 삭제되지만 명시적으로 처리)
      // 1. travel_participants 삭제
      await supabase
        .from("travel_participants")
        .delete()
        .in("travel_id", travelIds);

      // 2. travels 삭제
      const { error: deleteError } = await supabase
        .from("travels")
        .delete()
        .in("id", travelIds);

      if (deleteError) throw deleteError;

      await fetchTravels();
      return { deletedCount: travelIds.length, error: null };
    } catch (err) {
      console.error("샘플 데이터 삭제 실패:", err);
      return { deletedCount: 0, error: err };
    }
  };

  // 초대장 생성 (기존 사용자/미가입 사용자 모두)
  const sendInvitation = async (travelId, email) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // 이미 초대가 있는지 확인
      const { data: existingInvite } = await supabase
        .from("travel_invitations")
        .select("id, status")
        .eq("travel_id", travelId)
        .eq("invitee_email", email)
        .maybeSingle();

      if (existingInvite) {
        if (existingInvite.status === "pending") {
          throw new Error("이미 초대가 발송된 이메일입니다.");
        }
        if (existingInvite.status === "accepted") {
          throw new Error("이미 참여 중인 사용자입니다.");
        }
      }

      // profiles 테이블에서 이메일로 사용자 찾기
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("email", email)
        .maybeSingle();

      const isRegisteredUser = !!profile;

      // 토큰 생성 (미가입 사용자를 위해)
      const token = btoa(`${travelId}:${email}:${Date.now()}`).replace(
        /[+/=]/g,
        ""
      );

      // 초대 레코드 생성
      const { data: invitation, error: inviteError } = await supabase
        .from("travel_invitations")
        .insert({
          travel_id: travelId,
          inviter_id: user.id,
          invitee_email: email,
          invitee_id: profile?.id || null,
          token: isRegisteredUser ? null : token,
          status: "pending",
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.code === "23505") {
          throw new Error("이미 초대된 사용자입니다.");
        }
        if (
          inviteError.code === "42P01" ||
          inviteError.message?.includes("does not exist")
        ) {
          throw new Error(
            "초대 기능을 사용하려면 데이터베이스 설정이 필요합니다. (travel_invitations 테이블)"
          );
        }
        throw inviteError;
      }

      if (isRegisteredUser) {
        return {
          error: null,
          type: "registered",
          message: `${profile.name || email}님에게 초대를 보냈습니다.`,
        };
      } else {
        const inviteUrl = `${window.location.origin}${
          import.meta.env.BASE_URL || "/"
        }?invite=${token}`;
        return {
          error: null,
          type: "unregistered",
          inviteUrl,
          message: "가입되지 않은 이메일입니다. 초대 링크를 공유해주세요.",
        };
      }
    } catch (err) {
      console.error("초대 실패:", err);
      return { error: err };
    }
  };

  // 내가 받은 초대 목록 가져오기
  const fetchMyInvitations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: [], error: null };

      // 내 프로필에서 이메일 가져오기
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      // 초대받은 사람(invitee)만 필터링 - 초대 보낸 사람(inviter)은 제외
      // invitee_id 또는 invitee_email로 필터링
      let query = supabase
        .from("travel_invitations")
        .select("*")
        .eq("status", "pending");

      if (profile?.email) {
        // invitee_id가 현재 사용자이거나 invitee_email이 현재 사용자 이메일인 경우
        query = query.or(
          `invitee_id.eq.${user.id},invitee_email.eq.${profile.email}`
        );
      } else {
        query = query.eq("invitee_id", user.id);
      }

      const { data: invitations, error } = await query.order("created_at", {
        ascending: false,
      });

      // 에러 처리 및 로깅
      if (error) {
        console.error("초대 목록 조회 오류:", error);
        // 테이블이 없거나 권한 문제 등
        if (
          error.code === "42P01" ||
          error.code?.startsWith("PGRST") ||
          error.message?.includes("does not exist") ||
          error.message?.includes("permission denied")
        ) {
          return { data: [], error: null };
        }
        throw error;
      }

      if (!invitations || invitations.length === 0) {
        return { data: [], error: null };
      }

      // 여행 정보 가져오기
      const travelIds = [...new Set(invitations.map((inv) => inv.travel_id))];
      const { data: travelsData } = await supabase
        .from("travels")
        .select("id, title, start_date, end_date, image_url")
        .in("id", travelIds);

      const travelsMap = new Map((travelsData || []).map((t) => [t.id, t]));

      // 초대자 프로필 가져오기
      const inviterIds = [...new Set(invitations.map((inv) => inv.inviter_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, name, avatar_url")
        .in("id", inviterIds);

      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      // 데이터 조합
      const invitationsWithData = invitations.map((inv) => ({
        ...inv,
        travels: travelsMap.get(inv.travel_id) || null,
        inviter: profilesMap.get(inv.inviter_id) || null,
      }));

      return { data: invitationsWithData, error: null };
    } catch (err) {
      console.error("초대 목록 가져오기 실패:", err);
      return { data: [], error: err };
    }
  };

  // 특정 여행의 초대 목록 가져오기
  const fetchTravelInvitations = async (travelId) => {
    try {
      const { data: invitations, error } = await supabase
        .from("travel_invitations")
        .select("*")
        .eq("travel_id", travelId)
        .order("created_at", { ascending: false });

      // 테이블이 없거나 에러가 있으면 빈 배열 반환
      if (error) {
        // 테이블이 없거나 권한 문제 등 - 조용히 빈 배열 반환
        if (
          error.code === "42P01" ||
          error.code?.startsWith("PGRST") ||
          error.message?.includes("does not exist") ||
          error.message?.includes("permission denied")
        ) {
          return { data: [], error: null };
        }
        throw error;
      }
      return { data: invitations || [], error: null };
    } catch (err) {
      console.error("여행 초대 목록 가져오기 실패:", err);
      return { data: [], error: err };
    }
  };

  // 초대 수락
  const acceptInvitation = async (invitationId) => {
    try {
      const { data, error } = await supabase.rpc("accept_travel_invitation", {
        invitation_id: invitationId,
      });

      if (error) throw error;

      await fetchTravels();
      return { error: null };
    } catch (err) {
      console.error("초대 수락 실패:", err);
      return { error: err };
    }
  };

  // 초대 거절
  const declineInvitation = async (invitationId) => {
    try {
      const { data, error } = await supabase.rpc("decline_travel_invitation", {
        invitation_id: invitationId,
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("초대 거절 실패:", err);
      return { error: err };
    }
  };

  // 초대 취소
  const cancelInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from("travel_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("초대 취소 실패:", err);
      return { error: err };
    }
  };

  // 참여자 제거
  const removeParticipant = async (travelId, userId) => {
    try {
      const { error } = await supabase
        .from("travel_participants")
        .delete()
        .eq("travel_id", travelId)
        .eq("user_id", userId);

      if (error) throw error;
      await fetchTravels();
      return { error: null };
    } catch (err) {
      console.error("참여자 제거 실패:", err);
      return { error: err };
    }
  };

  // 레거시 호환용 - 직접 추가 (기존 기능)
  const addParticipant = async (travelId, email) => {
    // 새로운 초대 시스템 사용
    return sendInvitation(travelId, email);
  };

  const createInviteLink = (travelId, email) => {
    const token = btoa(`${travelId}:${email}:${Date.now()}`).replace(
      /[+/=]/g,
      ""
    );
    const inviteUrl = `${window.location.origin}${
      import.meta.env.BASE_URL || "/"
    }?invite=${token}`;
    return inviteUrl;
  };

  return {
    travels,
    loading,
    error,
    createTravel,
    updateTravel,
    deleteTravel,
    deleteSampleTravels,
    addParticipant,
    createInviteLink,
    refetch: fetchTravels,
    // 새로운 초대 시스템
    sendInvitation,
    fetchMyInvitations,
    fetchTravelInvitations,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    removeParticipant,
  };
}
