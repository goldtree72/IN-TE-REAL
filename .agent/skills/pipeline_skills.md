---
name: In-Te-Real_Skillset
[cite_start]description: 인테리얼 프로젝트의 자율 에이전트 실행 로직 정의 [cite: 146]
---

# Commands & Implementation Logic

### /init-intereal
- [cite_start]**목적**: 프로젝트 초기 환경 구축. 
- [cite_start]**작업**: Next.js 15 보일러플레이트 생성 및 `IN-TE-REAL.md`의 디자인 시스템(Cloud Dancer) 적용. [cite: 104, 108, 148]

### /plan-pipeline
- [cite_start]**목적**: 아티팩트 기반의 5단계 파이프라인 계획 수립. [cite: 119, 149]
- [cite_start]**작업**: 각 단계별 체크포인트를 설정하여 에러 발생 시 타임머신 디버깅이 가능하도록 구성. [cite: 120]

### /setup-security
- [cite_start]**목적**: 보안 아키텍처 및 수익화 로직 구축. [cite: 143]
- [cite_start]**작업**: Auth0 신원 관리와 Stripe 구독 모델(Pro 등급 등) 연동. [cite: 143, 144]

# Pipeline Step Logic (Prompts)

- [cite_start]**FLOW**: 사용자가 선택한 복도 유형(단일편/중복도)과 공간 목록을 바탕으로 Zoning 로직을 연산합니다. [cite: 125, 126, 127]
- [cite_start]**TONE**: 원본 CAD 선을 유지한 채 텍스트 프롬프트로 재질(Wood, Tile 등)을 매핑합니다. [cite: 41, 42, 137, 138]
- [cite_start]**RISE**: Isometric 3D cutaway view(45도 앵글)를 생성하여 공간 볼륨을 시각화합니다. [cite: 53, 54, 139]
- [cite_start]**FUSE**: 기하학적 형태(Structure)를 고정하고 참조 이미지의 스타일 DNA를 전이시킵니다. [cite: 61, 141]
- [cite_start]**LENS**: PBR 텍스처와 전역 조명(Global Illumination)을 적용하여 8K 실사 뷰를 생성합니다. [cite: 78, 141, 142]