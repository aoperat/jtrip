# GitHub Pages 배포 가이드

## 📋 사전 준비

### 1. GitHub 리포지토리 생성
1. GitHub에서 새 리포지토리 생성
2. 리포지토리 이름을 기억해두세요 (예: `jtrip`)

### 2. GitHub Secrets 설정
리포지토리 Settings > Secrets and variables > Actions에서 다음 Secrets를 추가하세요:

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API Key

**설정 방법:**
1. GitHub 리포지토리로 이동
2. Settings > Secrets and variables > Actions 클릭
3. "New repository secret" 클릭
4. 각 변수 이름과 값을 입력하고 저장

### 3. GitHub Pages 활성화
1. 리포지토리 Settings > Pages로 이동
2. Source를 "GitHub Actions"로 선택
3. 저장

## 🚀 배포 방법

### 자동 배포 (권장)
1. 코드를 `main` 브랜치에 push
2. GitHub Actions가 자동으로 빌드 및 배포
3. Actions 탭에서 배포 상태 확인
4. 배포 완료 후 `https://[username].github.io/[repository-name]/` 에서 확인

### 수동 배포
```bash
npm run build
# dist 폴더의 내용을 GitHub Pages에 업로드
```

## 🔧 환경 변수 설정

### 로컬 개발용 (.env 파일)
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### GitHub Secrets (배포용)
GitHub 리포지토리 Settings > Secrets and variables > Actions에서 설정

## 📝 주의사항

1. **리포지토리 이름 변경 시**: `vite.config.js`의 `base` 경로를 수동으로 수정해야 할 수 있습니다.

2. **첫 배포**: GitHub Pages가 활성화되기까지 몇 분이 걸릴 수 있습니다.

3. **환경 변수**: `.env` 파일은 Git에 커밋하지 마세요. `.gitignore`에 이미 포함되어 있습니다.

4. **빌드 실패 시**: GitHub Actions 탭에서 로그를 확인하세요.

## 🔗 배포 URL 형식

- 리포지토리 이름이 `jtrip`인 경우: `https://[username].github.io/jtrip/`
- 커스텀 도메인 사용 시: 설정한 도메인

## 🐛 문제 해결

### 빌드 실패
- GitHub Secrets가 올바르게 설정되었는지 확인
- Actions 탭의 로그 확인

### 페이지가 표시되지 않음
- GitHub Pages 설정에서 Source가 "GitHub Actions"로 설정되었는지 확인
- 배포가 완료되었는지 Actions 탭에서 확인

### 환경 변수 오류
- GitHub Secrets에 모든 변수가 설정되었는지 확인
- 변수 이름이 정확한지 확인 (대소문자 구분)

