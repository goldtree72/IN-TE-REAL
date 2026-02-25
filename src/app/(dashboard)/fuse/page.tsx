'use client';

import { useState, useMemo } from 'react';
import StageProgress from '@/components/stage/StageProgress';
import PromptWorkspace from '@/components/stage/PromptWorkspace';
import ImageUploadZone from '@/components/stage/ImageUploadZone';
import ResultUploadSlot from '@/components/stage/ResultUploadSlot';

const STAGE_COLOR = '#B04428';

const STYLE_KEYWORDS = [
    ['미니멀리스트', '젠 스타일', '클린 라인'],
    ['럭셔리 컨템포러리', '하이엔드', '마블 & 골드'],
    ['인더스트리얼', '노출 콘크리트', '블랙 스틸'],
    ['보헤미안', '워머 팔레트', '레이어드 텍스처'],
    ['스칸디나비안', '내추럴 우드', '화이트 & 베이지'],
    ['재패니즈 와비사비', '내추럴 소재', '절제된 미학'],
];

const buildPrompt = (
    structureUploaded: boolean,
    referenceCount: number,
    styleStrength: number,
    keywords: string[],
    additionalNotes: string,
): string => {
    if (!structureUploaded) return '';

    const structWeight = 100 - styleStrength;
    const refWeight = styleStrength;
    const keywordStr = keywords.length > 0 ? keywords.join(', ') : '스타일 키워드 미선택';

    return `{
  "task": "Style DNA Transfer — Geometry Lock + Reference Style Fusion",
  "master_constraint": {
    "geometry": "ABSOLUTE STRUCTURE LOCK — Do NOT alter, move, or resize any wall, column, or architectural element.",
    "camera": "FIXED camera angle and position from the source 3D mass image."
  },
  "source_image": {
    "type": "3D massing / structural base image",
    "role": "Defines all geometry, proportions, and spatial volumes. Treated as immutable."
  },
  "reference_images": {
    "count": ${referenceCount > 0 ? referenceCount : 1},
    "role": "Style DNA extraction only — extract aesthetic, material palette, and lighting mood",
    "extract": ["color palette", "material textures", "lighting atmosphere", "decorative language"]
  },
  "style_fusion": {
    "structure_weight": ${structWeight}%,
    "style_weight": ${refWeight}%,
    "target_keywords": "${keywordStr}",
    "output_mood": "Photorealistic architectural interior visualization"
  },
  "rendering": {
    "quality": "8K ultra-photorealistic CGI, Octane/V-Ray style",
    "lighting": "Natural global illumination derived from reference images",
    "materials": "PBR physically-correct shading — transfer textures from reference, apply to structure geometry"
  }${additionalNotes ? `,\n  "additional_notes": "${additionalNotes}"` : ''},
  "output": "Single high-fidelity interior image — structure from source, aesthetic DNA from references"
}`;
};

export default function FusePage() {
    const [structureUploaded, setStructureUploaded] = useState(false);
    const [referenceCount, setReferenceCount] = useState(0);
    const [styleStrength, setStyleStrength] = useState(65);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [fuseImgs, setFuseImgs] = useState<(string | null)[]>([null, null, null]);

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
                setFuseImgs(prev => {
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

    const updateFuseImg = (idx: number, val: string | null) => {
        setFuseImgs(prev => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const toggleKeyword = (kw: string) => {
        setSelectedKeywords(prev =>
            prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
        );
    };

    const prompt = useMemo(
        () => buildPrompt(structureUploaded, referenceCount, styleStrength, selectedKeywords, additionalNotes),
        [structureUploaded, referenceCount, styleStrength, selectedKeywords, additionalNotes]
    );

    return (
        <div style={{ padding: '16px 24px 0' }}>
            <StageProgress />
            <div className="stage-workspace" style={{ height: 'calc(100vh - 92px - 100px)' }}>

                {/* Input panel */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">입력 패널</div>
                        <div className="stage-col-subtitle">04 FUSE — 믹스보드 & 컨셉</div>
                    </div>
                    <div className="stage-col-body">
                        {/* Structure upload */}
                        <div>
                            <label className="stage-label">① 3D 매스 이미지 (Structure)</label>
                            <ImageUploadZone
                                label="3D 볼륨 이미지 업로드 (RISE 결과물)"
                                stageColor={STAGE_COLOR}
                                onFiles={files => setStructureUploaded(files.length > 0)}
                            />
                        </div>

                        {/* Reference images */}
                        <div>
                            <label className="stage-label">② 레퍼런스 이미지 (Style DNA)</label>
                            <ImageUploadZone
                                label="레퍼런스 이미지 여러 장 업로드 (Pinterest 등)"
                                stageColor={STAGE_COLOR}
                                multiple
                                previewMode="grid"
                                onFiles={files => setReferenceCount(files.length)}
                            />
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                                레퍼런스 이미지에서 색채, 재질, 분위기만 추출합니다. 구조는 변경되지 않습니다.
                            </p>
                        </div>

                        {/* Style strength */}
                        <div>
                            <label className="stage-label">③ 스타일 강도 ({styleStrength}%)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🏗️ 구조 유지</span>
                                <input
                                    type="range" min="20" max="80" value={styleStrength}
                                    onChange={e => setStyleStrength(Number(e.target.value))}
                                    className="stage-slider"
                                    style={{ flex: 1, accentColor: STAGE_COLOR }}
                                />
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🎨 스타일 우세</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                <span>구조 {100 - styleStrength}%</span>
                                <span>스타일 {styleStrength}%</span>
                            </div>
                        </div>

                        {/* Style keywords */}
                        <div>
                            <label className="stage-label">④ 스타일 키워드 (복수 선택 가능)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {STYLE_KEYWORDS.map((group, gi) => (
                                    <div key={gi} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {group.map(kw => (
                                            <button
                                                key={kw}
                                                onClick={() => toggleKeyword(kw)}
                                                style={{
                                                    fontSize: 10, fontWeight: 600, padding: '4px 10px',
                                                    borderRadius: 12,
                                                    border: `1.5px solid ${selectedKeywords.includes(kw) ? STAGE_COLOR : 'rgba(200,200,200,0.4)'}`,
                                                    background: selectedKeywords.includes(kw) ? `${STAGE_COLOR}18` : 'rgba(255,255,255,0.35)',
                                                    color: selectedKeywords.includes(kw) ? STAGE_COLOR : 'var(--text-secondary)',
                                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                                }}
                                            >{kw}</button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional notes */}
                        <div>
                            <label className="stage-label">⑤ 추가 요청 사항</label>
                            <textarea
                                className="stage-textarea"
                                placeholder="특이 사항이나 강조할 요소를 자유롭게 입력하세요.&#10;예: 주방 아일랜드는 마블 상판으로, 조명은 황동 펜던트로"
                                value={additionalNotes}
                                onChange={e => setAdditionalNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Prompt workspace */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">프롬프트 워크스페이스</div>
                        <div className="stage-col-subtitle">스타일 전이(Style Transfer) 프롬프트</div>
                    </div>
                    <div className="stage-col-body">
                        <PromptWorkspace
                            prompt={prompt}
                            stageColor={STAGE_COLOR}
                            hint="3D 매스 이미지와 레퍼런스 이미지를 함께 AI에 업로드하고 이 프롬프트를 붙여넣으세요. 구조는 유지하면서 레퍼런스의 스타일 DNA만 전이됩니다."
                            onAutoGenerate={handleAutoGenerate}
                            isGenerating={isGenerating}
                        />
                    </div>
                </div>

                {/* Output gallery */}
                <div className="stage-col">
                    <div className="stage-col-header" style={{ borderTop: `3px solid ${STAGE_COLOR}` }}>
                        <div className="stage-col-title">결과물 갤러리</div>
                        <div className="stage-col-subtitle">컨셉 비교 (A / B / C)</div>
                    </div>
                    <div className="stage-col-body">
                        {['컨셉 A', '컨셉 B', '컨셉 C'].map((label, i) => (
                            <ResultUploadSlot
                                key={i}
                                label={label}
                                note="이 컨셉으로 진행 →"
                                icon="🎭"
                                stageColor={STAGE_COLOR}
                                preview={fuseImgs[i]}
                                onPreviewChange={val => updateFuseImg(i, val)}
                            />
                        ))}
                        <div style={{
                            padding: '10px 12px', background: `${STAGE_COLOR}10`,
                            border: `1px solid ${STAGE_COLOR}25`, borderRadius: 10,
                            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
                        }}>
                            💡 레퍼런스 이미지를 바꾸어 가며 동일 구조에 다양한 스타일을 테스트하세요.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
