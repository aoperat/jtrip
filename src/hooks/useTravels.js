import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
          console.log("Travels 변경 감지:", payload);
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

  const addParticipant = async (travelId, email) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // profiles 테이블에서 이메일로 사용자 찾기
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      // 사용자가 존재하는 경우
      if (profiles && !profileError) {
        // 참여자 추가
        const { error: addError } = await supabase
          .from("travel_participants")
          .insert({
            travel_id: travelId,
            user_id: profiles.id,
          });

        if (addError) {
          if (addError.code === "23505") {
            throw new Error("이미 참여 중인 사용자입니다.");
          }
          throw addError;
        }

        await fetchTravels();
        return { error: null, type: "user" }; // 사용자 초대 성공
      }

      // 사용자가 없는 경우 - 초대 링크 생성
      return { error: null, type: "invite_link", email };
    } catch (err) {
      console.error("참여자 추가 실패:", err);
      return { error: err };
    }
  };

  const createInviteLink = (travelId, email) => {
    // 간단한 토큰 생성 (실제로는 더 안전한 방법 사용 권장)
    const token = btoa(`${travelId}:${email}:${Date.now()}`).replace(
      /[+/=]/g,
      ""
    );
    const inviteUrl = `${
      window.location.origin
    }/invite?token=${token}&travel=${travelId}&email=${encodeURIComponent(
      email
    )}`;
    return inviteUrl;
  };

  return {
    travels,
    loading,
    error,
    createTravel,
    updateTravel,
    deleteTravel,
    addParticipant,
    createInviteLink,
    refetch: fetchTravels,
  };
}
