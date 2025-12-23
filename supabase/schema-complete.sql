-- Travel-With 완전한 데이터베이스 스키마
-- Supabase PostgreSQL에서 실행하세요
-- 이 파일은 Storage 버킷 생성 및 Realtime 설정을 포함합니다

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 1. Travels (여행)
CREATE TABLE IF NOT EXISTS travels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Travel_Participants (여행 참여자)
CREATE TABLE IF NOT EXISTS travel_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(travel_id, user_id)
);

-- 3. Itinerary (일정)
CREATE TABLE IF NOT EXISTS itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day > 0),
  time TIME,
  title TEXT NOT NULL,
  description TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Ticket_Types (티켓 종류)
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('group', 'individual')) NOT NULL,
  linked_itinerary_id UUID REFERENCES itinerary(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Registrations (티켓 상세)
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('QR', 'Barcode', 'Image')) NOT NULL,
  code TEXT,
  image_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ticket_type_id, user_id)
);

-- 6. Preparations (준비물)
CREATE TABLE IF NOT EXISTS preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  type TEXT CHECK (type IN ('common', 'personal')) NOT NULL,
  linked_itinerary_id UUID REFERENCES itinerary(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. Shared_Info (정보)
CREATE TABLE IF NOT EXISTS shared_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  linked_itinerary_id UUID REFERENCES itinerary(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 8. Expenses (지출)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  linked_itinerary_id UUID REFERENCES itinerary(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 9. Notices (공지사항)
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_travel_participants_travel_id ON travel_participants(travel_id);
CREATE INDEX IF NOT EXISTS idx_travel_participants_user_id ON travel_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_travel_id ON itinerary(travel_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_day ON itinerary(travel_id, day);
CREATE INDEX IF NOT EXISTS idx_ticket_types_travel_id ON ticket_types(travel_id);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_type_id ON registrations(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_preparations_travel_id ON preparations(travel_id);
CREATE INDEX IF NOT EXISTS idx_shared_info_travel_id ON shared_info(travel_id);
CREATE INDEX IF NOT EXISTS idx_expenses_travel_id ON expenses(travel_id);
CREATE INDEX IF NOT EXISTS idx_notices_travel_id ON notices(travel_id);

-- ============================================
-- 3. Row Level Security (RLS) 활성화
-- ============================================

ALTER TABLE travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS 정책 생성
-- ============================================

-- 기존 정책 삭제 (재실행 시)
DROP POLICY IF EXISTS "Users can view travels they participate in" ON travels;
DROP POLICY IF EXISTS "Users can create travels" ON travels;
DROP POLICY IF EXISTS "Users can update their travels" ON travels;
DROP POLICY IF EXISTS "Users can delete their travels" ON travels;
DROP POLICY IF EXISTS "Users can view participants of their travels" ON travel_participants;
DROP POLICY IF EXISTS "Users can add participants to their travels" ON travel_participants;
DROP POLICY IF EXISTS "Users can manage itinerary of their travels" ON itinerary;
DROP POLICY IF EXISTS "Users can manage ticket types of their travels" ON ticket_types;
DROP POLICY IF EXISTS "Users can manage registrations of their travels" ON registrations;
DROP POLICY IF EXISTS "Users can manage preparations of their travels" ON preparations;
DROP POLICY IF EXISTS "Users can manage shared info of their travels" ON shared_info;
DROP POLICY IF EXISTS "Users can manage expenses of their travels" ON expenses;
DROP POLICY IF EXISTS "Users can manage notices of their travels" ON notices;

-- Travels 정책
CREATE POLICY "Users can view travels they participate in"
  ON travels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = travels.id
      AND travel_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create travels"
  ON travels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their travels"
  ON travels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = travels.id
      AND travel_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their travels"
  ON travels FOR DELETE
  USING (auth.uid() = created_by);

-- Travel_Participants 정책
CREATE POLICY "Users can view participants of their travels"
  ON travel_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants tp
      WHERE tp.travel_id = travel_participants.travel_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to their travels"
  ON travel_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travels
      WHERE travels.id = travel_participants.travel_id
      AND (travels.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM travel_participants
        WHERE travel_participants.travel_id = travels.id
        AND travel_participants.user_id = auth.uid()
      ))
    )
  );

-- Itinerary 정책
CREATE POLICY "Users can manage itinerary of their travels"
  ON itinerary FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = itinerary.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- Ticket_Types 정책
CREATE POLICY "Users can manage ticket types of their travels"
  ON ticket_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = ticket_types.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- Registrations 정책
CREATE POLICY "Users can manage registrations of their travels"
  ON registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants tp
      JOIN ticket_types tt ON tt.id = registrations.ticket_type_id
      WHERE tp.travel_id = tt.travel_id
      AND tp.user_id = auth.uid()
    )
  );

-- Preparations 정책
CREATE POLICY "Users can manage preparations of their travels"
  ON preparations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = preparations.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- Shared_Info 정책
CREATE POLICY "Users can manage shared info of their travels"
  ON shared_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = shared_info.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- Expenses 정책
CREATE POLICY "Users can manage expenses of their travels"
  ON expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = expenses.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- Notices 정책
CREATE POLICY "Users can manage notices of their travels"
  ON notices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = notices.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Realtime 활성화
-- ============================================

-- Realtime을 활성화할 테이블 설정
ALTER PUBLICATION supabase_realtime ADD TABLE travels;
ALTER PUBLICATION supabase_realtime ADD TABLE travel_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_types;
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE preparations;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_info;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE notices;

-- ============================================
-- 6. Storage 버킷 생성 (SQL로는 불가능, 수동 생성 필요)
-- ============================================

-- Storage 버킷은 Supabase 대시보드에서 수동으로 생성해야 합니다:
-- 1. Storage 메뉴로 이동
-- 2. "Create a new bucket" 클릭
-- 3. 이름: "tickets"
-- 4. Public bucket: 체크
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/*

-- Storage 정책 (버킷 생성 후 실행)
-- 아래 정책은 Storage 버킷이 생성된 후 별도로 실행해야 합니다.

-- Storage 정책 예시 (tickets 버킷)
-- CREATE POLICY "Users can upload tickets"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'tickets' AND
--     auth.uid() IS NOT NULL
--   );

-- CREATE POLICY "Users can view tickets"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'tickets');

-- CREATE POLICY "Users can delete their tickets"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'tickets' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 모든 테이블, 인덱스, RLS 정책이 성공적으로 생성되었습니다!';
  RAISE NOTICE '⚠️  Storage 버킷 "tickets"는 대시보드에서 수동으로 생성해야 합니다.';
  RAISE NOTICE '⚠️  Storage 정책은 버킷 생성 후 별도로 실행해야 합니다.';
END $$;

