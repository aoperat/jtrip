import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
          console.log('일정 변경 감지:', payload);
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
      const { data, error: fetchError } = await supabase
        .from('itinerary')
        .select('*')
        .eq('travel_id', travelId)
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (fetchError) throw fetchError;

      // 일차별로 그룹화
      const grouped = {};
      data.forEach((item) => {
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
          is_checked: item.is_checked,
          hasTicket: false, // 나중에 ticket_types와 조인하여 설정
          prepId: null, // 나중에 preparations와 조인하여 설정
          infoId: null, // 나중에 shared_info와 조인하여 설정
          expenseId: null, // 나중에 expenses와 조인하여 설정
        });
      });

      setItinerary(grouped);
      setError(null);
    } catch (err) {
      console.error('일정 가져오기 실패:', err);
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
          is_checked: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchItinerary();
      return { data, error: null };
    } catch (err) {
      console.error('일정 항목 생성 실패:', err);
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
      console.error('일정 항목 업데이트 실패:', err);
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
      console.error('일정 항목 삭제 실패:', err);
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

