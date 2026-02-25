# Project: In-Te-Real (인테리얼)
> [cite_start]"Interior Innovation in Real-time with AI Orchestration" [cite: 121, 158]

## 1. 프로젝트 비전 및 전략
* [cite_start]**Mission Control Commander**: 사용자는 시스템 전체를 지휘하는 사령관이며, AI는 자율적 에이전트로서 실행을 담당합니다. [cite: 100, 113]
* [cite_start]**90% Time Reduction**: 48시간의 초기 기획 공정을 AI 자동화를 통해 수 분 내로 단축합니다. [cite: 17, 19, 91, 121]
* [cite_start]**Possibility over Accuracy**: 기획 단계의 핵심 가치는 '정확성'이 아니라 빠르게 '가능성'을 시각화하는 것입니다. [cite: 39, 56, 94, 95]

## 2. 디자인 프레임워크 (Cloud Dancer)
* [cite_start]**Core Color**: 팬톤 2026 'Cloud Dancer (#F0EEE9)'를 기본색으로 사용하여 정서적 안정감을 제공합니다. [cite: 104, 108]
* [cite_start]**UI Style**: 'Liquid Glass' 글래스모피즘(Glassmorphism)을 적용합니다. [cite: 107]
    * [cite_start]**Backdrop Filter**: 10px ~ 30px 블러 처리로 레이어를 분리합니다. [cite: 108]
    * [cite_start]**Translucent Layer**: `rgba(240, 238, 233, 0.2)` 기반의 반투명 레이어를 사용합니다. [cite: 108]
    * [cite_start]**Border**: 1px의 미세한 테두리로 경계를 정의합니다. [cite: 108]

## 3. Cinematic 5-Stage Pipeline
1.  [cite_start]**01 FLOW (Zoning)**: 업로드된 평면 이미지를 분석하여 최적의 공간 배치 및 실 구성을 제안합니다. [cite: 24, 32, 122]
2.  [cite_start]**02 TONE (Coloring)**: 도면 구조를 유지하며 내추럴, 모던 등 마감재 컨셉을 즉각 시각화합니다. [cite: 26, 41, 42]
3.  [cite_start]**03 RISE (Isometry)**: 2D 평면을 3D 입체 조감도 및 Perspective View로 자동 변환합니다. [cite: 28, 53, 54]
4.  [cite_start]**04 FUSE (Mix Board)**: 스케치업 매스(Mass)와 레퍼런스 이미지를 결합하여 새로운 컨셉을 도출합니다. [cite: 29, 58, 61, 141]
5.  [cite_start]**05 LENS (AI Rendering)**: PBR 재질과 조명 효과가 적용된 실사 수준의 렌더링 결과물을 생성합니다. [cite: 30, 73, 78, 141]

## [cite_start]4. 기술 스택 (The Economic Stack) [cite: 144]
* **Frontend**: Next.js 15 (App Router), Tailwind CSS.
* **Backend/Auth**: Auth0 (Identity), Firebase (Database).
* **Infra**: Railway (AI Process), Vercel (Hosting), GitHub.