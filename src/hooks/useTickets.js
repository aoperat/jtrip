import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useTickets(travelId) {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchTickets();

    // Realtime 구독
    const subscription = supabase
      .channel(`tickets-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_types',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          console.log('티켓 타입 변경 감지:', payload);
          fetchTickets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        (payload) => {
          console.log('티켓 등록 변경 감지:', payload);
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [travelId]);

  const fetchTickets = async () => {
    if (!travelId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('ticket_types')
        .select(`
          *,
          registrations (
            *,
            user_id,
            uploaded_by
          )
        `)
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // 프로토타입 형식에 맞게 변환
      const transformed = data.map((type) => {
        const registrations = {};
        
        if (type.mode === 'group') {
          // 그룹 티켓: 첫 번째 등록을 'all'로
          const firstReg = type.registrations?.[0];
          if (firstReg) {
            registrations['all'] = {
              type: firstReg.type,
              code: firstReg.code,
              uploadedBy: firstReg.uploaded_by,
            };
          }
        } else {
          // 개별 티켓: 사용자별로 매핑
          type.registrations?.forEach((reg) => {
            registrations[reg.user_id] = {
              type: reg.type,
              code: reg.code,
              uploadedBy: reg.uploaded_by,
            };
          });
        }

        return {
          id: type.id,
          name: type.name,
          mode: type.mode,
          linkedItineraryId: type.linked_itinerary_id,
          registrations,
        };
      });

      setTicketTypes(transformed);
      setError(null);
    } catch (err) {
      console.error('티켓 목록 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTicketType = async (ticketData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: createError } = await supabase
        .from('ticket_types')
        .insert({
          travel_id: travelId,
          name: ticketData.name,
          mode: ticketData.mode,
          linked_itinerary_id: ticketData.linkedItineraryId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchTickets();
      return { data, error: null };
    } catch (err) {
      console.error('티켓 타입 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const createRegistration = async (ticketTypeId, registrationData, targetUserId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const userId = targetUserId || user.id;

      const { data, error: createError } = await supabase
        .from('registrations')
        .insert({
          ticket_type_id: ticketTypeId,
          user_id: userId,
          type: registrationData.type,
          code: registrationData.code,
          image_path: registrationData.imagePath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchTickets();
      return { data, error: null };
    } catch (err) {
      console.error('티켓 등록 실패:', err);
      return { data: null, error: err };
    }
  };

  const deleteRegistration = async (ticketTypeId, userId) => {
    try {
      const { error: deleteError } = await supabase
        .from('registrations')
        .delete()
        .eq('ticket_type_id', ticketTypeId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      await fetchTickets();
      return { error: null };
    } catch (err) {
      console.error('티켓 등록 삭제 실패:', err);
      return { error: err };
    }
  };

  return {
    ticketTypes,
    loading,
    error,
    createTicketType,
    createRegistration,
    deleteRegistration,
    refetch: fetchTickets,
  };
}

