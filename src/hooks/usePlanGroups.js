import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export function usePlanGroups(travelId) {
  const [planGroups, setPlanGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!travelId) {
      setLoading(false);
      return;
    }

    fetchPlanGroups();

    // Realtime 구독
    const subscription = supabase
      .channel(`plan-groups-${travelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_groups',
          filter: `travel_id=eq.${travelId}`,
        },
        (payload) => {
          logger.realtime('플랜 그룹 변경 감지', payload);
          fetchPlanGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_group_items',
        },
        (payload) => {
          logger.realtime('플랜 그룹 아이템 변경 감지', payload);
          fetchPlanGroups();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [travelId]);

  const fetchPlanGroups = async () => {
    if (!travelId) return;

    try {
      setLoading(true);

      // 플랜 그룹과 아이템을 함께 가져오기
      const { data: groups, error: groupsError } = await supabase
        .from('plan_groups')
        .select(`
          *,
          plan_group_items (*)
        `)
        .eq('travel_id', travelId)
        .order('day', { ascending: true })
        .order('created_at', { ascending: true });

      if (groupsError) throw groupsError;

      // App 구조로 변환
      const transformed = (groups || []).map((group) => {
        const items = group.plan_group_items || [];
        
        // variant별로 아이템 그룹화
        const variantAItems = items.filter(i => i.variant === 'A').map(transformItem);
        const variantBItems = items.filter(i => i.variant === 'B').map(transformItem);
        const variantCItems = items.filter(i => i.variant === 'C').map(transformItem);

        return {
          id: group.id,
          day: group.day,
          travelId: group.travel_id,
          variants: {
            A: variantAItems.length > 0 ? variantAItems : null,
            B: variantBItems.length > 0 ? variantBItems : null,
            C: variantCItems.length > 0 ? variantCItems : null,
          },
          activeVariant: group.active_variant || 'A',
        };
      });

      setPlanGroups(transformed);
      setError(null);
    } catch (err) {
      console.error('플랜 그룹 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DB 아이템을 App 아이템으로 변환
  const transformItem = (dbItem) => {
    const baseItem = {
      id: dbItem.id,
      title: dbItem.title,
      time: dbItem.time || '',
      image: dbItem.image_url || null,
      originalItineraryId: dbItem.itinerary_id || null,
    };
    
    // item_data에 추가 데이터가 있으면 병합
    if (dbItem.item_data && typeof dbItem.item_data === 'object') {
      Object.assign(baseItem, dbItem.item_data);
    }
    
    return baseItem;
  };

  // App 아이템을 DB 아이템으로 변환
  const transformItemToDb = (appItem, variant, displayOrder) => {
    const { id, originalItineraryId, title, time, image, ...rest } = appItem;
    return {
      variant,
      itinerary_id: originalItineraryId || null,
      title: title || '',
      time: time || null,
      image_url: image || null,
      item_data: {
        desc: rest.desc || '',
        locationName: rest.locationName || null,
        address: rest.address || null,
        latitude: rest.latitude || null,
        longitude: rest.longitude || null,
        imagePositionX: rest.imagePositionX ?? 0,
        imagePositionY: rest.imagePositionY ?? 0,
        imageScale: rest.imageScale || 400,
      },
      display_order: displayOrder,
    };
  };

  const createPlanGroup = async (groupData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 플랜 그룹 생성
      const { data: group, error: groupError } = await supabase
        .from('plan_groups')
        .insert({
          travel_id: groupData.travelId,
          day: groupData.day,
          active_variant: groupData.activeVariant || 'A',
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 플랜 A의 아이템들 저장
      if (groupData.variants.A && groupData.variants.A.length > 0) {
        const items = groupData.variants.A.map((item, index) => 
          transformItemToDb(item, 'A', index)
        );
        
        const itemsWithGroupId = items.map(item => ({
          ...item,
          plan_group_id: group.id,
        }));

        const { error: itemsError } = await supabase
          .from('plan_group_items')
          .insert(itemsWithGroupId);

        if (itemsError) throw itemsError;
      }

      await fetchPlanGroups();
      return { data: group, error: null };
    } catch (err) {
      console.error('플랜 그룹 생성 실패:', err);
      return { data: null, error: err };
    }
  };

  const updatePlanGroup = async (groupId, updates) => {
    try {
      const dbUpdates = {};
      if (updates.activeVariant !== undefined) {
        dbUpdates.active_variant = updates.activeVariant;
      }
      if (updates.day !== undefined) {
        dbUpdates.day = updates.day;
      }

      const { data, error: updateError } = await supabase
        .from('plan_groups')
        .update(dbUpdates)
        .eq('id', groupId)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchPlanGroups();
      return { data, error: null };
    } catch (err) {
      console.error('플랜 그룹 업데이트 실패:', err);
      return { data: null, error: err };
    }
  };

  const deletePlanGroup = async (groupId) => {
    try {
      // plan_group_items는 CASCADE로 자동 삭제됨
      const { error: deleteError } = await supabase
        .from('plan_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) throw deleteError;
      await fetchPlanGroups();
      return { error: null };
    } catch (err) {
      console.error('플랜 그룹 삭제 실패:', err);
      return { error: err };
    }
  };

  const updatePlanGroupVariant = async (groupId, variantKey, items) => {
    try {
      // 기존 variant 아이템 모두 삭제
      const { error: deleteError } = await supabase
        .from('plan_group_items')
        .delete()
        .eq('plan_group_id', groupId)
        .eq('variant', variantKey);

      if (deleteError) throw deleteError;

      // 새 아이템들 저장
      if (items && items.length > 0) {
        const dbItems = items.map((item, index) => ({
          ...transformItemToDb(item, variantKey, index),
          plan_group_id: groupId,
        }));

        const { error: insertError } = await supabase
          .from('plan_group_items')
          .insert(dbItems);

        if (insertError) throw insertError;
      }

      await fetchPlanGroups();
      return { error: null };
    } catch (err) {
      console.error('플랜 그룹 variant 업데이트 실패:', err);
      return { error: err };
    }
  };

  return {
    planGroups,
    loading,
    error,
    createPlanGroup,
    updatePlanGroup,
    deletePlanGroup,
    updatePlanGroupVariant,
    refetch: fetchPlanGroups,
  };
}

