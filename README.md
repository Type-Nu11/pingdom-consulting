# PingDom AI Web

PingDom AI 기능을 붙이기 위한 웹 애플리케이션입니다.
기존 `PingDom_Web`과 같은 Vite + React + TypeScript + styled-components 구조를 사용합니다.

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

## 프로젝트 구조

```bash
src/
├── app/        # 전역 설정 (router, provider)
├── components/ # 공통 컴포넌트
├── pages/      # 화면 단위 컴포넌트
├── api/        # 서버 통신
├── hooks/      # 화면에서 사용하는 로직
├── types/      # 타입 정의
├── assets/     # 이미지 및 정적 리소스
└── styles/     # 전역 스타일과 테마
```

화면에서 API를 직접 호출하지 않고 `Page → Hook → API → Server` 흐름으로 확장합니다.

## 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 타입 체크 및 프로덕션 빌드
npm run lint     # ESLint
npm run preview  # 빌드 결과 미리보기
```

## 환경변수

`.env.example`을 `.env`로 복사한 뒤 API 서버 주소를 설정합니다.
AI provider의 비밀 키는 브라우저용 `VITE_*` 변수에 넣지 않고 서버 환경에서 관리해야 합니다.
