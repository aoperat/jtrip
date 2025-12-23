import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useExpenses(travelId) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchExpenses();

    // Realtime 구독
    const subscription = supabase
      .channel(`expenses-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          console.log('지출 변경 감지:', payload);
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [travelId]);

  const fetchExpenses = async () => {
    if (!travelId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // payer_id 수집
      const payerIds = [...new Set(data.map(e => e.payer_id).filter(Boolean))];
      
      // profiles에서 payer 정보 가져오기
      const profilesMap = new Map();
      if (payerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, name')
          .in('id', payerIds);

        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // 프로토타입 형식에 맞게 변환
      const transformed = data.map((expense) => {
        const payerProfile = profilesMap.get(expense.payer_id);
        return {
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          payer: payerProfile?.name || payerProfile?.email?.split('@')[0] || 'Unknown',
          category: expense.category,
          linkedItineraryId: expense.linked_itinerary_id,
        };
      });

      setExpenses(transformed);
      setError(null);
    } catch (err) {
      console.error('지출 목록 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error: createError } = await supabase
        .from('expenses')
        .insert({
          travel_id: travelId,
          title: expenseData.title,
          amount: expenseData.amount,
          payer_id: expenseData.payerId || user.id,
          category: expenseData.category || 'Other',
          linked_itinerary_id: expenseData.linkedItineraryId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchExpenses();
      return { data, error: null };
    } catch (err) {
      console.error('지출 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const deleteExpense = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchExpenses();
      return { error: null };
    } catch (err) {
      console.error('지출 삭제 실패:', err);
      return { error: err };
    }
  };

  // 총 지출 계산
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 참여자 수 가져오기 (1/N 계산용)
  const getParticipantCount = async () => {
    const { data } = await supabase
      .from('travel_participants')
      .select('user_id', { count: 'exact' })
      .eq('travel_id', travelId);
    return data?.length || 1;
  };

  return {
    expenses,
    loading,
    error,
    totalExpense,
    createExpense,
    deleteExpense,
    getParticipantCount,
    refetch: fetchExpenses,
  };
}

