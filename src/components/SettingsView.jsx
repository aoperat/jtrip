import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  LogOut, 
  Save, 
  AlertCircle,
  Loader2,
  Camera,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { uploadAvatar, deleteAvatar } from '../lib/storage';

export default function SettingsView({ user, onClose, onSignOut }) {
  const { updateProfile, getProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(''); // 에러 초기화
    try {
      // 이메일은 auth.users에서 가져오기
      setEmail(user.email || '');
      
      // 프로필 정보 직접 가져오기 (useAuth의 user 상태와 동기화 문제 방지)
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        // 프로필이 없으면 생성 (PGRST116은 "no rows returned" 에러 코드)
        const isProfileNotFound = 
          profileError.code === 'PGRST116' || 
          profileError.code === '42P01' ||
          profileError.message?.includes('No rows') ||
          profileError.message?.includes('not found');
        
        if (isProfileNotFound) {
          // 프로필이 없으면 직접 INSERT
          const defaultNickname = user.email?.split('@')[0] || '사용자';
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: defaultNickname,
            });
          
          if (createError) {
            console.error('프로필 생성 실패:', createError);
            // 생성 실패해도 기본값으로 설정
            setNickname(defaultNickname);
            setError('프로필 생성 중 오류가 발생했습니다. 기본 정보로 표시됩니다.');
          } else {
            // 생성 성공하면 다시 조회
            setNickname(defaultNickname);
            const { data: newProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (newProfile && !fetchError) {
              setAvatarUrl(newProfile.avatar_url || '');
            }
          }
        } else {
          // 다른 에러인 경우
          console.error('프로필 조회 오류:', profileError);
          setError('프로필을 불러오는데 실패했습니다.');
          // 기본값이라도 설정
          setNickname(user.email?.split('@')[0] || '사용자');
        }
      } else {
        // 프로필이 있는 경우
        setNickname(data?.name || user.email?.split('@')[0] || '사용자');
        setAvatarUrl(data?.avatar_url || '');
      }
    } catch (err) {
      console.error('프로필 로딩 중 예외 발생:', err);
      setError('오류가 발생했습니다.');
      // 에러가 발생해도 기본값은 설정
      setNickname(user.email?.split('@')[0] || '사용자');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // 업로드
    setIsUploading(true);
    setError('');
    
    try {
      const { data: uploadData, error: uploadError } = await uploadAvatar(file, user.id);
      
      if (uploadError) {
        // 버킷이 없는 경우 사용자 친화적인 메시지 표시
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          setError('Storage 버킷이 설정되지 않았습니다. Supabase 대시보드에서 "profiles" 버킷을 생성해주세요.');
        } else {
          setError(uploadError.message || '이미지 업로드에 실패했습니다.');
        }
        setPreviewUrl('');
        return;
      }

      // 프로필 업데이트
      const { error: updateError } = await updateProfile({
        avatar_url: uploadData.publicUrl,
      });

      if (updateError) {
        setError(updateError.message || '프로필 업데이트에 실패했습니다.');
        setPreviewUrl('');
      } else {
        setAvatarUrl(uploadData.publicUrl);
        setSuccess('프로필 사진이 업데이트되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('오류가 발생했습니다.');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('프로필 사진을 삭제하시겠습니까?')) return;

    setIsUploading(true);
    setError('');
    
    try {
      const { error: deleteError } = await deleteAvatar(user.id);
      
      if (deleteError) {
        setError('프로필 사진 삭제에 실패했습니다.');
        return;
      }

      const { error: updateError } = await updateProfile({
        avatar_url: null,
      });

      if (updateError) {
        setError(updateError.message || '프로필 업데이트에 실패했습니다.');
      } else {
        setAvatarUrl('');
        setPreviewUrl('');
        setSuccess('프로필 사진이 삭제되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!nickname || nickname.trim().length < 2) {
      setError('닉네임은 2자 이상 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = { name: nickname.trim() };
      
      // 미리보기가 있고 아직 업데이트되지 않았다면 URL 포함
      if (previewUrl && previewUrl !== avatarUrl && !previewUrl.startsWith('data:')) {
        updateData.avatar_url = previewUrl;
      }

      const { error: updateError } = await updateProfile(updateData);
      
      if (updateError) {
        setError(updateError.message || '프로필 업데이트에 실패했습니다.');
      } else {
        if (previewUrl && previewUrl.startsWith('data:')) {
          // data URL인 경우 실제 업로드가 필요하지만 이미 업로드됨
          setPreviewUrl('');
        }
        setSuccess('프로필이 업데이트되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      await onSignOut();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
        <header className="px-6 pt-12 pb-5 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center gap-5 sticky top-0 z-50">
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            설정
          </h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
      <header className="px-6 pt-12 pb-5 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center gap-5 sticky top-0 z-50">
        <button
          onClick={onClose}
          className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all hover:bg-slate-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
          설정
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
        {/* 사용자 정보 섹션 */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-black text-slate-900 mb-6 tracking-tight">
            사용자 정보
          </h2>
          
          {/* 프로필 사진 */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-slate-200 flex items-center justify-center">
                {previewUrl || avatarUrl ? (
                  <img
                    src={previewUrl || avatarUrl}
                    alt="프로필 사진"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              {(previewUrl || avatarUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-slate-400 mt-2 text-center">
              프로필 사진을 클릭하여 변경하세요
            </p>
          </div>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-600 mb-2 uppercase tracking-widest">
                닉네임
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  required
                  minLength={2}
                  maxLength={20}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">
                2자 이상 20자 이하로 입력해주세요
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 mb-2 uppercase tracking-widest">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">
                이메일은 변경할 수 없습니다
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                <Save className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-600 font-medium">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  저장하기
                </>
              )}
            </button>
          </form>
        </section>

        {/* 계정 관리 섹션 */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-black text-slate-900 mb-6 tracking-tight">
            계정 관리
          </h2>
          
          <button
            onClick={handleSignOut}
            className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-100"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </section>
      </main>
    </div>
  );
}

