-- Travel-With 데이터베이스 스키마 (간소화 버전)
-- Supabase SQL Editor에서 직접 실행하세요
-- 전체 내용을 복사하여 붙여넣고 Run 버튼을 클릭하세요

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
  day INTEGER NOT NULL,
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
  amount INTEGER NOT NULL,
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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_travel_participants_travel_id ON travel_participants(travel_id);
CREATE INDEX IF NOT EXISTS idx_travel_participants_user_id ON travel_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_travel_id ON itinerary(travel_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_travel_id ON ticket_types(travel_id);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_type_id ON registrations(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_preparations_travel_id ON preparations(travel_id);
CREATE INDEX IF NOT EXISTS idx_expenses_travel_id ON expenses(travel_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- RLS 정책: Travels
CREATE POLICY "Users can view travels they participate in"
  ON travels FOR SELECT
  USING (
    created_by = auth.uid() OR
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

-- RLS 정책: Travel_Participants
-- 자신의 레코드이거나, 자신이 참여한 여행의 참여자들을 볼 수 있도록
-- 순환 참조를 피하기 위해 서브쿼리에서 다른 레코드(id가 다른)를 참조
CREATE POLICY "Users can view participants of their travels"
  ON travel_participants FOR SELECT
  USING (
    -- 자신의 레코드
    user_id = auth.uid() OR
    -- 자신이 참여한 여행의 참여자들 (서브쿼리에서 다른 레코드 참조하여 순환 방지)
    EXISTS (
      SELECT 1 FROM travel_participants tp
      WHERE tp.travel_id = travel_participants.travel_id
      AND tp.user_id = auth.uid()
      AND tp.id <> travel_participants.id
    )
  );

CREATE POLICY "Users can add participants to their travels"
  ON travel_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travels
      WHERE travels.id = travel_participants.travel_id
      AND travels.created_by = auth.uid()
    )
  );

-- RLS 정책: Itinerary
CREATE POLICY "Users can manage itinerary of their travels"
  ON itinerary FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = itinerary.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- RLS 정책: Ticket_Types
CREATE POLICY "Users can manage ticket types of their travels"
  ON ticket_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = ticket_types.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- RLS 정책: Registrations
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

-- RLS 정책: Preparations
CREATE POLICY "Users can manage preparations of their travels"
  ON preparations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = preparations.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- RLS 정책: Shared_Info
CREATE POLICY "Users can manage shared info of their travels"
  ON shared_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = shared_info.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- RLS 정책: Expenses
CREATE POLICY "Users can manage expenses of their travels"
  ON expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = expenses.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- RLS 정책: Notices
CREATE POLICY "Users can manage notices of their travels"
  ON notices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_participants
      WHERE travel_participants.travel_id = notices.travel_id
      AND travel_participants.user_id = auth.uid()
    )
  );

-- SECURITY DEFINER 함수: travels 정책을 통과한 여행의 참여자 목록 가져오기
-- RLS 정책의 순환 참조 문제를 해결하기 위해 사용
CREATE OR REPLACE FUNCTION get_travel_participants(travel_ids UUID[])
RETURNS TABLE (travel_id UUID, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER이므로 RLS를 우회하여 직접 조회
  RETURN QUERY
  SELECT tp.travel_id, tp.user_id
  FROM travel_participants tp
  WHERE tp.travel_id = ANY(travel_ids)
  AND EXISTS (
    -- travels 정책을 통과한 여행인지 확인
    SELECT 1 FROM travels t
    WHERE t.id = tp.travel_id
    AND (
      t.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM travel_participants tp2
        WHERE tp2.travel_id = t.id
        AND tp2.user_id = auth.uid()
      )
    )
  );
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION get_travel_participants(UUID[]) TO authenticated;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 모든 테이블과 정책이 성공적으로 생성되었습니다!';
END $$;

