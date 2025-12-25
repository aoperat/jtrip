import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export function useItinerary(travelId) {
  const [itinerary, setItinerary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchItinerary();

    // Realtime 구독
    const subscription = supabase
      .channel(`itinerary-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          logger.realtime('일정 변경 감지', payload);
          fetchItinerary();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [travelId]);

  const fetchItinerary = async () => {
    if (!travelId) return;

    try {
      setLoading(true);

      // 1. itinerary 데이터 조회
      const { data: itineraryData, error: fetchError } = await supabase
        .from('itinerary')
        .select('*')
        .eq('travel_id', travelId)
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (fetchError) throw fetchError;

      // 2. 연결된 데이터들을 병렬로 조회
      const itineraryIds = itineraryData.map(item => item.id);

      let ticketMap = new Map();
      let prepMap = new Map();
      let infoMap = new Map();
      let expenseMap = new Map();

      if (itineraryIds.length > 0) {
        const [ticketResult, prepResult, infoResult, expenseResult] = await Promise.all([
          supabase
            .from('ticket_types')
            .select('id, linked_itinerary_id')
            .eq('travel_id', travelId)
            .in('linked_itinerary_id', itineraryIds),
          supabase
            .from('preparations')
            .select('id, linked_itinerary_id')
            .eq('travel_id', travelId)
            .in('linked_itinerary_id', itineraryIds),
          supabase
            .from('shared_info')
            .select('id, linked_itinerary_id')
            .eq('travel_id', travelId)
            .in('linked_itinerary_id', itineraryIds),
          supabase
            .from('expenses')
            .select('id, linked_itinerary_id')
            .eq('travel_id', travelId)
            .in('linked_itinerary_id', itineraryIds),
        ]);

        // 3. linked_itinerary_id를 키로 하는 Map 생성
        (ticketResult.data || []).forEach(t => ticketMap.set(t.linked_itinerary_id, t.id));
        (prepResult.data || []).forEach(p => prepMap.set(p.linked_itinerary_id, p.id));
        (infoResult.data || []).forEach(i => infoMap.set(i.linked_itinerary_id, i.id));
        (expenseResult.data || []).forEach(e => expenseMap.set(e.linked_itinerary_id, e.id));
      }

      // 4. 일차별로 그룹화하면서 연결 정보 포함
      const grouped = {};
      itineraryData.forEach((item) => {
        if (!grouped[item.day]) {
          grouped[item.day] = [];
        }
        grouped[item.day].push({
          id: item.id,
          time: item.time || '',
          title: item.title,
          desc: item.description || '',
          locationName: item.location_name || null,
          address: item.address || null,
          latitude: item.latitude || null,
          longitude: item.longitude || null,
          image: item.image_url || null,
          imagePositionX: item.image_position_x ?? 0,
          imagePositionY: item.image_position_y ?? 0,
          imageScale: item.image_scale || 400,
          is_checked: item.is_checked,
          hasTicket: ticketMap.has(item.id),
          prepId: prepMap.get(item.id) || null,
          infoId: infoMap.get(item.id) || null,
          expenseId: expenseMap.get(item.id) || null,
        });
      });

      setItinerary(grouped);
      setError(null);
    } catch (err) {
      logger.error('일정 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createItineraryItem = async (itemData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: createError } = await supabase
        .from('itinerary')
        .insert({
          travel_id: travelId,
          day: itemData.day,
          time: itemData.time,
          title: itemData.title,
          description: itemData.description,
          location_name: itemData.locationName || null,
          address: itemData.address || null,
          latitude: itemData.latitude || null,
          longitude: itemData.longitude || null,
          image_url: itemData.imageUrl || null,
          image_position_x: itemData.imagePositionX ?? 0,
          image_position_y: itemData.imagePositionY ?? 0,
          image_scale: itemData.imageScale || 400,
          is_checked: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchItinerary();
      return { data, error: null };
    } catch (err) {
      logger.error('일정 항목 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const updateItineraryItem = async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('itinerary')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchItinerary();
      return { data, error: null };
    } catch (err) {
      logger.error('일정 항목 업데이트 실패:', err);
      return { data: null, error: err };
    }
  };

  const deleteItineraryItem = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('itinerary')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchItinerary();
      return { error: null };
    } catch (err) {
      logger.error('일정 항목 삭제 실패:', err);
      return { error: err };
    }
  };

  const toggleCheck = async (id, isChecked) => {
    return updateItineraryItem(id, { is_checked: isChecked });
  };

  return {
    itinerary,
    loading,
    error,
    createItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    toggleCheck,
    refetch: fetchItinerary,
  };
}

