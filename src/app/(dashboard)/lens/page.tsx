'use client';

import { useState, useMemo } from 'react';
import StageProgress from '@/components/stage/StageProgress';
import PromptWorkspace from '@/components/stage/PromptWorkspace';
import ImageUploadZone from '@/components/stage/ImageUploadZone';
import ResultUploadSlot from '@/components/stage/ResultUploadSlot';

const STAGE_COLOR = '#3458AA';

const TIME_SLOTS = [
    { key: 'morning', emoji: '🌅', label: '오전', time: '07:00', desc: '부드럽고 따뜻한 아침 햇살' },
    { key: 'afternoon', emoji: '☀️', label: '오후', time: '14:00', desc: '밝고 화사한 자연광' },
    { key: 'evening', emoji: '🌆', label: '저녁', time: '18:30', desc: '황금빛 골든아워 조명' },
    { key: 'night', emoji: '🌙', label: '야간', time: '22:00', desc: '실내 조명 중심 분위기' },
];

const FOCUS_MATERIALS = [
    '목재 텍스처 (결과 강조)',
    '대리석 / 석재 광택',
    '패브릭 & 쿠션 질감',
    '금속 표면 반사',
    '유리 투명도 & 반영',
    '콘크리트 마감 거칠기',
];

const RESOLUTIONS = ['4K (3840×2160)', '6K (6144×3456)', '8K (7680×4320)'];

const buildLensPrompt = (
    timeKey: string,
    focus: string,
    resolution: string,
    negativeHints: string,
): string => {
    if (!timeKey) return '';

    const slot = TIME_SLOTS.find(t => t.key === timeKey)!;
    const resPart = resolution.split(' ')[0];

    const lightingByTime: Record<string, string> = {
        morning: 'Soft warm morning sunlight streaming through windows, low-angle golden rays, gentle ambient fill, warm 2700K color tone',
        afternoon: 'Bright natural daylight, neutral white light, strong directional shadows, crisp illumination, 5500K daylight',
        evening: 'Golden hour warm light, long shadows, rich amber and orange tones, dramatic side-lighting, 3000K warm glow',
        night: 'Interior lighting dominant, warm accent spots, soft pools of light, rich dark shadows, ambient mood lighting, no exterior light',
    };

    return `{
  "task_type": "AI Photorealistic Image-to-Image Enhancement",
  "master_priority": "ABSOLUTE GEOMETRY & CAMERA LOCK — No structural changes, No camera move.",
  "time_of_day": "${slot.label} (${slot.time})",
  "enhancement_target": "${focus || '공간 전체 마감재 및 분위기'}",
  "lighting_setup": {
    "type": "${lightingByTime[timeKey]}",
    "ceiling_lock": "Maintain original ceiling shape and fixtures exactly. Do NOT add new light fixtures.",
    "natural_light": "${timeKey === 'night' ? 'NONE — interior lighting only' : 'Natural daylight as primary source, no added artificial fixtures'}"
  },
  "visual_rules": {
    "materials": "PBR (Physically Based Rendering) textures — realistic wood, stone, fabric with natural reflections.",
    "rendering": "Octane/V-Ray style, physically-correct shading, no artificial glow, no LED strip lights.",
    "depth_of_field": "Subtle foreground focus, natural bokeh on background elements."
  },
  "technical_specs": {
    "quality": "${resPart} resolution, RAW photo, DSLR architectural photography, sharp focus.",
    "post_processing": "Minimal — preserve natural material accuracy, no HDR over-processing."
  },
  "negative_prompt": "CGI look, 3D render artifact, sketch, distorted geometry, added structures, extra lights, LED strips, blurry, low quality${negativeHints ? ', ' + negativeHints : ''}"
}`;
};

export default function LensPage() {
    const [selectedTime, setSelectedTime] = useState('');
    const [focus, setFocus] = useState('');
    const [resolution, setResolution] = useState('8K (7680×4320)');
    const [negativeHints, setNegativeHints] = useState('');
    const [generateAll, setGenerateAll] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lensImgs, setLensImgs] = useState<Record<string, string | null>>({
        morning: null, afternoon: null, evening: null, night: null
    });

    const handleAutoGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();

            if (data.status === 'success' && data.image) {
                setLensImgs(prev => {
                    const next = { ...prev };
                    if (generateAll) {
                        const emptyKey = Object.keys(next).find(k => !next[k]) || 'morning';
                        next[emptyKey] = data.image;
                    } else if (selectedTime) {
                        next[selectedTime] = data.image;
                    } else {
                        next['morning'] = data.image;
                    }
                    return next;
                });
            } else if (data.status === 'manual_fallback') {
                alert('일일 무료 사용량이 모두 소진되었습니다.\n수동 업로드 모드로 전환합니다. 프롬프트를 복사해주세요.');
            } else {
                alert('이미지 생성에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
            }
        } catch (e: any) {
            alert('요청 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const updateLensImg = (key: string, val: string | null) => {
        setLensImgs(prev => ({ ...prev, [key]: val }));
    };

    const prompt = useMemo(() => {
        if (generateAll) {
            return TIME_SLOTS.map(t =>
                `// ─── ${t.label} (${t.time}) ───\n` + buildLensPrompt(t.key, focus, resolution, negativeHints)
            ).join('\n\n');
        }
        return buildLensPrompt(selectedTime, focus, resolution, negativeHints);
    }, [selectedTime, focus, resolution, negativeHints, generateAll]);

    return (
        <div style={{ padding: '16px 24px 0' }}>
            <StageProgress />
            <div className="stage-workspace" style={{ height: 'calc(100vh - 92px - 100px)' }}>

                {/* Input panel */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">입력 패널</div>
                        <div className="stage-col-subtitle">05 LENS — AI 렌더링</div>
                    </div>
                    <div className="stage-col-body">
                        {/* Image upload */}
                        <div>
                            <label className="stage-label">① 기준 뷰 이미지 업로드</label>
                            <ImageUploadZone
                                label="FUSE 결과 또는 최종 컨셉 이미지 업로드"
                                stageColor={STAGE_COLOR}
                            />
                        </div>

                        {/* Time of day */}
                        <div>
                            <label className="stage-label">② 시간대 선택</label>
                            <div className="time-tabs">
                                {TIME_SLOTS.map(t => (
                                    <button
                                        key={t.key}
                                        className={`time-tab ${selectedTime === t.key && !generateAll ? 'selected' : ''}`}
                                        style={{ color: selectedTime === t.key && !generateAll ? STAGE_COLOR : undefined }}
                                        onClick={() => { setSelectedTime(t.key); setGenerateAll(false); }}
                                        title={t.desc}
                                    >
                                        <span className="time-emoji">{t.emoji}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
                                        <span style={{ fontSize: 9, opacity: 0.65 }}>{t.time}</span>
                                    </button>
                                ))}
                            </div>

                            {/* All 4 times button */}
                            <button
                                onClick={() => { setGenerateAll(!generateAll); setSelectedTime(''); }}
                                style={{
                                    marginTop: 8, width: '100%', padding: '9px', borderRadius: 8,
                                    border: `1.5px solid ${generateAll ? STAGE_COLOR : 'rgba(200,200,200,0.4)'}`,
                                    background: generateAll ? `${STAGE_COLOR}18` : 'rgba(255,255,255,0.35)',
                                    color: generateAll ? STAGE_COLOR : 'var(--text-secondary)',
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease',
                                }}
                            >
                                🕐 4가지 시간대 동시 생성 프롬프트
                            </button>
                        </div>

                        {/* Focus material */}
                        <div>
                            <label className="stage-label">③ 강조 마감재 / 분위기</label>
                            <select
                                className="stage-select"
                                value={focus}
                                onChange={e => setFocus(e.target.value)}
                                style={{ marginBottom: 6 }}
                            >
                                <option value="">전체 공간 균형 강조</option>
                                {FOCUS_MATERIALS.map(m => <option key={m}>{m}</option>)}
                            </select>
                            <input
                                className="stage-input"
                                placeholder="직접 입력 (예: 원목 구조 계단 난간 질감)"
                                value={focus}
                                onChange={e => setFocus(e.target.value)}
                            />
                        </div>

                        {/* Resolution */}
                        <div>
                            <label className="stage-label">④ 출력 해상도</label>
                            <div className="stage-option-group">
                                {RESOLUTIONS.map(r => (
                                    <button
                                        key={r}
                                        className={`stage-option-btn ${resolution === r ? 'selected' : ''}`}
                                        style={{ color: resolution === r ? STAGE_COLOR : undefined, fontSize: 10 }}
                                        onClick={() => setResolution(r)}
                                    >{r}</button>
                                ))}
                            </div>
                        </div>

                        {/* Negative */}
                        <div>
                            <label className="stage-label">⑤ 제외 요소 (Negative Prompt)</label>
                            <input
                                className="stage-input"
                                placeholder="예: 흰색 커튼, 천장 스포트라이트 추가"
                                value={negativeHints}
                                onChange={e => setNegativeHints(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Prompt workspace */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">프롬프트 워크스페이스</div>
                        <div className="stage-col-subtitle">PBR 실사 렌더링 프롬프트</div>
                    </div>
                    <div className="stage-col-body">
                        <PromptWorkspace
                            prompt={prompt}
                            stageColor={STAGE_COLOR}
                            hint="기준 이미지를 AI에 업로드하고 이 프롬프트를 함께 붙여넣으세요. 카메라와 구조는 고정되고 조명과 재질만 실사 수준으로 향상됩니다."
                            onAutoGenerate={handleAutoGenerate}
                            isGenerating={isGenerating}
                        />
                    </div>
                </div>

                {/* Output gallery */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">결과물 갤러리</div>
                        <div className="stage-col-subtitle">시간대별 렌더링</div>
                    </div>
                    <div className="stage-col-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {TIME_SLOTS.map(t => (
                                <ResultUploadSlot
                                    key={t.key}
                                    label={`${t.label} 렌더링`}
                                    note={t.time}
                                    icon={t.emoji}
                                    stageColor={STAGE_COLOR}
                                    preview={lensImgs[t.key]}
                                    onPreviewChange={val => updateLensImg(t.key, val)}
                                />
                            ))}
                        </div>
                        <div style={{
                            padding: '10px 12px', background: `${STAGE_COLOR}10`,
                            border: `1px solid ${STAGE_COLOR}25`, borderRadius: 10,
                            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                            💡 4가지 시간대 결과를 클라이언트에게 나란히 제시하면 조명 컨셉 결정이 훨씬 직관적입니다.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
