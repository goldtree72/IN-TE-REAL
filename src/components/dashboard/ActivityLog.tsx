'use client';

import { useState } from 'react';
import { useProjectStore, stageLabel, progressPercent } from '@/lib/useProjectStore';

type ActivityType = 'success' | 'processing' | 'info' | 'warning';

interface ActivityDetail {
    id: number;
    action: string;
    project: string;
    time: string;
    type: ActivityType;
    stage: string;
    result: string;
    direction: string[];
    nextStep: string;
    completionRate: number;
}



const typeLabel: Record<ActivityType, string> = {
    success: '완료',
    processing: '처리 중',
    info: '진행 중',
    warning: '검토 필요',
};

const typeDot: Record<ActivityType, string> = {
    success: '#7A8C72',
    processing: '#C9A96E',
    info: '#6B8BAA',
    warning: '#C97A8C',
};

export default function ActivityLog() {
    const { projects } = useProjectStore();
    const [selected, setSelected] = useState<ActivityDetail | null>(null);

    // Map projects to activity log format
    const activities: ActivityDetail[] = projects.slice(0, 5).map((p, i) => {
        const isCompleted = p.stages[p.currentStage]?.completedAt != null;
        let type: ActivityType = isCompleted ? 'success' : 'processing';
        if (!isCompleted && i % 3 === 0) type = 'info';

        return {
            id: i,
            action: `${stageLabel[p.currentStage]} ${isCompleted ? '단계 완료' : '단계 진행 중'}`,
            project: p.name,
            time: p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '방금',
            type,
            stage: stageLabel[p.currentStage],
            result: isCompleted ? '이 단계의 모든 작업 플로우가 성공적으로 저장되었습니다.' : '현재 디자인 파이프라인에서 작업이 진행되고 있습니다.',
            direction: [
                '로컬스토리지 자동 캐싱 적용 중',
                'Firebase Database 동기화 연결 상태 확인'
            ],
            nextStep: '다음 파이프라인 단계로 이동 대기',
            completionRate: progressPercent(p),
        };
    });

    return (
        <>
            {/* Activity items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activities.length === 0 && (
                    <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                        최근 활동 내역이 없습니다.
                    </div>
                )}
                {activities.map((item, i) => (
                    <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className={`activity-panel activity-${item.type}`}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '11px 14px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            width: '100%',
                            animationDelay: `${i * 0.06}s`,
                        }}
                    >
                        {/* Status dot */}
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: typeDot[item.type],
                                marginTop: 4,
                                flexShrink: 0,
                                boxShadow: `0 0 6px ${typeDot[item.type]}88`,
                            }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, letterSpacing: '0.02em' }}>
                                {item.action}
                            </p>
                            <p style={{ fontSize: 11, opacity: 0.62 }}>{item.project}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, opacity: 0.5, whiteSpace: 'nowrap' }}>{item.time}</span>
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    opacity: 0.7,
                                    padding: '2px 6px',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.35)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                }}
                            >
                                {typeLabel[item.type]}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* 90% time reduction badge */}
            <div
                style={{
                    marginTop: 14,
                    padding: '12px 16px',
                    background: 'rgba(201,169,110,0.1)',
                    border: '1px solid rgba(201,169,110,0.25)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <span style={{ fontSize: 18 }}>⚡</span>
                <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8a6630' }}>90% 시간 절감 달성</p>
                    <p style={{ fontSize: 11, color: '#a07840' }}>AI 자동화로 48시간 → 수 분으로 단축</p>
                </div>
            </div>

            {/* ─── Detail Modal ─── */}
            {selected && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && setSelected(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${selected.project} 상세 정보`}
                >
                    <div className="modal-panel">
                        {/* Modal header */}
                        <div
                            style={{
                                padding: '22px 24px 16px',
                                borderBottom: '1px solid rgba(0,0,0,0.07)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span
                                        style={{
                                            width: 9,
                                            height: 9,
                                            borderRadius: '50%',
                                            background: typeDot[selected.type],
                                            flexShrink: 0,
                                            boxShadow: `0 0 8px ${typeDot[selected.type]}99`,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: '0.1em',
                                            color: typeDot[selected.type],
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {typeLabel[selected.type]}
                                    </span>
                                </div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                                    {selected.project}
                                </h2>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{selected.stage}</p>
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

                        {/* Completion bar */}
                        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>AI 처리 진행률</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{selected.completionRate}%</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(0,0,0,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${selected.completionRate}%`,
                                        background: `linear-gradient(90deg, ${typeDot[selected.type]}, ${typeDot[selected.type]}99)`,
                                        borderRadius: 4,
                                        transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Current result */}
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <p
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    marginBottom: 10,
                                }}
                            >
                                현재 결과
                            </p>
                            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-primary)' }}>{selected.result}</p>
                        </div>

                        {/* AI direction */}
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <p
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    marginBottom: 10,
                                }}
                            >
                                AI 추진 방향
                            </p>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selected.direction.map((d, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            fontSize: 12,
                                            color: 'var(--text-primary)',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 6,
                                                background: `${typeDot[selected.type]}22`,
                                                border: `1px solid ${typeDot[selected.type]}44`,
                                                color: typeDot[selected.type],
                                                fontSize: 10,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                marginTop: 1,
                                            }}
                                        >
                                            {i + 1}
                                        </span>
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Next step */}
                        <div style={{ padding: '16px 24px 22px' }}>
                            <p
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    marginBottom: 10,
                                }}
                            >
                                다음 단계
                            </p>
                            <div
                                style={{
                                    padding: '12px 14px',
                                    background: 'rgba(201,169,110,0.1)',
                                    border: '1px solid rgba(201,169,110,0.28)',
                                    borderRadius: 10,
                                    fontSize: 12,
                                    color: '#7a5015',
                                    lineHeight: 1.55,
                                    fontWeight: 500,
                                }}
                            >
                                → {selected.nextStep}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
