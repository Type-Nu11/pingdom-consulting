# 분석 보고서·PDF 수명 분리 — #71 3단계 일부

## 범위

- 기준: main `4c49b5f3010242b319805e47b1716e64f88a52ff` (#77 병합).
- 브랜치: `refactor/consultation-analysis-report-71`, 검증일 2026-11-17.
- `AiHomePage`의 보고서 요청·오류·PDF·진행 단계 상태, AbortController,
  보고서 전용 타이머, PDF 복원·삭제·다운로드를
  `features/analysis/hooks/useAnalysisReport.ts`로 옮긴다.
- 개인정보 동의, 필수 입력 검증, 요청 DTO 작성과 상담 확정/확정 해제는 페이지와
  기존 `useConsultationFlow`에 남긴다. 훅은 전달받은 명령을 원래 위치에서 호출한다.
- JSX/문구/스타일, API/인증, 지도, 이력 JSON/IndexedDB 형식은 변경하지 않는다.
  사용자 로컬 README·Vite 설정은 보존하며 커밋에서 제외한다.
- 일반 타이핑·대화 전환 타이머와 홈 컴포넌트/스타일 분리는 후속 작업이다.
  이 변경만으로 #71 전체 또는 별도 지도·위치 검색 이슈 #72를 완료하지 않는다.

## 소유권과 순서

- 보고서 상태 4개와 자원 ref 2개는 새 훅에만 존재한다. 페이지에 복제 상태를 두지 않는다.
- 훅에는 사용자 ID, 활성 상담 ID, 기존 1,500ms 초기 표시 지연을 전달한다.
  요청 본문은 페이지의 지연 생성 함수로 받아 기존 API 호출 자리에서 평가한다.
- 제출은 이전 요청 취소 → 타이머 정리 → 새 controller/제출 상태 → 오류·PDF 초기화
  → 상담 확정 → 초기 표시 타이머 → API 순서를 유지한다.
- 성공/실패는 중단되지 않은 요청만 반영한다. finally는 ref가 자기 controller일 때만
  제출 상태를 정리한다. 실패 시 원래 오류 매핑을 사용하고 상담 확정을 해제한다.
  자동 재시도나 서버 작업 취소 정책은 추가하지 않는다.
- 새 상담/상담 복원/활성 상담 삭제의 초기화는 기존 취소·타이머 정리·페이지 및 흐름
  초기화 순서를 유지한다. `cancelAnalysisReport`는 중단만 하며 상태 초기화와 분리한다.
  로그아웃은 기존처럼 중단 후 화면 해제 시 cleanup으로 타이머를 정리한다.
- 타이핑 완료 여부는 페이지가 전달하지 않고, 페이지 effect가 완료 시 훅의 안정적인
  `scheduleAnalysisLoading`을 호출한다. 450ms 간격과 cleanup을 유지한다.
- PDF 복원 effect는 훅 내부로 옮겨지며 등록 위치가 앞당겨졌다. 나머지 페이지 effect의
  상대 순서는 유지한다. 복원의 의존성·비동기 읽기·`isCurrentSession` cleanup guard는
  원래와 같다. 전체 effect 등록 순서가 완전히 동일하다고 주장하지 않는다.
- 계정 변경은 기존 Router의 `AiHomePage key={session.user.id}` 재마운트로 구분한다.
  PDF 키는 계속 `${userId}:${sessionId}`이고 활성 상담이 없으면 저장하지 않는다.
- 저장소 실패 시 개발 로그만 남기며, 성공 PDF는 메모리에서 계속 다운로드할 수 있다.
  다운로드 시 Blob URL 생성·앵커 삽입/제거·URL 해제 순서를 유지한다.
- 브라우저 요청 취소가 서버 분석 작업/과금 취소를 보장하지 않는다.

## 검증

```sh
npm test
npm run test:report
npm run test:intro
npm run test:flow
npm run test:history
npm run test:browser
npm run lint
npm run build
git diff --check
```

- 기준 소스를 별도 공유 clone에서 검증했다: 단위 100개, lint/build와 기존 브라우저
  4종(intro/flow/history/전체 상담)이 통과했다. 사용자 개발 서버는 사용하지 않았다.
- 변경 후 단위 103개: 원본 페이지에서 얻은 4개 상태/2개 ref/진행 타입·상수의 고정 AST
  해시 및 API·저장소·스타일 파일 해시를 추가로 대조한다. 테스트 실행은 Git 이력에
  의존하지 않는다. 기존 flow 기준 JSON은 갱신하지 않았다.
- 기존 31개 처리 함수는 새 명령만 원위치에 펼쳐 원래 AST와 비교한다. 제출 DTO와
  성공/실패/저장/취소 순서도 검사한다. JSX, 옮기지 않은 effect의 순서, 옮긴 복원 effect와
  진행 effect의 본문/의존성은 기존 기준과 별도로 대조한다.
- `test:report`: 실제 훅·Axios API·IndexedDB를 사용하는 StrictMode 브라우저 검사 10그룹.
  요청 DTO/125,000ms timeout/Accept/blob, 1,500ms·450ms 진행 전환, PDF 저장/복원/삭제,
  Blob URL 해제, 502/timeout/재시도/기본 파일명, 오래된 finally/응답, 초기화/상담·계정
  전환/로그아웃 방식 취소/해제, 늦은 저장소 읽기, 저장소 차단을 확인한다.
- 기존 전체 상담 검사는 1920×1080, 1366×768, 390×844에서 동의/재시도/다운로드/복원,
  이력 삭제·취소, 계정 격리 및 저장소 실패를 확인한다. intro/flow/history 검사도 유지한다.
- 전후 요약 화면을 확인했다. JSX/스타일은 동일하며 스크린샷에는 기존 배경 애니메이션과
  캡처 시점 차이가 있어 픽셀 단위 동일성은 주장하지 않는다.
- 모든 분석·AI·지도는 합성 transport/fixture로 확인했다. 실사용자·유료 AI 호출,
  운영 PDF 생성·배포·Safari/Firefox 실기기 검증은 하지 않았다.
