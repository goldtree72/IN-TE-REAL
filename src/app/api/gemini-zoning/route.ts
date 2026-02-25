import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, corridor, usage, spaces } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const spacesText = spaces
      .map((s: { name: string; zone: string; area: string }) =>
        `- ${s.name} (${s.zone === 'public' ? '공용' : s.zone === 'core' ? '핵심' : s.zone === 'support' ? '지원' : '서비스'}, ${s.area}㎡)`
      )
      .join('\n');

    const corridorLabel = corridor === 'single' ? '단일편복도' : '중복도';

    const systemPrompt = `당신은 대한민국 실내건축 전문가입니다. 업로드된 평면도 이미지(코어·기둥·외벽만 표시된 기본 평면)를 분석하여 공간 조닝(Zoning) 3가지 대안을 제시해야 합니다.

**프로젝트 정보:**
- 복도 유형: ${corridorLabel}
- 건물 용도: ${usage || '미입력'}
- 요청 공간 목록:
${spacesText || '- 미입력'}

**분석 및 출력 요구사항:**
1. 이미지에서 외벽, 코어(계단·엘리베이터), 기둥 위치를 파악하세요.
2. 건축법규(복도폭 최소 1.2m~1.8m, 피난 동선 등)를 준수하세요.
3. 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

\`\`\`json
{
  "floorplanAnalysis": {
    "totalArea": "분석된 전체 면적 (㎡, 추정)",
    "corePosition": "코어 위치 설명",
    "structuralNotes": "구조적 특이사항"
  },
  "alternatives": [
    {
      "id": "A",
      "title": "안 A 제목 (예: 개방형 레이아웃)",
      "concept": "컨셉 설명 1~2문장",
      "corridorWidth": "복도 순폭 (mm)",
      "zoneLayout": [
        { "zone": "공용", "rooms": ["실명1", "실명2"], "position": "위치 설명", "area": "면적(㎡)" },
        { "zone": "핵심", "rooms": ["실명"], "position": "위치 설명", "area": "면적(㎡)" },
        { "zone": "지원", "rooms": ["실명"], "position": "위치 설명", "area": "면적(㎡)" }
      ],
      "strengths": ["장점1", "장점2", "장점3"],
      "weaknesses": ["단점1", "단점2"],
      "suitableFor": "적합한 운영 유형",
      "flowDiagram": "동선 흐름 텍스트 설명 (예: 입구→대기→복도→핵심공간)"
    },
    {
      "id": "B",
      "title": "안 B 제목",
      "concept": "컨셉 설명",
      "corridorWidth": "복도 순폭 (mm)",
      "zoneLayout": [],
      "strengths": [],
      "weaknesses": [],
      "suitableFor": "",
      "flowDiagram": ""
    },
    {
      "id": "C",
      "title": "안 C 제목",
      "concept": "컨셉 설명",
      "corridorWidth": "복도 순폭 (mm)",
      "zoneLayout": [],
      "strengths": [],
      "weaknesses": [],
      "suitableFor": "",
      "flowDiagram": ""
    }
  ],
  "recommendation": "3가지 중 최우선 추천 안 (A/B/C) 및 이유"
}
\`\`\``;

    let result;

    if (imageBase64 && mimeType) {
      // Multimodal: image + text
      result = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        systemPrompt,
      ]);
    } else {
      // Text only (no image uploaded)
      result = await model.generateContent(
        systemPrompt + '\n\n[평면도 이미지가 제공되지 않아 입력 텍스트만으로 조닝 대안을 제시합니다]'
      );
    }

    const text = result.response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '응답 파싱 오류', raw: text }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[1]);
    return NextResponse.json({ success: true, data: parsed });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('Gemini API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
