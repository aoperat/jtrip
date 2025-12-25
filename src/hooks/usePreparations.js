import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePreparations(travelId) {
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchPreparations();

    // Realtime 구독
    const subscription = supabase
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
          console.log('준비물 변경 감지:', payload);
          fetchPreparations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [travelId]);

  const fetchPreparations = async () => {
    if (!travelId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('preparations')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // 프로토타입 형식에 맞게 변환
      const transformed = data.map((prep) => ({
        id: prep.id,
        content: prep.content,
        checked: prep.checked,
        type: prep.type,
        linkedItineraryId: prep.linked_itinerary_id,
      }));

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
      const { data, error: updateError } = await supabase
        .from('preparations')
        .update({ checked })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchPreparations();
      return { data, error: null };
    } catch (err) {
      console.error('준비물 체크 토글 실패:', err);
      return { data: null, error: err };
    }
  };

  const updatePreparation = async (id, prepData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('preparations')
        .update({
          content: prepData.content,
          type: prepData.type,
          linked_itinerary_id: prepData.linkedItineraryId || null,
        })
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

