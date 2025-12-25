import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSharedInfo(travelId) {
  const [sharedInfo, setSharedInfo] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchSharedInfo();
    fetchNotices();

    // Realtime 구독
    const subscription = supabase
      .channel(`shared-info-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_info',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          console.log('공유 정보 변경 감지:', payload);
          fetchSharedInfo();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notices',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          console.log('공지사항 변경 감지:', payload);
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [travelId]);

  const fetchSharedInfo = async () => {
    if (!travelId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('shared_info')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformed = data.map((info) => ({
        id: info.id,
        title: info.title,
        content: info.content,
        category: info.category,
        linkedItineraryId: info.linked_itinerary_id,
      }));

      setSharedInfo(transformed);
    } catch (err) {
      console.error('공유 정보 가져오기 실패:', err);
      setError(err.message);
    }
  };

  const fetchNotices = async () => {
    if (!travelId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('notices')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // author_id 수집
      const authorIds = [...new Set(data.map(n => n.author_id).filter(Boolean))];
      
      // profiles에서 author 정보 가져오기
      const profilesMap = new Map();
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, name')
          .in('id', authorIds);

        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      const transformed = data.map((notice) => {
        const authorProfile = profilesMap.get(notice.author_id);
        return {
          id: notice.id,
          content: notice.content,
          author: authorProfile?.name || authorProfile?.email?.split('@')[0] || 'Unknown',
        };
      });

      setNotices(transformed);
      setLoading(false);
    } catch (err) {
      console.error('공지사항 가져오기 실패:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const createSharedInfo = async (infoData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: createError } = await supabase
        .from('shared_info')
        .insert({
          travel_id: travelId,
          title: infoData.title,
          content: infoData.content,
          category: infoData.category || 'Tip',
          linked_itinerary_id: infoData.linkedItineraryId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchSharedInfo();
      return { data, error: null };
    } catch (err) {
      console.error('공유 정보 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const createNotice = async (noticeData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: createError } = await supabase
        .from('notices')
        .insert({
          travel_id: travelId,
          content: noticeData.content,
          author_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchNotices();
      return { data, error: null };
    } catch (err) {
      console.error('공지사항 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const updateSharedInfo = async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: updateError } = await supabase
        .from('shared_info')
        .update({
          title: updates.title,
          content: updates.content,
          category: updates.category || 'Tip',
          linked_itinerary_id: updates.linkedItineraryId || null,
        })
        .eq('id', id)
        .eq('travel_id', travelId)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchSharedInfo();
      return { data, error: null };
    } catch (err) {
      console.error('공유 정보 수정 실패:', err);
      return { data: null, error: err };
    }
  };

  const deleteSharedInfo = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error: deleteError } = await supabase
        .from('shared_info')
        .delete()
        .eq('id', id)
        .eq('travel_id', travelId);

      if (deleteError) throw deleteError;
      await fetchSharedInfo();
      return { error: null };
    } catch (err) {
      console.error('공유 정보 삭제 실패:', err);
      return { error: err };
    }
  };

  const updateNotice = async (id, content) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: updateError } = await supabase
        .from('notices')
        .update({
          content: content,
        })
        .eq('id', id)
        .eq('travel_id', travelId)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchNotices();
      return { data, error: null };
    } catch (err) {
      console.error('공지사항 수정 실패:', err);
      return { data: null, error: err };
    }
  };

  const deleteNotice = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error: deleteError } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)
        .eq('travel_id', travelId);

      if (deleteError) throw deleteError;
      await fetchNotices();
      return { error: null };
    } catch (err) {
      console.error('공지사항 삭제 실패:', err);
      return { error: err };
    }
  };

  return {
    sharedInfo,
    notices,
    loading,
    error,
    createSharedInfo,
    createNotice,
    updateSharedInfo,
    deleteSharedInfo,
    updateNotice,
    deleteNotice,
    refetch: () => {
      fetchSharedInfo();
      fetchNotices();
    },
  };
}

