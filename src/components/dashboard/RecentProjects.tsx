'use client';

import { useState } from 'react';

import { useProjectStore, progressPercent, stageLabel, StageKey } from '@/lib/useProjectStore';


interface FormattedProject {
    originalId: string;
    name: string;
    stage: string;
    stageKey: StageKey;
    status: string;
    time: string;
    progress: number;
    location: string;
    area: string;
    client: string;
    detail: {
        summary: string;
        outputs: string[];
        subSteps: { label: string; pct: number }[];
        nextAction: string;
        issues?: string;
    };
}



// Stage-specific glass styles for hover
const stageHoverStyle: Record<StageKey, React.CSSProperties> = {
    flow: {
        background: 'rgba(122, 155, 112, 0.22)',
        borderColor: 'rgba(160, 200, 148, 0.6)',
        boxShadow: '0 1px 0 rgba(200,240,190,0.75) inset, 0 -1px 0 rgba(80,110,70,0.12) inset, 0 6px 22px rgba(80,120,70,0.2), 0 16px 40px rgba(60,100,55,0.14)',
    },
    tone: {
        background: 'rgba(210, 175, 100, 0.22)',
        borderColor: 'rgba(240, 205, 130, 0.6)',
        boxShadow: '0 1px 0 rgba(255,240,190,0.8) inset, 0 -1px 0 rgba(140,100,40,0.12) inset, 0 6px 22px rgba(180,130,50,0.2), 0 16px 40px rgba(140,100,40,0.14)',
    },
    rise: {
        background: 'rgba(165, 135, 100, 0.20)',
        borderColor: 'rgba(200, 170, 135, 0.6)',
        boxShadow: '0 1px 0 rgba(240,215,185,0.75) inset, 0 -1px 0 rgba(110,80,50,0.12) inset, 0 6px 22px rgba(140,105,70,0.2), 0 16px 40px rgba(110,80,50,0.14)',
    },
    fuse: {
        background: 'rgba(185, 120, 95, 0.20)',
        borderColor: 'rgba(220, 155, 130, 0.6)',
        boxShadow: '0 1px 0 rgba(255,210,195,0.75) inset, 0 -1px 0 rgba(130,70,50,0.12) inset, 0 6px 22px rgba(170,100,75,0.2), 0 16px 40px rgba(130,70,50,0.14)',
    },
    lens: {
        background: 'rgba(100, 125, 175, 0.20)',
        borderColor: 'rgba(145, 170, 220, 0.6)',
        boxShadow: '0 1px 0 rgba(200,215,255,0.75) inset, 0 -1px 0 rgba(60,80,130,0.12) inset, 0 6px 22px rgba(80,105,160,0.2), 0 16px 40px rgba(60,80,130,0.14)',
    },
};

const stageGradients: Record<StageKey, string> = {
    flow: 'linear-gradient(90deg, rgba(148,195,135,0.35) 0%, #528A42 100%)',
    tone: 'linear-gradient(90deg, rgba(220,190,120,0.35) 0%, #C08018 100%)',
    rise: 'linear-gradient(90deg, rgba(190,158,115,0.35) 0%, #8B5E2A 100%)',
    fuse: 'linear-gradient(90deg, rgba(215,148,120,0.35) 0%, #B04428 100%)',
    lens: 'linear-gradient(90deg, rgba(130,158,210,0.35) 0%, #3458AA 100%)',
};

const stageDotColor: Record<StageKey, string> = {
    flow: '#528A42',
    tone: '#C08018',
    rise: '#8B5E2A',
    fuse: '#B04428',
    lens: '#3458AA',
};

const subStageColors: string[] = ['#528A42', '#C08018', '#8B5E2A', '#B04428', '#3458AA'];

export default function RecentProjects() {
    const { projects: storeProjects, STAGE_ORDER } = useProjectStore();
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selected, setSelected] = useState<FormattedProject | null>(null);

    // Map the robust store projects to the simpler format required by the UI
    const projects: FormattedProject[] = storeProjects.map(p => {
        const prog = progressPercent(p);
        const subSteps = STAGE_ORDER.map(s => ({
            label: stageLabel[s],
            pct: p.stages[s]?.completedAt ? 100 : (p.currentStage === s ? 50 : 0)
        }));

        return {
            originalId: p.id,
            name: p.name,
            stage: stageLabel[p.currentStage],
            stageKey: p.currentStage,
            status: p.stages[p.currentStage]?.completedAt ? '진행 완료' : '진행 중',
            time: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '방금 전',
            progress: prog,
            location: p.location || '-',
            area: p.usage || '-',
            client: p.client || '-',
            detail: {
                summary: `${p.name} 프로젝트의 데이터베이스 진행 상황입니다.`,
                outputs: [
                    '진행 중인 파이프라인 데이터 동기화 완료'
                ],
                subSteps,
                nextAction: '다음 파이프라인 단계 진행 요망'
            }
        };
    });

    return (
        <>
            {/* Scrollable project list */}
            <div
                style={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    paddingRight: 2,
                    /* Custom scrollbar via CSS */
                }}
            >
                {/* Table header */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 180px 80px',
                        padding: '4px 14px 10px',
                    }}
                >
                    {['프로젝트명', '현재 단계', '상태', '진행률', '업데이트'].map((h) => (
                        <span
                            key={h}
                            style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                        >
                            {h}
                        </span>
                    ))}
                </div>

                {/* Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {projects.length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                            진행 중인 프로젝트가 없습니다.
                        </div>
                    )}
                    {projects.map((proj) => {
                        const isHovered = hoveredId === proj.name;
                        const baseStyle: React.CSSProperties = {
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 180px 80px',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.45)',
                            background: 'rgba(255,255,255,0.28)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            cursor: 'pointer',
                            transition: 'all 0.22s ease',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 8px rgba(0,0,0,0.05)',
                            transform: 'translateY(0)',
                        };

                        const hoverStyle: React.CSSProperties = isHovered
                            ? {
                                ...stageHoverStyle[proj.stageKey],
                                border: `1px solid ${stageHoverStyle[proj.stageKey].borderColor}`,
                                backdropFilter: 'blur(28px) saturate(150%)',
                                WebkitBackdropFilter: 'blur(28px) saturate(150%)',
                                transform: 'translateY(-2px) translateX(1px)',
                            }
                            : {};

                        return (
                            <div
                                key={proj.name}
                                style={{ ...baseStyle, ...hoverStyle }}
                                onMouseEnter={() => setHoveredId(proj.name)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => setSelected(proj)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && setSelected(proj)}
                                aria-label={`${proj.name} 상세 보기`}
                            >
                                {/* Project name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: stageDotColor[proj.stageKey],
                                            flexShrink: 0,
                                            boxShadow: isHovered ? `0 0 6px ${stageDotColor[proj.stageKey]}` : 'none',
                                            transition: 'box-shadow 0.2s ease',
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {proj.name}
                                    </span>
                                </div>

                                {/* Stage badge */}
                                <span
                                    className={`stage-${proj.stageKey}`}
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        padding: '3px 10px',
                                        borderRadius: 20,
                                        border: '1px solid',
                                        display: 'inline-block',
                                        width: 'fit-content',
                                    }}
                                >
                                    {proj.stage}
                                </span>

                                {/* Status */}
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{proj.status}</span>

                                {/* Progress bar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 5,
                                            background: 'rgba(0,0,0,0.07)',
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${proj.progress}%`,
                                                background: stageGradients[proj.stageKey],
                                                borderRadius: 3,
                                                transition: 'width 0.8s cubic-bezier(0.25,1,0.5,1)',
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: stageDotColor[proj.stageKey],
                                            width: 32,
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {proj.progress}%
                                    </span>
                                </div>

                                {/* Time */}
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{proj.time}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Detail Modal ────────────────────────────────────────── */}
            {selected && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && setSelected(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${selected.name} 프로젝트 상세`}
                >
                    <div className="modal-panel" style={{ width: 580 }}>
                        {/* Header */}
                        <div
                            style={{
                                padding: '22px 24px 16px',
                                borderBottom: '1px solid rgba(0,0,0,0.07)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                {/* Stage badge */}
                                <span
                                    className={`stage-${selected.stageKey}`}
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        letterSpacing: '0.12em',
                                        padding: '3px 10px',
                                        borderRadius: 20,
                                        border: '1px solid',
                                        display: 'inline-block',
                                        marginBottom: 10,
                                    }}
                                >
                                    {selected.stage} — {selected.status}
                                </span>
                                <h2
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: 'var(--text-primary)',
                                        letterSpacing: '-0.02em',
                                        marginBottom: 8,
                                    }}
                                >
                                    {selected.name}
                                </h2>
                                {/* Meta info */}
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    {[
                                        { icon: '📍', val: selected.location },
                                        { icon: '📐', val: selected.area },
                                        { icon: '👤', val: selected.client },
                                    ].map((m) => (
                                        <span key={m.val} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {m.icon} {m.val}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.06)',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginLeft: 12,
                                }}
                                aria-label="닫기"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Pipeline sub-steps */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                                파이프라인 진행 현황
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selected.detail.subSteps.map((step, i) => (
                                    <div key={step.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: step.pct > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                {step.label}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: step.pct === 100 ? subStageColors[i] : step.pct > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                                                }}
                                            >
                                                {step.pct === 100 ? '✓ 완료' : step.pct > 0 ? `${step.pct}%` : '대기'}
                                            </span>
                                        </div>
                                        <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${step.pct}%`,
                                                    background: `linear-gradient(90deg, ${subStageColors[i]}55 0%, ${subStageColors[i]} 100%)`,
                                                    borderRadius: 3,
                                                    transition: 'width 0.7s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current stage summary */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                                현재 단계 결과물
                            </p>
                            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-primary)', marginBottom: 12 }}>
                                {selected.detail.summary}
                            </p>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {selected.detail.outputs.map((out, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            fontSize: 12,
                                            color: 'var(--text-primary)',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: '50%',
                                                background: stageDotColor[selected.stageKey],
                                                flexShrink: 0,
                                                marginTop: 5,
                                            }}
                                        />
                                        {out}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Issue alert (if any) */}
                        {selected.detail.issues && (
                            <div
                                style={{
                                    margin: '0 24px',
                                    padding: '10px 14px',
                                    background: 'rgba(195,130,140,0.12)',
                                    border: '1px solid rgba(230,170,180,0.45)',
                                    borderRadius: 10,
                                    marginTop: 14,
                                    fontSize: 12,
                                    color: '#6a1f30',
                                    lineHeight: 1.55,
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                                {selected.detail.issues}
                            </div>
                        )}

                        {/* Next action */}
                        <div style={{ padding: '16px 24px 22px' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                                다음 단계
                            </p>
                            <div
                                style={{
                                    padding: '12px 14px',
                                    background: `${stageDotColor[selected.stageKey]}14`,
                                    border: `1px solid ${stageDotColor[selected.stageKey]}33`,
                                    borderRadius: 10,
                                    fontSize: 12,
                                    color: stageDotColor[selected.stageKey],
                                    lineHeight: 1.55,
                                    fontWeight: 500,
                                }}
                            >
                                → {selected.detail.nextAction}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
