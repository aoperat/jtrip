# Supabase 데이터베이스 설정 가이드

## 방법 1: Supabase 웹 대시보드에서 직접 실행 (권장)

### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 입력
4. 리전 선택 후 프로젝트 생성

### 2. SQL Editor에서 스키마 실행
1. Supabase 대시보드에서 왼쪽 메뉴의 **SQL Editor** 클릭
2. **New Query** 클릭
3. `schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
5. 모든 테이블과 정책이 성공적으로 생성되었는지 확인

### 3. Storage 버킷 생성 (이미지 업로드용)
1. 왼쪽 메뉴에서 **Storage** 클릭
2. **Create a new bucket** 클릭
3. 버킷 이름: `tickets`
4. **Public bucket** 체크 (티켓 이미지를 공개적으로 접근 가능하게)
5. **Create bucket** 클릭

### 4. 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- **URL**: Settings > API > Project URL
- **Anon Key**: Settings > API > Project API keys > anon public

## 방법 2: Supabase CLI 사용

### 1. Supabase CLI 설치

**Windows (PowerShell):**
```powershell
# Scoop 사용
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 또는 직접 다운로드
# https://github.com/supabase/cli/releases
```

**또는 npm으로 설치:**
```bash
npm install -g supabase
```

### 2. Supabase 로그인
```bash
supabase login
```

### 3. 프로젝트 연결
```bash
supabase link --project-ref your-project-ref
```

### 4. 마이그레이션 실행
```bash
supabase db push
```

또는 직접 SQL 실행:
```bash
supabase db execute -f supabase/schema.sql
```

## 생성되는 테이블

1. **travels** - 여행 정보
2. **travel_participants** - 여행 참여자
3. **itinerary** - 일정
4. **ticket_types** - 티켓 종류
5. **registrations** - 티켓 상세 (QR/바코드)
6. **preparations** - 준비물
7. **shared_info** - 공유 정보
8. **expenses** - 지출 내역
9. **notices** - 공지사항

## 보안 설정

모든 테이블에 Row Level Security (RLS)가 활성화되어 있으며, 참여자만 해당 여행의 데이터에 접근할 수 있습니다.

## 문제 해결

### 오류: "relation does not exist"
- `auth.users` 테이블이 존재하는지 확인
- Supabase 프로젝트가 완전히 생성되었는지 확인

### 오류: "permission denied"
- RLS 정책이 올바르게 생성되었는지 확인
- SQL Editor에서 실행할 때는 관리자 권한으로 실행됩니다

