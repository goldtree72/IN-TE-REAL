'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import StageProgress from '@/components/stage/StageProgress';
import PromptWorkspace from '@/components/stage/PromptWorkspace';
import ImageUploadZone from '@/components/stage/ImageUploadZone';

const STAGE_COLOR = '#C08018';

const CONCEPTS = [
    { key: 'natural', label: '내추럴', emoji: '🌿', desc: '우드 · 린넨 · 크림' },
    { key: 'modern', label: '모던', emoji: '◻️', desc: '무채색 · 미니멀 · 스틸' },
    { key: 'artdeco', label: '아트데코', emoji: '✦', desc: '골드 · 마블 · 기하' },
    { key: 'minimal', label: '미니멀', emoji: '○', desc: '화이트 · 플랫 · 클린' },
    { key: 'nordic', label: '노르딕', emoji: '❄️', desc: '밝은 파인 · 회색 · 패브릭' },
    { key: 'custom', label: '커스텀', emoji: '✏️', desc: '직접 입력' },
];

const FLOORING = ['원목 오크 플랭크', '밝은 라임스톤 타일', '헤링본 파케', '폴리싱 콘크리트', '패브릭 카펫'];
const WALLS = ['크리미 오프화이트 매트', '차콜 마이크로시멘트', '웜 그레이 페인트', '클레이 텍스처', '화이트 글로시'];
const FURNITURE = ['라이트 우드 베니어', '블랙 스틸 프레임', '천연 린넨 패브릭', '마블 패턴 라미네이트', '다크 왈넛'];

const MAT_COLORS: Record<string, string> = {
    // 바닥재
    '원목 오크 플랭크': '#d9ba8c', '밝은 라임스톤 타일': '#e6e3d3', '헤링본 파케': '#b58c67', '폴리싱 콘크리트': '#9a9a9a', '패브릭 카펫': '#cbd0d4',
    // 벽재
    '크리미 오프화이트 매트': '#f5f5f0', '차콜 마이크로시멘트': '#424549', '웜 그레이 페인트': '#aeb2ad', '클레이 텍스처': '#c9a585', '화이트 글로시': '#ffffff',
    // 가구
    '라이트 우드 베니어': '#e3c298', '블랙 스틸 프레임': '#2a2a2d', '천연 린넨 패브릭': '#e3dfce', '마블 패턴 라미네이트': 'linear-gradient(135deg, #f0f0f0 0%, #d4d4d4 100%)', '다크 왈넛': '#594433',
};

const buildPrompt = (
    concept: string,
    customConcept: string,
    flooring: string,
    walls: string,
    furniture: string,
    lighting: number,
): string => {
    if (!concept) return '';
    const conceptLabel = concept === 'custom' ? customConcept || '커스텀 컨셉' : CONCEPTS.find(c => c.key === concept)?.label || concept;
    const lightingDesc = lighting < 30 ? '부드러운 자연광, 따뜻한 아침 빛' : lighting < 60 ? 'Soft natural daylight with warm glow' : lighting < 80 ? '밝고 화사한 낮 조명' : 'Bright dramatic lighting, high contrast';

    return `{
  "visual_style": "Photorealistic top-down orthographic 3D render, ${conceptLabel} palette.",
  "materials": {
    "flooring": "${flooring} with grain texture and realistic shadow.",
    "walls_furniture": "${walls} walls, ${furniture} furniture elements."
  },
  "lighting_depth": {
    "type": "${lightingDesc}",
    "special_effect": "Extreme Ambient Occlusion (AO) for deep, dark contact shadows in corners and under furniture for hyper-realistic depth."
  },
  "styling_props": "High-detail decor items with individual shadows — books, vases, kitchenware.",
  "technical_overlay": "Overlay original black CAD dimension lines and numeric values only. Remove all Hangul text labels.",
  "concept_theme": "${conceptLabel}",
  "output": "Maintain exact CAD floor plan structure. Only apply materials and lighting. Do NOT alter layout."
}`;
}

// ── Before/After Slider Component ───────────────────────────────
function BeforeAfterSlider({ beforeImg, setBeforeImg, afterImg, setAfterImg }: { beforeImg: string | null, setBeforeImg: (s: string | null) => void, afterImg: string | null, setAfterImg: (s: string | null) => void }) {
    const [position, setPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const beforeRef = useRef<HTMLInputElement>(null);
    const afterRef = useRef<HTMLInputElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setPosition((x / rect.width) * 100);
    }, []);

    const onMouseMove = (e: React.MouseEvent) => {
        if (e.buttons === 1) handleMove(e.clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setter(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <div
            ref={containerRef}
            className="comparison-slider-container"
            onMouseMove={onMouseMove}
            onMouseDown={(e) => handleMove(e.clientX)}
            onTouchMove={onTouchMove}
            style={{ cursor: 'ew-resize', marginBottom: 16 }}
        >
            {/* Before (Original CAD) */}
            <input ref={beforeRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, setBeforeImg)} />
            <div
                style={{ position: 'absolute', inset: 0, background: beforeImg ? 'transparent' : '#e0dfd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}
            >
                {beforeImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={beforeImg} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable={false} />
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📐</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>위 버튼을 눌러 원본 업로드</div>
                    </div>
                )}
            </div>

            {/* After (Colored Layer) clipped by width */}
            <input ref={afterRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, setAfterImg)} />
            <div className="comparison-overlay" style={{ width: `${100 - position}%` }}>
                <div
                    style={{ position: 'absolute', top: 0, right: 0, width: '100vw', minWidth: 600, height: '100%', background: afterImg ? 'transparent' : '#b4c4ae', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5d43' }}
                >
                    {afterImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={afterImg} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable={false} />
                    ) : (
                        <div style={{ textAlign: 'center', transform: `translateX(calc(-50vw + 50%))` }}>
                            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.7 }}>🎨</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>위 버튼을 눌러 AI 결과 업로드</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Buttons */}
            <button
                className="comparison-upload-btn"
                onClick={(e) => { e.stopPropagation(); beforeRef.current?.click(); }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 10,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                    padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
            >
                {beforeImg ? '🔄 원본 뷰어 변경' : '📤 원본 CAD 업로드'}
            </button>
            <button
                className="comparison-upload-btn"
                onClick={(e) => { e.stopPropagation(); afterRef.current?.click(); }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                    padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
            >
                {afterImg ? '🔄 AI 결과 변경' : '📤 AI 결과 업로드'}
            </button>

            {/* Labels */}
            <div className="comparison-label-before" style={{ opacity: position > 20 ? 1 : 0, transition: 'opacity 0.2s' }}>Before</div>
            <div className="comparison-label-after" style={{ opacity: position < 80 ? 1 : 0, transition: 'opacity 0.2s' }}>After</div>

            {/* Handle */}
            <div className="comparison-handle" style={{ left: `${position}%` }} />
        </div>
    );
}

export default function TonePage() {
    const [concept, setConcept] = useState('');
    const [customConcept, setCustomConcept] = useState('');
    const [flooring, setFlooring] = useState(FLOORING[0]);
    const [walls, setWalls] = useState(WALLS[0]);
    const [furniture, setFurniture] = useState(FURNITURE[0]);
    const [lighting, setLighting] = useState(50);

    const [beforeImg, setBeforeImg] = useState<string | null>(null);
    const [afterImg, setAfterImg] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const prompt = useMemo(() => buildPrompt(concept, customConcept, flooring, walls, furniture, lighting), [concept, customConcept, flooring, walls, furniture, lighting]);

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
                setAfterImg(data.image);
            } else if (data.status === 'manual_fallback') {
                alert('일일 무료 사용량이 모두 소진되었습니다.\n우측의 프롬프트를 복사하여 직접 생성해주세요.');
            } else {
                alert('이미지 생성에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
            }
        } catch (e: any) {
            alert('요청 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ padding: '16px 24px 0' }}>
            <StageProgress />
            <div className="stage-workspace" style={{ height: 'calc(100vh - 92px - 100px)' }}>

                {/* Input Panel */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">입력 패널</div>
                        <div className="stage-col-subtitle">02 TONE — 컬러링 & 재질</div>
                    </div>
                    <div className="stage-col-body">
                        {/* CAD Upload */}
                        <div>
                            <label className="stage-label">① 기준 이미지 (CAD 도면)</label>
                            <ImageUploadZone
                                label="CAD 도면 또는 FLOW 결과 이미지 업로드"
                                stageColor={STAGE_COLOR}
                            />
                        </div>

                        {/* Concept */}
                        <div>
                            <label className="stage-label">② 컨셉 스타일 선택</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                                {CONCEPTS.map(c => (
                                    <button
                                        key={c.key}
                                        onClick={() => setConcept(c.key)}
                                        style={{
                                            padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                                            border: `1.5px solid ${concept === c.key ? STAGE_COLOR : 'rgba(200,200,200,0.35)'}`,
                                            background: concept === c.key ? `${STAGE_COLOR}18` : 'rgba(255,255,255,0.35)',
                                            color: concept === c.key ? STAGE_COLOR : 'var(--text-secondary)',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ fontSize: 18, marginBottom: 3 }}>{c.emoji}</div>
                                        <div style={{ fontSize: 10, fontWeight: 700 }}>{c.label}</div>
                                        <div style={{ fontSize: 9, opacity: 0.7 }}>{c.desc}</div>
                                    </button>
                                ))}
                            </div>
                            {concept === 'custom' && (
                                <input
                                    className="stage-input"
                                    style={{ marginTop: 8 }}
                                    placeholder="컨셉 설명 직접 입력 (예: 보헤미안 레트로)"
                                    value={customConcept}
                                    onChange={e => setCustomConcept(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Materials */}
                        <div>
                            <label className="stage-label">③ 마감재 설정</label>
                            {[
                                { label: '바닥재', opts: FLOORING, val: flooring, set: setFlooring },
                                { label: '벽재', opts: WALLS, val: walls, set: setWalls },
                                { label: '가구', opts: FURNITURE, val: furniture, set: setFurniture },
                            ].map(({ label: l, opts, val, set }) => (
                                <div key={l} style={{ marginBottom: 8 }}>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{l}</span>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                                            width: 14, height: 14, borderRadius: '50%',
                                            background: MAT_COLORS[val] || '#ccc',
                                            border: '1px solid rgba(0,0,0,0.15)',
                                            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)',
                                            pointerEvents: 'none'
                                        }} />
                                        <select className="stage-select" style={{ paddingLeft: 32 }} value={val} onChange={e => set(e.target.value)}>
                                            {opts.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Lighting */}
                        <div>
                            <label className="stage-label">④ 조명 분위기 ({lighting}%)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🌅 소프트</span>
                                <input
                                    type="range" min="0" max="100" value={lighting}
                                    onChange={e => setLighting(Number(e.target.value))}
                                    className="stage-slider"
                                    style={{ flex: 1, accentColor: STAGE_COLOR }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🌞 밝음</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompt workspace */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">프롬프트 워크스페이스</div>
                        <div className="stage-col-subtitle">AI 재질/컬러링 프롬프트 자동 생성</div>
                    </div>
                    <div className="stage-col-body">
                        <PromptWorkspace
                            prompt={prompt}
                            stageColor={STAGE_COLOR}
                            hint="CAD 도면의 구조를 유지하면서 선택한 컨셉과 마감재를 적용하는 최적화 프롬프트입니다. Gemini 또는 ChatGPT에 CAD 이미지와 함께 붙여넣으세요."
                            onAutoGenerate={handleAutoGenerate}
                            isGenerating={isGenerating}
                        />
                    </div>
                </div>

                {/* Output gallery */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">결과물 갤러리</div>
                        <div className="stage-col-subtitle">컬러링 결과 비교</div>
                    </div>
                    <div className="stage-col-body">
                        <BeforeAfterSlider beforeImg={beforeImg} setBeforeImg={setBeforeImg} afterImg={afterImg} setAfterImg={setAfterImg} />

                        <div style={{
                            padding: '10px 12px', background: `${STAGE_COLOR}10`,
                            border: `1px solid ${STAGE_COLOR}25`, borderRadius: 10,
                            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                            💡 원본 CAD와 컬러링 결과를 나란히 비교하세요. 마감재 팔레트 PDF는 AI에게 추가 요청하세요.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
