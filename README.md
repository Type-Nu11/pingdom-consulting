<img width="7680" height="4320" alt="Frame_123678" src="https://github.com/user-attachments/assets/77637e72-ba1c-4f16-8217-bfa702a743fb" />

---

## Overview

이 저장소는 Pingdom 프로젝트의 **AI 기반 소상공인 컨설팅 웹 애플리케이션**을 관리합니다.

예비 창업자와 소상공인이 업종과 희망 장소를 입력하고, 상권 분석 및 창업 컨설팅을 받을 수 있는 대화형 웹 화면을 제공합니다.

프론트엔드 상담 흐름 구현, Gemini 기반 첫 상담 안내, 업종 선택, Kakao Maps 기반 장소 검색 및 지도 선택을 담당합니다.

## Project Status

현재 **GA(General Availability)** 단계입니다.

안정화된 서비스를 제공하며, 기능, 구성, 인터페이스 및 제공 결과의 변경은 Release와 변경 이력을 통해 관리합니다.

| Item | Status |
|---|---|
| Development | `Generally Available` |
| Release | `GA` |
| Stability | `Stable` |

## Repository Role

| Item | Description |
|---|---|
| Type | `Web` |
| Responsibility | AI 상권 컨설팅 화면, 상담 입력 흐름, 업종 및 희망 장소 선택 UI |
| Primary Output | 소상공인 컨설팅 웹 애플리케이션 |
| Target | 창업을 준비하거나 상권 분석이 필요한 Pingdom 사용자 |

## Scope

### Included

- AI 상권 컨설팅을 위한 대화형 입력 화면과 상담 진행 UI
- 음식점, 카페, 패션 등 가게 업종 선택 및 기타 업종 입력 흐름
- Kakao Maps 기반 장소 검색, 지도 위치 선택, 마커 이동 및 주소 변환
- 반응형 화면, 전역 테마, 상담 단계별 상태 및 화면 전환 처리
- Gemini 상담 API 연동을 위한 Vite 개발 프록시와 장애 시 기본 안내문 전환

### Not Included

- Pingdom 일반 사용자용 모바일 애플리케이션 및 관리자 웹 애플리케이션
- 백엔드 API 서버, 데이터베이스 및 상권 데이터 수집 시스템 구현
- AI 모델 직접 호출, 추천 알고리즘 및 상권 분석의 서버 측 핵심 로직
- 인증, 결제, 상담 이력 영구 저장 등 서버 연동 기능
- 운영 인프라, 배포 파이프라인 및 모니터링 시스템 구성

## Key Capabilities

- **대화형 상담 화면**: 사용자의 초기 질문을 입력받고 단계별 상담 UI로 전환합니다.
- **AI 첫 상담 안내**: 백엔드 Gemini API가 생성한 짧은 안내문을 기존 타이핑 애니메이션으로 표시합니다.
- **가게 업종 선택**: 사전 정의된 업종을 선택하거나 기타 업종을 직접 입력할 수 있습니다.
- **희망 장소 검색**: Kakao Maps Places 서비스를 이용해 장소명과 주소를 검색합니다.
- **지도 기반 위치 선택**: 지도 클릭과 마커 이동으로 위치를 지정하고 좌표를 주소로 변환합니다.
- **상담 단계 상태 관리**: 질문 입력, 업종 확정, 장소 확정에 따른 화면 상태와 안내 메시지를 관리합니다.
- **반응형 UI**: 데스크톱과 모바일 환경을 고려한 상담 화면 및 애니메이션을 제공합니다.

## Technology and Tools

| Category | Technology |
|---|---|
| Primary | TypeScript, React |
| Framework | Vite, React Router |
| Styling | styled-components |
| API | Axios, Vite Development Proxy |
| Map | Kakao Maps JavaScript SDK |
| Build | npm, Vite |
| Quality | ESLint, TypeScript |
| Delivery | 정적 웹 애플리케이션 빌드 결과물 |

## Getting Started

이 저장소를 확인하거나 실행하기 위해 필요한 최소 절차입니다.

### Requirements

- Node.js
- npm
- Kakao Maps JavaScript API Key
- API 연동 기능 확인 시 Pingdom 컨설팅 API 서버 접근 권한

### Setup

```bash
git clone https://github.com/Type-Nu11/pingdom-consulting.git
cd pingdom-consulting
npm install
cp .env.example .env
```

### Usage

```bash
npm run dev
```

기본 개발 서버는 `http://localhost:5173`에서 실행됩니다.

### Configuration

설정에 필요한 환경 변수는 `.env` 파일에 구성합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
# VITE_PROXY_TARGET=http://localhost:8080
VITE_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | 개발에서는 Vite 프록시의 기본 대상, 운영 빌드에서는 Axios API 기본 주소 |
| `VITE_PROXY_TARGET` | 기본 API 주소보다 우선 적용할 선택적 프록시 대상 |
| `VITE_KAKAO_MAP_APP_KEY` | Kakao Maps JavaScript SDK 실행에 사용하는 키 |

실제 인증정보, API Key, 비밀 값 및 운영 환경 정보는 저장소에 커밋하지 않습니다.

AI provider의 비밀 키는 브라우저에 노출되는 `VITE_*` 환경 변수로 관리하지 않습니다.

## Verification

저장소 변경사항은 다음 방법으로 검증합니다.

| Verification | Purpose |
|---|---|
| `npm run lint` | ESLint 기반 코드 검사 |
| `npm run build` | TypeScript 타입 검사 및 프로덕션 빌드 검증 |
| `npm run preview` | 빌드 결과물 로컬 미리보기 |

## Repository Structure

```text
.
├── public                  # 로고, 파비콘 등 정적 리소스
├── src
│   ├── app
│   │   ├── providers       # 전역 Theme 및 Style Provider
│   │   └── router          # React Router 구성
│   ├── features
│   │   ├── consultation    # AI 첫 상담 안내 API 클라이언트
│   │   └── location        # Kakao Maps 로더, 장소 타입 및 위치 선택 도메인
│   ├── pages
│   │   └── home            # AI 상담, 업종 선택 및 장소 선택 화면
│   ├── styles              # 전역 스타일과 테마
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── eslint.config.js
├── tsconfig.json
└── README.md
```

## Release and Compatibility

현재 버전은 GA(General Availability) 단계입니다.

호환성에 영향을 주는 변경사항은 Release와 관련 문서를 통해 안내합니다.

변경사항은 저장소의 Release 또는 변경 이력을 기준으로 확인합니다.


<div align="center">

Part of Pingdom

</div>
