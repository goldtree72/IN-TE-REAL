# IN-TE-REAL 개발 및 배포 대화/작업 로그 (Conversation Log)
**작성일**: 2026-02-25
**프로젝트**: IN-TE-REAL (AI 오케스트레이션 파이프라인 대시보드)

이 문서는 사용자와 AI 어시스턴트(Antigravity) 간에 진행된 IN-TE-REAL 대시보드의 고도화 및 Vercel 배포 과정을 시간순 및 주제별로 요약한 대화 기록입니다. 향후 프로젝트 유지보수 및 히스토리 파악을 위한 참고 자료로 작성되었습니다.

---

## 🚀 Phase 1: 파이프라인 기능 고도화 및 AI 제어 연동

### 1-1. 전 단계 AI 자동화 버튼 통합
* **요청/상황**: 기존 `TONE`, `RISE` 단계에만 있던 AI 자동 생성 기능을 다른 단계로도 확장 적용하고 싶음.
* **작업 내용**: 
  - `FUSE(Mix Board)`, `LENS(AI Rendering)` 단계의 텍스트 프롬프트 창에 **[✨ AI 자동 생성(무료)]** 버튼 추가 구현.
  - 이후 유저의 피드백("FLOW 단계에도 버튼이 빠져있다")을 받아, 가장 첫 단계인 **`FLOW(공간 조닝)` 단계까지 일괄 적용** 완료.
  - 상태값 분리 (`isGenerating`) 및 API 연동(`handleAutoGenerate`) 처리.

### 1-2. 갤러리 뷰어(ResultUploadSlot) 개편 및 다운로드
* **요청/상황**: 생성된 이미지를 파일로 일일이 저장해서 업로드(점선 상자)하는 과정이 번거롭고 크게 보고 싶음.
* **작업 내용**: 
  - **스마트 안착 로직**: AI 생성 성공 시 1번 슬롯부터 순차적으로 이미지가 렌더링되게 업데이트. 무료 횟수가 모두 끝난(Fallback) 상황에만 기존 수동 점선 파일 업로드 창으로 우회(Switching)하도록 설계.
  - **전체 화면 프레임워크**: 작은 결과 카드를 클릭하면 화면을 덮는 모달(Fullscreen Overlay) 구조를 띄움. 
  - **다운로드 연동**: 모달 하단에 `[📥 이미지 다운로드]` 앵커 태그 속성 추가로 즉시 로컬 PC 저장 지원.

---

## 🎨 Phase 2: 다이나믹 UI 및 애니메이션 추가

### 2-1. 메인 로고 회전 애니메이션 적용
* **요청/상황**: 사이드바 좌측 상단의 로고 이미지 중 특정 부분(로고 모형)만 천천히 돌아가도록 할 수 있는지 문의.
* **작업 내용**: 
  - 단일 이미지 파일의 한계를 인지하고 유저에게 로고와 글자가 분리된 이미지 포맷 요구.
  - 유저로부터 `Logo_Rotate.png` 심볼 투명 파일을 받아 `Sidebar.tsx` 내에 CSS `@keyframes spin` 무한 회전 속성을 씌워 오버레이 탑재 성공.

---

## ☁️ Phase 3: Firebase Auth & 클라우드 데이터 이관

### 3-1. 영구 데이터 동기화 도입
* **요청/상황**: 브라우저 창만 새로고침하거나 종료해도 로컬스토리지가 날아가면 안 됨.
* **작업 내용**: 
  - Firebase 스택 도입: `.env` 에 자격 증명을 셋팅하고 Firebase SDK 연동.
  - 로그인 장벽을 없애기 위해 **Firebase Anonymous Auth (익명 인증)** 기술 적용.
  - 브라우저 쿠키를 기반으로 Firestore DB와 연동하여 이름, 직무, 프로젝트 진척도가 100% 영구 보존되는 아키텍처 완성.

---

## 🛠 Phase 4: 대망의 Vercel 정식 배포 (Troubleshooting)

### 4-1. 배포 중 마주친 빌드 에러 및 수정 타임라인
1. **GitHub 대용량 파일 업로드 에러 (Git LFS)**
   - *문제*: `git init` 직후 `.gitignore` 누락 상태로 `node_modules` 캐시가 커밋됨. 
   - *해결*: `git rm -r --cached` 로 캐시 비우고 ignore 재정비 후 Push 완료.
2. **Next.js 15 TypeScript `Implicit Any` 에러**
   - *문제*: Vercel 빌드 도중 `report/page.tsx` 의 `map(s => s.count)` 에서 타입 미지정 에러 발생.
   - *해결*: GitHub 연동의 장점을 살려 `map((s: any) => )` 로 타입을 임시 명시한 뒤 Push. Vercel Auto-rebuild 확인.
3. **Next.js 15 렌더링 최적화 제약 (`Missing Suspense`) 에러**
   - *문제*: `projects/page.tsx` 에서 `useSearchParams()` 를 직접 쓴 것이, 사전 렌더링(Static Gen) 룰을 위반.
   - *해결*: 해당 컴포넌트를 분리선언하고 최상단에서 `<Suspense fallback={...}>` 바운더리로 감싸주는 구조적 패치 적용 후 Push.
4. **CSS 렌더링에 의한 로고 Stretch 현상 (화면 꽉참 에러)**
   - *문제*: 부모 영역 대비 크기가 잘린(Crop) 정방형 로고를 투입하자 `object-fit: cover` 가 억지로 늘려서 화면을 덮음.
   - *해결*: Python 스크립트를 사용하여 원본 사이즈(가로 1593px)를 유지한 상태로 백그라운드만 날려버린 (Alpha 처리된) 이미지로 재저장 및 교체 반영.

---

## 🎉 결론 (Conclusion)
여러 번의 디버깅과 로컬-원격 동기화 과정을 거쳐, 모든 기능 오류를 잡고 최종 HTML Retrospective Report 문서 작성까지 마무리하며 **IN-TE-REAL 버전 1.0 프로젝트를 Vercel 웹 호스팅 인프라에 성공적으로 안착(Deploy)** 시켰습니다.
