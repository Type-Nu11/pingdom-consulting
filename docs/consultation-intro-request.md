# 첫 AI 안내 요청 분리 — #71 3단계 일부

## 범위와 기준

- 기준: main `b0a6f06aece2acc6408991b2d769a359284764ea` (#76 병합).
- 브랜치: `refactor/consultation-intro-request-71`, 검증일 2026-11-17.
- `AiHomePage`의 첫 안내 요청 effect·AbortController·기본 안내 문구를
  `features/consultation/hooks/useConsultationIntro.ts`로 이동한다.
- 화면 JSX/스타일, API 계약/인증, 질문 제한, 요청 전환 시간, 이력 저장 형식,
  분석 요청/PDF, 애니메이션과 지도 내부 로직은 변경하지 않는다.
- 사용자 로컬 README·Vite 개발 설정 변경은 보존하고 커밋에서 제외한다.
  이 작업만으로 #71 전체나 #72를 완료하지 않는다.

## 소유권과 사용 규칙

- 페이지가 `submittedPrompt`와 `assistantMessage`를 단독 소유한다. AI 안내는
  이력 훅에 전달하는 세션 draft의 일부이므로 훅 안에 두 번째 메시지 상태를 만들지 않는다.
- `useConsultationIntro({ submittedPrompt, assistantMessage, setAssistantMessage })`는
  요청 수명과 기본 안내만 소유한다. `setAssistantMessage`에는 페이지의 안정적인
  `useState` setter를 직접 전달한다. 렌더마다 만드는 래퍼나 draft 객체 자체는 전달하지 않는다.
- 훅 호출은 기존 effect 자리(질문 제출 전환 effect 다음)에 둔다. 기존 effect의
  본문과 두 의존성을 유지하고 React setter 의존성만 명시한다.
- `cancelIntro()`는 새 상담/활성 삭제의 초기화, 저장 상담 복원, 로그아웃 시 기존
  요청 취소 자리를 대체한다. 보고서 취소와 타이머/단계/입력창 정리 순서는 유지한다.
- 계정 변경은 기존 Router의 `AiHomePage key={user.id}`로 수명을 나눈다.
  훅은 계정 ID나 별도 저장소/인증 상태를 만들지 않는다.

## 유지한 요청 동작

- 제출 질문이 없거나 이미 안내가 있으면 요청하지 않는다.
- 기존 `requestConsultationIntro`를 그대로 사용한다. 전송 본문은 `{ message }`이며
  응답 메시지 trim 및 빈 메시지 오류 처리도 기존 API가 담당한다.
- 성공 응답과 실패 기본 안내 모두 `signal.aborted`가 아닐 때만 반영한다.
  응답이 늦게 끝나도 취소한 상담/계정에 메시지를 쓰지 않는다.
- 실패·빈 응답은 기존 한국어 기본 안내를 사용한다. 자동 재시도·새 오류 UI·로그는 추가하지 않는다.
- effect cleanup은 자기 controller를 중단하고 현재 ref가 같은 controller일 때만 비운다.
  직접 취소만으로 문구/질문/저장 이력을 변경하지 않는다.
- 브라우저 AbortSignal 취소는 서버 AI 처리/비용 취소를 보장하지 않는다.
- 기존의 같은 질문/안내 값으로 복원하거나 직접 취소만 한 경우에는 의존성이 바뀌지
  않으면 재요청하지 않는다. 이 재시작 정책을 이번 구조 이동에서 변경하지 않는다.

## 검증

```sh
npm test
npm run test:intro
npm run test:flow
npm run test:history
npm run test:browser
npm run lint
npm run build
git diff --check
```

- 기준 Git 소스를 별도 공유 clone에 체크아웃하고 기존 단위 **97개**, lint·타입 포함 build,
  `test:flow`·`test:history`·`test:browser`를 실행해 통과했다. 사용자 개발 서버와 저장소는 사용하지 않았다.
- 변경 후 단위 **100개**: 기존 97개 + 첫 안내 구조 보존 검사 3개.
  고정 기준 Git 소스와 effect 본문/기본 문구/ref를 AST로 대조한다. 실행 중 원격 fetch는 하지 않는다.
  검사는 저장소의 해당 Git 커밋을 읽으므로 전체 이력이 있는 체크아웃에서 실행한다.
- 첫 구현 커밋의 3개 파일만 기준 체크아웃에 반영한 조합에서도 기존 단위 97개,
  lint·타입 포함 build를 통과해 커밋 분리로 기존 검사가 깨지지 않는지 확인했다.
- 이전 구조 검사의 baseline은 재생성/교체하지 않는다. `cancelIntro`를 펼쳐 기존 함수
  31개를 비교하고, 새 훅 호출 위치에서 effect를 펼쳐 기존 전체 effect 순서를 대조한다.
  추가된 setter 의존성은 단독 페이지 useState setter를 직접 넘기는지도 별도로 검사한다.
- `test:intro`는 실제 훅/API/Axios를 StrictMode에서 실행한다. 비어 있는 질문, 응답 trim,
  안정적인 setter/무관한 렌더, 저장 문구 복원/요청 생략, 미완료 상담 요청, 서버 fallback,
  HTTP/빈 응답 실패, 새 질문 교체, 명시적 취소, 초기화·복원·계정 변경·언마운트,
  취소 후 늦은 성공/실패, 빠른 A→B→C 교체를 검사한다.
- StrictMode의 첫 cleanup은 Axios adapter 호출 전에 취소될 수 있다. 처음에는 중복
  transport 호출을 가정한 새 검사 한 항목이 timeout 났다. 제품 코드를 바꾸지 않고,
  fixture에서 실제 controller 2개의 취소 상태와 adapter 1회 호출을 함께 확인하도록
  수정했다. 이전/현재 응답 분리는 별도의 전송 후 취소 검사로 유지한다.
- 실제 페이지에서도 새 상담·저장 상담 선택·로그아웃·계정 변경 중 응답을 지연시킨다.
  요청 취소, 현재 응답의 이력 저장, 늦은 응답의 이력 쓰기 차단, 저장 문구 유지와
  과금 분석 요청 0건을 확인한다. 훅 검사 12개 + 실제 페이지 4개 시나리오 묶음이다.
- 기존 단계/이력 훅 검사와 1920×1080·1366×768·390×844의 전체 상담 브라우저 검사로
  업종/위치/고객층/시간/요약, 동의·분석 502 재시도·PDF 복원/다운로드·계정 격리,
  저장소 장애·이력 조작·화면 경계/세로 스크롤을 다시 검사한다.
- 신규 안내 검사의 외부/업무 네트워크는 차단한다. 실제 페이지와 훅을 사용하되
  계정/API/AI/지도/PDF는 합성이다. 기존 전체 페이지 검사에서 허용하는 웹폰트는 별도다.

## 한계와 다음 단계

- 실제 서버 AI/이메일/유료 분석·실제 지도 SDK·운영 데이터·실기기 Safari/Firefox·
  스크린리더·모든 팝업 키보드 동선·운영 배포는 검증하지 않는다.
- JSX AST와 기존 레이아웃 검사를 유지하고 스타일 파일은 변경하지 않는다.
  PC/모바일 요약 캡처도 확인했으며 새 디자인을 적용하지 않는다.
  화면 픽셀이 완전히 같다는 보장은 하지 않는다.
- 저장소의 GitHub Actions workflow가 0개이므로 로컬 통과를 원격 CI 성공으로 표시하지 않는다.
- 다음 #71 범위는 분석 보고서/PDF 요청 책임 → 타이핑/전환 타이머 → 홈 영역/스타일 →
  공통 UI 기준과 최종 전체 회귀다. 위치 검색/지도 내부 분리는 #72에서 진행한다.
- 이 문서의 로컬 검증과 PR 생성·병합·배포 완료는 별도다.
