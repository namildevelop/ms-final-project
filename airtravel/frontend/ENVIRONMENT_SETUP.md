# 환경 변수 설정 가이드

## 로컬 개발 환경 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# .env 파일
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_NGROK_URL=https://your-ngrok-url.ngrok-free.app
EXPO_PUBLIC_KAKAO_MAPS_KEY=your_kakao_maps_key_here
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key_here

# Google OAuth (Google Cloud Console에서 발급받은 클라이언트 ID들)
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_expo_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
```

### 2. 백엔드 서버 실행

```bash
# 백엔드 디렉토리로 이동
cd ../air_travel_back

# 백엔드 서버 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. ngrok 설정 (모바일 디바이스 테스트용)

```bash
# 새 터미널에서 ngrok 실행
ngrok http 8000

# 생성된 ngrok URL을 .env 파일에 추가
# 예: https://abc123.ngrok-free.app
```

### 4. 프론트엔드 앱 실행

```bash
# 프론트엔드 디렉토리에서
npm start
# 또는
expo start
```

## 배포 환경 설정

### 개발 환경
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### 스테이징 환경
```bash
EXPO_PUBLIC_API_URL=https://staging-api.yourdomain.com
```

### 프로덕션 환경
```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

## API 엔드포인트

현재 설정된 API 엔드포인트들:

### AI 카메라
- `POST /v1/ai-analysis/analyze-image` - 이미지 분석
- `POST /v1/ai-analysis/generate-audio` - TTS 생성
- `WebSocket /v1/ai-analysis/ws` - 실시간 분석 결과

### AI 플래닝
- `WebSocket /v1/trips/{tripId}/ws` - 실시간 여행 계획 업데이트

## 문제 해결

### 1. API 연결 실패
- 백엔드 서버가 실행 중인지 확인
- 포트 8000이 사용 가능한지 확인
- 방화벽 설정 확인

### 2. 환경 변수 인식 안됨
- `.env` 파일이 프로젝트 루트에 있는지 확인
- Expo 서버 재시작
- 캐시 클리어: `expo start --clear`

### 3. WebSocket 연결 실패
- 네트워크 연결 상태 확인
- 백엔드 WebSocket 서버 상태 확인
- 토큰 유효성 확인
