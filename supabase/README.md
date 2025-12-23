# Supabase 데이터베이스 설정 가이드

## 🚀 빠른 시작

### 1단계: Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속 및 로그인
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: travel-with (원하는 이름)
   - **Database Password**: 안전한 비밀번호 설정 (저장 필수!)
   - **Region**: 가장 가까운 리전 선택
4. **Create new project** 클릭 (생성까지 1-2분 소요)

### 2단계: SQL Editor에서 테이블 생성

1. 프로젝트 대시보드에서 왼쪽 메뉴의 **SQL Editor** 클릭
2. **New Query** 버튼 클릭
3. `schema-complete.sql` 파일을 열어서 **전체 내용 복사**
4. SQL Editor에 **붙여넣기**
5. 오른쪽 상단의 **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
6. 하단에 "Success. No rows returned" 메시지 확인

### 3단계: 테이블 확인

1. 왼쪽 메뉴의 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ travels
   - ✅ travel_participants
   - ✅ itinerary
   - ✅ ticket_types
   - ✅ registrations
   - ✅ preparations
   - ✅ shared_info
   - ✅ expenses
   - ✅ notices

### 4단계: Storage 버킷 생성 (이미지 업로드용)

1. 왼쪽 메뉴의 **Storage** 클릭
2. **Create a new bucket** 클릭
3. 설정:
   - **Name**: `tickets`
   - **Public bucket**: ✅ 체크 (중요!)
   - **File size limit**: 5MB (또는 원하는 크기)
   - **Allowed MIME types**: `image/*` (또는 비워두기)
4. **Create bucket** 클릭

### 5단계: Storage 정책 설정 (선택사항)

Storage 버킷 생성 후, 보안을 위해 정책을 설정할 수 있습니다:

1. Storage > Policies 메뉴로 이동
2. `tickets` 버킷 선택
3. "New Policy" 클릭하여 정책 생성

또는 SQL Editor에서 다음 정책을 실행:

```sql
-- Storage 정책 (tickets 버킷)
CREATE POLICY "Users can upload tickets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tickets' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view tickets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tickets');

CREATE POLICY "Users can delete their tickets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tickets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 6단계: 소셜 로그인 설정 (선택사항)

#### Google 로그인 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials로 이동
4. "Create Credentials" > "OAuth client ID" 선택
5. Application type: Web application
6. Authorized redirect URIs에 추가:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
7. Client ID와 Client Secret 복사
8. Supabase 대시보드 > Authentication > Providers > Google에서 설정

#### Kakao 로그인 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 플랫폼 설정 > Web 플랫폼 등록
4. Redirect URI 등록:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
5. 카카오 로그인 활성화
6. REST API 키와 Client Secret 복사
7. Supabase 대시보드 > Authentication > Providers > Kakao에서 설정

### 7단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- **URL**: Settings > API > Project URL
- **Anon Key**: Settings > API > Project API keys > anon public

## 📋 생성되는 테이블 구조

### travels (여행)
- `id`: UUID (기본키)
- `title`: 여행 제목
- `start_date`: 시작일
- `end_date`: 종료일
- `image_url`: 대표 이미지 URL
- `created_by`: 생성자 (auth.users 참조)

### travel_participants (참여자)
- `travel_id`: 여행 ID
- `user_id`: 사용자 ID
- 참여자만 해당 여행 데이터 접근 가능

### itinerary (일정)
- `travel_id`: 여행 ID
- `day`: 일차 (1, 2, 3...)
- `time`: 시간
- `title`: 일정 제목
- `description`: 설명
- `is_checked`: 완료 여부
- `linked_itinerary_id`: 연동된 일정 ID (다른 데이터와 연결)

### ticket_types (티켓 종류)
- `travel_id`: 여행 ID
- `name`: 티켓 이름
- `mode`: 'group' (공통) 또는 'individual' (개별)
- `linked_itinerary_id`: 연동된 일정 ID

### registrations (티켓 상세)
- `ticket_type_id`: 티켓 종류 ID
- `user_id`: 사용자 ID
- `type`: 'QR', 'Barcode', 'Image'
- `code`: 티켓 코드
- `image_path`: 이미지 경로 (Storage)

### preparations (준비물)
- `travel_id`: 여행 ID
- `content`: 준비물 내용
- `checked`: 체크 여부
- `type`: 'common' (공통) 또는 'personal' (개인)
- `linked_itinerary_id`: 연동된 일정 ID

### shared_info (공유 정보)
- `travel_id`: 여행 ID
- `title`: 정보 제목
- `content`: 정보 내용
- `category`: 카테고리
- `linked_itinerary_id`: 연동된 일정 ID

### expenses (지출)
- `travel_id`: 여행 ID
- `title`: 지출 내역
- `amount`: 금액
- `payer_id`: 결제자 ID
- `category`: 카테고리
- `linked_itinerary_id`: 연동된 일정 ID

### notices (공지사항)
- `travel_id`: 여행 ID
- `content`: 공지 내용
- `author_id`: 작성자 ID

## 🔒 보안 설정

모든 테이블에 **Row Level Security (RLS)**가 활성화되어 있습니다:
- 참여자만 해당 여행의 데이터 조회/수정 가능
- 여행 생성자만 여행 삭제 가능
- 참여자 추가는 여행 생성자 또는 참여자만 가능

## ⚠️ 문제 해결

### "relation auth.users does not exist" 오류
- Supabase 프로젝트가 완전히 생성될 때까지 대기 (1-2분)
- 프로젝트 상태가 "Active"인지 확인

### "permission denied" 오류
- SQL Editor에서 실행할 때는 관리자 권한이므로 문제없어야 함
- RLS 정책이 올바르게 생성되었는지 확인

### 테이블이 보이지 않음
- Table Editor에서 새로고침
- SQL Editor에서 다음 쿼리로 확인:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Realtime이 작동하지 않음
- Supabase 대시보드 > Database > Replication에서 테이블이 활성화되어 있는지 확인
- `schema-complete.sql`의 Realtime 활성화 부분이 실행되었는지 확인

## ✅ 완료 확인

모든 단계를 완료했다면:
1. ✅ 9개의 테이블 생성 완료
2. ✅ Storage 버킷 생성 완료
3. ✅ 환경 변수 설정 완료
4. ✅ 소셜 로그인 설정 완료 (선택사항)
5. ✅ 개발 서버 실행: `npm run dev`

이제 앱에서 Supabase와 연동할 준비가 되었습니다! 🎉
