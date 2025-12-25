import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    let sessionChecked = false;
    
    // 현재 세션 확인 (한 번만)
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('세션 확인 오류:', error);
          setLoading(false);
          return;
        }
        
        sessionChecked = true;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('세션 확인 예외:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    checkSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // 초기 로드 이벤트는 무시 (이미 getSession으로 처리됨)
      if (event === 'INITIAL_SESSION' && sessionChecked) {
        return;
      }
      
      // 디버깅용 로그 (개발 환경에서만)
      if (import.meta.env.DEV) {
        console.log('인증 상태 변경:', event, session?.user?.email || '로그아웃');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    subscription = authSubscription;

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password, nickname) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname,
        },
      },
    });
    
    // 프로필 생성 (트리거가 작동하지 않는 경우 대비)
    if (!error && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: nickname,
        });
      
      if (profileError) {
        console.error('프로필 생성 실패:', profileError);
      }
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: '로그인이 필요합니다.' } };
    
    try {
      // 먼저 업데이트 실행
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (updateError) {
        return { data: null, error: updateError };
      }
      
      // 업데이트 후 데이터 조회
      const { data, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { data, error: selectError };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const getProfile = async () => {
    if (!user) return { data: null, error: { message: '로그인이 필요합니다.' } };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getProfile,
  };
}

