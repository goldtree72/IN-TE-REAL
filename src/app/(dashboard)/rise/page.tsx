'use client';

import { useState, useMemo } from 'react';
import StageProgress from '@/components/stage/StageProgress';
import PromptWorkspace from '@/components/stage/PromptWorkspace';
import ImageUploadZone from '@/components/stage/ImageUploadZone';
import ResultUploadSlot from '@/components/stage/ResultUploadSlot';

const STAGE_COLOR = '#8B5E2A';

const WALL_HEIGHTS = ['2400', '2600', '2800', '3000', '3200', '3600'];
const RENDER_STYLES = ['모던 미니멀', '인더스트리얼', '스칸디나비안', '클래식 코리안', '럭셔리 컨템포러리'];

const buildPrompt = (
    viewType: 'iso' | 'persp' | 'both' | '',
    wallHeight: string,
    renderStyle: string,
    perspPoint: string,
    perspDir: string,
    renderQuality: 'draft' | 'final',
): string => {
    if (!viewType || !wallHeight) return '';

    const qualitySpec = renderQuality === 'final'
        ? '8K resolution, Ultra-photorealistic architectural CGI, Octane & V-Ray render quality'
        : '4K resolution, Photorealistic architectural visualization';

    const isoPrompt = viewType !== 'persp' ? `{
  "view_iso": {
    "perspective_and_view": "Isometric 3D cutaway view, 45-degree top-right angle (dollhouse perspective), no roof showing full interior.",
    "subject_and_structure": "${renderStyle} interior. ${wallHeight}mm wall height. Dark charcoal load-bearing walls contrasting with white textured partition walls.",
    "rendering_style": "${qualitySpec}, professional presentation.",
    "materials_and_lighting": "PBR realistic materials (natural flooring, fabric, glass). Natural sunlight streaming in, soft shadows cast on a clean neutral gray background plane."
  }
}` : '';

    const perspPrompt = (viewType === 'persp' || viewType === 'both') && perspPoint ? `{
  "view_perspective": {
    "camera_position": "Standing at ${perspPoint}, looking ${perspDir || '정면'}",
    "subject_and_structure": "${renderStyle} interior perspective view. ${wallHeight}mm ceiling height.",
    "rendering_style": "${qualitySpec}.",
    "materials_and_lighting": "PBR textures, natural daylight, soft ray-traced shadows, global illumination.",
    "master_constraint": "ABSOLUTE CAMERA LOCK — No structural changes, No camera movement from specified position."
  }
}` : '';

    if (viewType === 'both') return `// ─── Isometric View ───\n${isoPrompt}\n\n// ─── Perspective View ───\n${perspPrompt}`;
    if (viewType === 'iso') return isoPrompt;
    return perspPrompt;
};

export default function RisePage() {
    const [viewType, setViewType] = useState<'iso' | 'persp' | 'both' | ''>('');
    const [wallHeight, setWallHeight] = useState('2600');
    const [renderStyle, setRenderStyle] = useState(RENDER_STYLES[0]);
    const [perspPoint, setPerspPoint] = useState('');
    const [perspDir, setPerspDir] = useState('');
    const [renderQuality, setRenderQuality] = useState<'draft' | 'final'>('final');

    const [isoImg, setIsoImg] = useState<string | null>(null);
    const [perspImg, setPerspImg] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const prompt = useMemo(
        () => buildPrompt(viewType, wallHeight, renderStyle, perspPoint, perspDir, renderQuality),
        [viewType, wallHeight, renderStyle, perspPoint, perspDir, renderQuality]
    );

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
                if (viewType === 'persp') setPerspImg(data.image);
                else setIsoImg(data.image); // iso or both default to iso slot
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

                {/* Input panel */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">입력 패널</div>
                        <div className="stage-col-subtitle">03 RISE — 아이소메트릭 3D</div>
                    </div>
                    <div className="stage-col-body">
                        {/* Image upload */}
                        <div>
                            <label className="stage-label">① 기준 이미지 업로드</label>
                            <ImageUploadZone
                                label="평면도 또는 TONE 결과 이미지 업로드"
                                stageColor={STAGE_COLOR}
                            />
                        </div>

                        {/* View type */}
                        <div>
                            <label className="stage-label">② 뷰 타입 선택</label>
                            <div className="stage-option-group" style={{ flexDirection: 'column' }}>
                                {[
                                    { val: 'iso', label: '아이소메트릭 45°', icon: '🏠', desc: '전체 공간 조감, 돌하우스 시점' },
                                    { val: 'persp', label: '퍼스펙티브 뷰', icon: '👁️', desc: '특정 시점에서 바라보는 투시도' },
                                    { val: 'both', label: '두 가지 모두', icon: '🔀', desc: 'Isometric + Perspective 동시 생성' },
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        className={`stage-option-btn ${viewType === opt.val ? 'selected' : ''}`}
                                        style={{
                                            textAlign: 'left', padding: '10px 12px',
                                            color: viewType === opt.val ? STAGE_COLOR : undefined,
                                        }}
                                        onClick={() => setViewType(opt.val as typeof viewType)}
                                    >
                                        <span style={{ marginRight: 6 }}>{opt.icon}</span>
                                        <strong>{opt.label}</strong>
                                        <span style={{ display: 'block', fontSize: 10, fontWeight: 400, opacity: 0.7, paddingLeft: 22 }}>{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Perspective point — show when persp or both */}
                        {(viewType === 'persp' || viewType === 'both') && (
                            <div>
                                <label className="stage-label">퍼스펙티브 시점 설정</label>
                                <input
                                    className="stage-input"
                                    placeholder="카메라 위치 (예: 거실 소파 앞, 주방 동선 중앙)"
                                    value={perspPoint}
                                    onChange={e => setPerspPoint(e.target.value)}
                                    style={{ marginBottom: 6 }}
                                />
                                <input
                                    className="stage-input"
                                    placeholder="바라보는 방향 (예: 창문 방향, 주방 쪽)"
                                    value={perspDir}
                                    onChange={e => setPerspDir(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Settings */}
                        <div>
                            <label className="stage-label">③ 상세 설정</label>
                            <div style={{ marginBottom: 8 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>벽 높이</span>
                                <div className="stage-option-group" style={{ flexWrap: 'wrap' }}>
                                    {WALL_HEIGHTS.map(h => (
                                        <button
                                            key={h}
                                            className={`stage-option-btn ${wallHeight === h ? 'selected' : ''}`}
                                            style={{ flex: 'none', color: wallHeight === h ? STAGE_COLOR : undefined, padding: '6px 10px' }}
                                            onClick={() => setWallHeight(h)}
                                        >
                                            {h}mm
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 8 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>렌더 스타일</span>
                                <select className="stage-select" value={renderStyle} onChange={e => setRenderStyle(e.target.value)}>
                                    {RENDER_STYLES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>렌더 품질</span>
                                <div className="stage-option-group">
                                    {[{ val: 'draft', label: 'Draft (4K)' }, { val: 'final', label: 'Final (8K)' }].map(q => (
                                        <button
                                            key={q.val}
                                            className={`stage-option-btn ${renderQuality === q.val ? 'selected' : ''}`}
                                            style={{ color: renderQuality === q.val ? STAGE_COLOR : undefined }}
                                            onClick={() => setRenderQuality(q.val as 'draft' | 'final')}
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompt workspace */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">프롬프트 워크스페이스</div>
                        <div className="stage-col-subtitle">AI 3D 뷰 생성 프롬프트</div>
                    </div>
                    <div className="stage-col-body">
                        <PromptWorkspace
                            prompt={prompt}
                            stageColor={STAGE_COLOR}
                            hint="Isometric은 공간 전체 볼륨 파악, Perspective는 실제 체감 공간감 전달에 적합합니다. '두 가지 모두' 선택 시 두 개의 프롬프트가 순서대로 생성됩니다."
                            onAutoGenerate={handleAutoGenerate}
                            isGenerating={isGenerating}
                        />
                    </div>
                </div>

                {/* Output gallery */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">결과물 갤러리</div>
                        <div className="stage-col-subtitle">3D 뷰 결과물</div>
                    </div>
                    <div className="stage-col-body">
                        {[
                            { icon: '🏠', label: 'Isometric View', note: '45° 돌하우스 조감', preview: isoImg, setPreview: setIsoImg },
                            { icon: '👁️', label: 'Perspective View', note: '인간 시점 투시도', preview: perspImg, setPreview: setPerspImg },
                        ].map((item, i) => (
                            <ResultUploadSlot
                                key={i}
                                label={item.label}
                                note={item.note}
                                icon={item.icon}
                                stageColor={STAGE_COLOR}
                                preview={item.preview}
                                onPreviewChange={item.setPreview}
                            />
                        ))}
                        <div style={{
                            padding: '10px 12px', background: `${STAGE_COLOR}10`,
                            border: `1px solid ${STAGE_COLOR}25`, borderRadius: 10,
                            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                            💡 Isometric은 Gemini 이미지 생성 또는 ChatGPT DALL·E에, Perspective는 이미지 업로드 + 프롬프트로 사용하세요.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
