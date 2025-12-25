import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export function usePreparations(travelId, currentUserId) {
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchPreparations();

    // Realtime 구독 - preparations 테이블
    const subscription1 = supabase
      .channel(`preparations-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preparations',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          logger.realtime('준비물 변경 감지', payload);
          fetchPreparations();
        }
      )
      .subscribe();

    // Realtime 구독 - preparation_checks 테이블 (Personal items 체크 상태)
    const subscription2 = supabase
      .channel(`preparation-checks-${travelId}-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preparation_checks',
        },
        (payload) => {
          logger.realtime('준비물 체크 상태 변경 감지', payload);
          fetchPreparations();
        }
      )
      .subscribe();

    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [travelId, currentUserId]);

  const fetchPreparations = async () => {
    if (!travelId || !currentUserId) return;

    try {
      setLoading(true);
      
      // Common items와 Personal items 분리해서 가져오기
      const { data: allPreps, error: fetchError } = await supabase
        .from('preparations')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Personal items는 본인 것만 필터링
      const personalPreps = allPreps.filter((prep) => 
        prep.type === 'personal' && prep.created_by === currentUserId
      );
      
      // Common items는 모두 표시
      const commonPreps = allPreps.filter((prep) => prep.type === 'common');

      // Personal items의 체크 상태 가져오기
      const personalPrepIds = personalPreps.map((p) => p.id);
      let personalChecks = {};
      if (personalPrepIds.length > 0) {
        const { data: checks, error: checksError } = await supabase
          .from('preparation_checks')
          .select('preparation_id, checked')
          .in('preparation_id', personalPrepIds)
          .eq('user_id', currentUserId);
        
        if (!checksError && checks) {
          checks.forEach((check) => {
            personalChecks[check.preparation_id] = check.checked;
          });
        }
      }

      // assigned_to 사용자 정보 가져오기 (Common items)
      const assignedUserIds = [...new Set(
        commonPreps
          .map((p) => p.assigned_to)
          .filter(Boolean)
      )];
      
      let assignedUsersMap = new Map();
      if (assignedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', assignedUserIds);
        
        if (profiles) {
          profiles.forEach((profile) => {
            assignedUsersMap.set(profile.id, profile.name || profile.email?.split('@')[0] || 'Unknown');
          });
        }
      }

      // 프로토타입 형식에 맞게 변환
      const transformed = [
        ...commonPreps.map((prep) => ({
          id: prep.id,
          content: prep.content,
          checked: prep.checked, // Common은 공유 체크 상태
          type: prep.type,
          linkedItineraryId: prep.linked_itinerary_id,
          assignedTo: prep.assigned_to,
          assignedToName: prep.assigned_to ? assignedUsersMap.get(prep.assigned_to) : null,
        })),
        ...personalPreps.map((prep) => ({
          id: prep.id,
          content: prep.content,
          checked: personalChecks[prep.id] || false, // Personal은 개인 체크 상태
          type: prep.type,
          linkedItineraryId: prep.linked_itinerary_id,
          assignedTo: null,
          assignedToName: null,
        })),
      ];

      setPreparations(transformed);
      setError(null);
    } catch (err) {
      console.error('준비물 목록 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPreparation = async (prepData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: createError } = await supabase
        .from('preparations')
        .insert({
          travel_id: travelId,
          content: prepData.content,
          checked: false,
          type: prepData.type,
          linked_itinerary_id: prepData.linkedItineraryId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchPreparations();
      return { data, error: null };
    } catch (err) {
      console.error('준비물 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const togglePreparation = async (id, checked) => {
    try {
      // 해당 준비물의 타입 확인
      const prep = preparations.find((p) => p.id === id);
      if (!prep) throw new Error('준비물을 찾을 수 없습니다.');

      if (prep.type === 'common') {
        // Common items: preparations 테이블의 checked 업데이트 (공유)
        const { data, error: updateError } = await supabase
          .from('preparations')
          .update({ checked })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
      } else {
        // Personal items: preparation_checks 테이블 사용 (개인별)
        const { data: existingCheck } = await supabase
          .from('preparation_checks')
          .select('id')
          .eq('preparation_id', id)
          .eq('user_id', currentUserId)
          .single();

        if (existingCheck) {
          // 업데이트
          const { error: updateError } = await supabase
            .from('preparation_checks')
            .update({ checked })
            .eq('id', existingCheck.id);

          if (updateError) throw updateError;
        } else {
          // 생성
          const { error: insertError } = await supabase
            .from('preparation_checks')
            .insert({
              preparation_id: id,
              user_id: currentUserId,
              checked,
            });

          if (insertError) throw insertError;
        }
      }

      await fetchPreparations();
      return { data: null, error: null };
    } catch (err) {
      console.error('준비물 체크 토글 실패:', err);
      return { data: null, error: err };
    }
  };

  const updatePreparation = async (id, prepData) => {
    try {
      const updateData = {
        content: prepData.content,
        type: prepData.type,
        linked_itinerary_id: prepData.linkedItineraryId || null,
      };

      // Common items인 경우 assigned_to도 업데이트
      if (prepData.type === 'common' && prepData.assignedTo !== undefined) {
        updateData.assigned_to = prepData.assignedTo || null;
      }

      const { data, error: updateError } = await supabase
        .from('preparations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchPreparations();
      return { data, error: null };
    } catch (err) {
      console.error('준비물 수정 실패:', err);
      return { data: null, error: err };
    }
  };

  const deletePreparation = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('preparations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchPreparations();
      return { error: null };
    } catch (err) {
      console.error('준비물 삭제 실패:', err);
      return { error: err };
    }
  };

  return {
    preparations,
    loading,
    error,
    createPreparation,
    updatePreparation,
    togglePreparation,
    deletePreparation,
    refetch: fetchPreparations,
  };
}

