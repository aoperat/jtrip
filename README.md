# ✈️ Travel-With: 실시간 협업 여행 웹앱

여러 명의 사용자가 실시간으로 여행 계획, 티켓, 예산, 준비물을 공유하고 관리하는 모바일 최적화 웹앱입니다.

## 🚀 기술 스택

- **Frontend**: React 18 + Vite
- **스타일링**: Tailwind CSS
- **아이콘**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **PWA**: vite-plugin-pwa (오프라인 모드 지원)

## 📋 주요 기능

- 🗓️ **여행 일정 관리**: 다일차 탭, 리스트/지도 토글
- 🎫 **퀵패스**: 공통/개별 티켓 구분, QR/바코드 이미지 저장
- 💰 **가계부**: 1/N 정산 엔진, 일정별 지출 배지 표시
- 🎒 **준비물 체크리스트**: 공통/개인 준비물 관리
- 💡 **정보 공유**: 여행 팁 및 공지사항
- 🔗 **데이터 연동**: 일정과 티켓/준비물/지출 간 연결

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 Supabase 프로젝트 정보를 입력하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용 실행
3. Storage에서 `tickets` 버킷 생성 (이미지 업로드용)

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📁 프로젝트 구조

```
jtrip/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── NavButton.jsx
│   │   ├── LinkedBadge.jsx
│   │   ├── LinkBadge.jsx
│   │   └── CreateLinkModal.jsx
│   ├── lib/
│   │   └── supabase.js      # Supabase 클라이언트 설정
│   ├── App.jsx              # 메인 앱 컴포넌트
│   ├── main.jsx             # 앱 진입점
│   └── index.css            # Tailwind CSS
├── supabase/
│   └── schema.sql           # 데이터베이스 스키마
├── prototype.jsx            # 프로토타입 코드 (참고용)
└── 개발계획.md              # 개발 로드맵
```

## 🗄️ 데이터베이스 스키마

- **travels**: 여행 정보
- **travel_participants**: 여행 참여자
- **itinerary**: 일정
- **ticket_types**: 티켓 종류
- **registrations**: 티켓 상세 (QR/바코드)
- **preparations**: 준비물
- **shared_info**: 공유 정보
- **expenses**: 지출 내역
- **notices**: 공지사항

## 📱 개발 로드맵

### Phase 1: 기반 인프라 구축 ✅
- [x] Vite 프로젝트 초기화 및 Tailwind CSS 설정
- [x] Supabase 프로젝트 생성 및 테이블 스키마 생성
- [ ] 소셜 로그인(카카오/구글) 연동

### Phase 2: 핵심 일정 및 연동 기능
- [x] 프로토타입 코드를 컴포넌트로 구조화
- [ ] 여행 생성 및 리스트 화면 구현 (Supabase 연동)
- [ ] 일정 관리: 다일차 탭, 리스트/지도 토글 기능
- [ ] 연동 로직 구현: 일정 추가 시 다른 데이터와 연결

### Phase 3: 퀵패스 및 협업 기능
- [ ] 티켓 월렛: 공통/개별 티켓 구분 로직 및 대신 등록 기능
- [ ] 이미지 업로드: Supabase Storage를 활용한 QR/바코드 이미지 저장
- [ ] 실시간 동기화: supabase.realtime을 사용한 실시간 업데이트

### Phase 4: 예산 관리 및 PWA 최적화
- [ ] 가계부: 1/N 정산 엔진 및 일정별 지출 배지 표시
- [ ] 오프라인 모드: PWA 설정을 통한 오프라인 티켓 조회
- [ ] 최종 UX 개선: 로딩 스켈레톤 UI, 알림 센터 고도화

## 🔐 보안

- Row Level Security (RLS) 활성화
- 참여자만 해당 여행 데이터에 접근 가능
- Supabase Auth를 통한 사용자 인증

## 📝 라이선스

MIT
