import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Mail, Lock, UserPlus, AlertCircle, User } from 'lucide-react';

export default function AuthGuard({ children }) {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // 회원가입 검증
        if (!nickname || nickname.trim().length < 2) {
          setError('닉네임은 2자 이상 입력해주세요.');
          setIsLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError('비밀번호는 6자 이상 입력해주세요.');
          setIsLoading(false);
          return;
        }
        
        if (password !== passwordConfirm) {
          setError('비밀번호가 일치하지 않습니다.');
          setIsLoading(false);
          return;
        }
        
        const { error: signUpError } = await signUp(email, password, nickname.trim());
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setError('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
          // 폼 초기화
          setEmail('');
          setPassword('');
          setPasswordConfirm('');
          setNickname('');
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        }
      }
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때는 로딩 화면 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로딩이 완료되었고 사용자가 없을 때만 로그인 화면 표시
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Travel-With</h1>
            <p className="text-sm text-slate-400">
              여행 계획을 함께 만들어보세요
            </p>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-100">
            <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setNickname('');
                  setPasswordConfirm('');
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  !isSignUp
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  isSignUp
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    닉네임
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      required={isSignUp}
                      minLength={2}
                      maxLength={20}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    2자 이상 20자 이하로 입력해주세요
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {isSignUp && (
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    6자 이상 입력해주세요
                  </p>
                )}
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      required={isSignUp}
                      minLength={6}
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        passwordConfirm && password !== passwordConfirm
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {passwordConfirm && password !== passwordConfirm && (
                    <p className="text-[10px] text-red-500 mt-1 ml-1">
                      비밀번호가 일치하지 않습니다
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    처리 중...
                  </>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    회원가입
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    로그인
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-6">
              {isSignUp
                ? '이미 계정이 있으신가요?'
                : '계정이 없으신가요?'}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-blue-600 font-bold"
              >
                {isSignUp ? '로그인' : '회원가입'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

