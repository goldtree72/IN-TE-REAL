'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import StageProgress from '@/components/stage/StageProgress';
import PromptWorkspace from '@/components/stage/PromptWorkspace';
import ResultUploadSlot from '@/components/stage/ResultUploadSlot';

const STAGE_COLOR = '#528A42';

const ZONE_OPTIONS = [
    { value: 'public', label: '공용', color: '#E8857A' },
    { value: 'core', label: '핵심', color: '#7AC5A0' },
    { value: 'support', label: '지원', color: '#E8C87A' },
    { value: 'service', label: '서비스', color: '#B5A8D5' },
];

interface SpaceRow { id: number; name: string; zone: string; area: string; }

let _rowId = 10;

/* ── Prompt builder ── */
const buildPrompt = (corridor: string, usage: string, spaces: SpaceRow[], hasImage: boolean) => {
    const filtered = spaces.filter(s => s.name && s.area);
    if (!corridor || !usage || filtered.length === 0) return '';

    const corridorLabel = corridor === 'single' ? 'single-loaded' : 'double-loaded';
    const corridorKr = corridor === 'single' ? '단일편복도' : '중복도';

    const spacesJson = filtered
        .map(s => `      { "name": "${s.name}", "zone": "${s.zone}", "area_m2": ${s.area} }`)
        .join(',\n');

    const imageNote = hasImage
        ? `[첨부 이미지: 코어·기둥·외벽만 표시된 기본 평면도를 분석하여 조닝하세요]`
        : `[평면도 미첨부: 아래 공간 정보만으로 조닝 3안을 생성하세요]`;

    return `${imageNote}

STEP 1 — 복도 유형: ${corridorKr} (${corridorLabel})

STEP 2 — 공간 정보:
  건물 용도: ${usage}
  공간 목록:
[
${spacesJson}
]

STEP 3 — 도면 생성 요청 (AI 자동 수행):
{
  "zoning_logic": {
    "corridor_type": "${corridorLabel}",
    "hierarchy": "Public → Core → Support → Service",
    "public_zone_rules": {
      "internal_walls": "NONE — no partition walls within the public zone",
      "corridor_boundary": "COMPLETELY OPEN — no wall, door, or opening between public zone and corridor"
    },
    "entry_rules": {
      "position": "FIXED at bottom exterior wall, left side (~1/4 from left edge)",
      "symbol": "Door swing arc opening inward + vertical entry arrow below"
    },
    "corridor_width": { "dimension_on_drawing": "Show net clear width only (mm)" },
    "constraint": "Do NOT alter, move, or resize any existing walls or structural elements"
  },
  "dimension_rules": {
    "basis": "Wall centerlines (CL)",
    "tick_style": "Architectural Tick '/' slash at every dim endpoint. No arrows.",
    "unit": "mm",
    "row_spacing": "Minimum 24px between parallel dim rows"
  },
  "visual_style": {
    "type": "2D Architectural Floor Plan",
    "coloring": "Public=coral, Core=mint, Support=warm yellow, Service=lavender, Corridor=warm gray",
    "no_legal_text": "Do NOT include building code references or regulatory citations"
  },
  "output": {
    "count": 3,
    "format": "각각 독립된 이미지로 3가지 조닝 대안 제시",
    "per_alternative": "각 안마다 동선 분석 코멘트 + 장단점 포함"
  }
}`;
};

/* ══════════════════════════════════════
   Main FLOW Page
══════════════════════════════════════ */
export default function FlowPage() {
    const [corridor, setCorridor] = useState<'single' | 'double' | ''>('');
    const [usage, setUsage] = useState('');
    const [spaces, setSpaces] = useState<SpaceRow[]>([
        { id: 1, name: '대기실', zone: 'public', area: '18' },
        { id: 2, name: '접수', zone: 'public', area: '10' },
        { id: 3, name: '핵심 공간', zone: 'core', area: '15' },
    ]);

    // Floor plan upload
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [hasImage, setHasImage] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processImage = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = ev => { setImagePreview(ev.target?.result as string); setHasImage(true); };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) processImage(file);
    }, [processImage]);

    const addRow = () => setSpaces(prev => [...prev, { id: _rowId++, name: '', zone: 'public', area: '' }]);
    const removeRow = (id: number) => setSpaces(prev => prev.filter(r => r.id !== id));
    const updateRow = (id: number, field: keyof SpaceRow, value: string) =>
        setSpaces(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    const [isGenerating, setIsGenerating] = useState(false);
    const [flowImgs, setFlowImgs] = useState<(string | null)[]>([null, null, null]);

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
                setFlowImgs(prev => {
                    const next = [...prev];
                    const emptyIdx = next.findIndex(img => img === null);
                    if (emptyIdx !== -1) next[emptyIdx] = data.image;
                    else next[2] = data.image; // overwrite last
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

    const updateFlowImg = (idx: number, val: string | null) => {
        setFlowImgs(prev => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const prompt = useMemo(() => buildPrompt(corridor, usage, spaces, hasImage), [corridor, usage, spaces, hasImage]);

    return (
        <div style={{ padding: '16px 24px 0' }}>
            <StageProgress />

            <div className="stage-workspace" style={{ height: 'calc(100vh - 92px - 100px)' }}>

                {/* ── LEFT: Input Panel ── */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">입력 패널</div>
                        <div className="stage-col-subtitle">01 FLOW — 공간 조닝</div>
                    </div>
                    <div className="stage-col-body">

                        {/* ① Floor plan upload */}
                        <div>
                            <label className="stage-label">① 기준 평면도 업로드 (선택)</label>
                            <div
                                className={`upload-zone ${dragging ? 'drag-over' : ''}`}
                                style={{ padding: '14px 12px', borderColor: dragging ? STAGE_COLOR : undefined }}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef} type="file" accept="image/*"
                                    style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) processImage(f); }}
                                />
                                {imagePreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={imagePreview} alt="평면도" style={{ width: '100%', maxHeight: 110, objectFit: 'contain', borderRadius: 6 }} />
                                ) : (
                                    <>
                                        <div className="upload-zone-icon">📐</div>
                                        <div className="upload-zone-text">
                                            코어·기둥·외벽만 있는 기본 평면도<br />
                                            <span style={{ fontSize: 10, opacity: 0.6 }}>AI 툴에 함께 첨부하면 더 정확한 결과</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            {imagePreview && (
                                <button
                                    onClick={() => { setImagePreview(null); setHasImage(false); }}
                                    style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                                >✕ 이미지 제거</button>
                            )}
                        </div>

                        {/* ② Corridor type */}
                        <div>
                            <label className="stage-label">② 복도 유형 선택</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                    { val: 'single', label: '단일편복도', desc: '병원·학교·호텔' },
                                    { val: 'double', label: '중복도', desc: '사무소·기숙사·아파트' },
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        className={`stage-option-btn ${corridor === opt.val ? 'selected' : ''}`}
                                        style={{ textAlign: 'left', padding: '9px 12px', color: corridor === opt.val ? STAGE_COLOR : undefined }}
                                        onClick={() => setCorridor(opt.val as 'single' | 'double')}
                                    >
                                        <div style={{ fontWeight: 700 }}>{opt.label}</div>
                                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.7 }}>{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ③ Usage */}
                        <div>
                            <label className="stage-label">③ 건물 용도</label>
                            <input
                                className="stage-input"
                                placeholder="예: 소규모 의원, 어린이집, 사무소"
                                value={usage}
                                onChange={e => setUsage(e.target.value)}
                            />
                        </div>

                        {/* ④ Space list */}
                        <div>
                            <label className="stage-label">④ 공간 목록</label>
                            <table className="space-table">
                                <thead>
                                    <tr><th>실명</th><th>존</th><th style={{ width: 44 }}>㎡</th><th style={{ width: 20 }}></th></tr>
                                </thead>
                                <tbody>
                                    {spaces.map(row => (
                                        <tr key={row.id}>
                                            <td><input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} placeholder="실명" /></td>
                                            <td>
                                                <select value={row.zone} onChange={e => updateRow(row.id, 'zone', e.target.value)}>
                                                    {ZONE_OPTIONS.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                                                </select>
                                            </td>
                                            <td><input type="number" value={row.area} onChange={e => updateRow(row.id, 'area', e.target.value)} placeholder="0" min="0" /></td>
                                            <td><button onClick={() => removeRow(row.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 12 }}>✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="space-row-add" onClick={addRow}>+ 공간 추가</div>
                        </div>

                        {/* Zone legend */}
                        <div>
                            <label className="stage-label">존 구분 범례</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {ZONE_OPTIONS.map(z => (
                                    <div key={z.value} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 2, background: z.color, display: 'inline-block' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{z.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Prompt workspace ── */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">프롬프트 워크스페이스</div>
                        <div className="stage-col-subtitle">AI 조닝 프롬프트 자동 생성 · 복사 후 AI 툴에 붙여넣기</div>
                    </div>
                    <div className="stage-col-body">
                        <PromptWorkspace
                            prompt={prompt}
                            stageColor={STAGE_COLOR}
                            hint={
                                hasImage
                                    ? '평면도 이미지와 이 프롬프트를 함께 AI 툴(ImageFX, Midjourney 등)에 붙여넣으세요. 평면도를 첨부하면 구조에 맞는 조닝이 생성됩니다.'
                                    : '입력 완료 후 프롬프트를 복사하여 Google ImageFX, Midjourney, 나노바나나Pro 등 원하는 AI 이미지 생성 툴에 붙여넣으세요. 평면도 이미지를 추가하면 더 정확한 결과를 얻을 수 있습니다.'
                            }
                            onAutoGenerate={handleAutoGenerate}
                            isGenerating={isGenerating}
                        />

                        {/* Workflow guide */}
                        {prompt && (
                            <div style={{
                                padding: '12px 14px',
                                background: 'rgba(255,255,255,0.4)',
                                border: '1px solid rgba(255,255,255,0.65)',
                                borderRadius: 10, fontSize: 11, lineHeight: 1.8,
                                color: 'var(--text-secondary)',
                            }}>
                                <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)', fontSize: 12 }}>
                                    📋 진행 순서
                                </div>
                                {[
                                    hasImage ? '평면도 이미지 + 프롬프트 복사 → AI 툴에 붙여넣기' : '프롬프트 복사 → AI 이미지 생성 툴에 붙여넣기',
                                    'AI가 생성한 조닝 대안 이미지 3장 저장',
                                    '우측 갤러리의 각 슬롯에 결과 이미지 업로드',
                                    '최종안 선택 후 TONE 단계로 진행',
                                ].map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <span style={{
                                            flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                                            background: `${STAGE_COLOR}20`, color: STAGE_COLOR,
                                            fontSize: 10, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>{i + 1}</span>
                                        {step}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Output gallery ── */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">결과물 갤러리</div>
                        <div className="stage-col-subtitle">AI 생성 조닝 플랜 3안 · 클릭하여 업로드</div>
                    </div>
                    <div className="stage-col-body">
                        <ResultUploadSlot label="안 A — 개방형" note="동선 최소화, 오픈 레이아웃" icon="🏗️" stageColor={STAGE_COLOR} preview={flowImgs[0]} onPreviewChange={val => updateFlowImg(0, val)} />
                        <ResultUploadSlot label="안 B — 균형형" note="기능과 동선의 균형" icon="⚖️" stageColor={STAGE_COLOR} preview={flowImgs[1]} onPreviewChange={val => updateFlowImg(1, val)} />
                        <ResultUploadSlot label="안 C — 효율형" note="면적 활용 극대화" icon="📐" stageColor={STAGE_COLOR} preview={flowImgs[2]} onPreviewChange={val => updateFlowImg(2, val)} />

                        <div style={{
                            padding: '10px 12px', background: `${STAGE_COLOR}10`,
                            border: `1px solid ${STAGE_COLOR}25`, borderRadius: 10,
                            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                            💡 AI 툴에서 생성한 조닝 플랜 이미지를 각 슬롯에 업로드하세요. 최종안을 선택하면 TONE 단계로 넘어갑니다.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
