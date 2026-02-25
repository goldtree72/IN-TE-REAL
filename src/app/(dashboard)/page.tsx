'use client';

import Link from 'next/link';
import ActivityLog from '@/components/dashboard/ActivityLog';
import RecentProjects from '@/components/dashboard/RecentProjects';
import { useProjectStore } from '@/lib/useProjectStore';

export default function DashboardPage() {
    const { projects, prompts, STAGE_ORDER } = useProjectStore();

    // 1. Calculate dynamic stats
    const totalProjects = projects.length;
    let completedStages = 0;
    projects.forEach(p => {
        completedStages += Object.keys(p.stages).filter(k => p.stages[k as keyof typeof p.stages]?.completedAt).length;
    });

    const statCards = [
        {
            label: '총 프로젝트',
            value: totalProjects.toString(),
            unit: '건',
            change: '실시간 연동',
            positive: true,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
            ),
            accent: '#C9A96E',
        },
        {
            label: '저장된 프롬프트',
            value: prompts.length.toString(),
            unit: '개',
            change: 'Cloud Sync',
            positive: true,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
            accent: '#7A8C72',
        },
        {
            label: '달성된 스테이지',
            value: completedStages.toString(),
            unit: '개',
            change: '전체 프로젝트 합산',
            positive: true,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            ),
            accent: '#8B7355',
        },
        {
            label: '활성 세션',
            value: '1',
            unit: '개',
            change: 'Mission Control',
            positive: true,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            ),
            accent: '#6B8BAA',
        },
    ];

    const stageGradients: Record<string, string> = {
        flow: 'linear-gradient(90deg, rgba(148, 195, 135, 0.35) 0%, #528A42 100%)',
        tone: 'linear-gradient(90deg, rgba(220, 190, 120, 0.35) 0%, #C08018 100%)',
        rise: 'linear-gradient(90deg, rgba(190, 158, 115, 0.35) 0%, #8B5E2A 100%)',
        fuse: 'linear-gradient(90deg, rgba(215, 148, 120, 0.35) 0%, #B04428 100%)',
        lens: 'linear-gradient(90deg, rgba(130, 158, 210, 0.35) 0%, #3458AA 100%)',
    };

    // 2. Calculate pipeline stages progression
    const pipelineStages = [
        { id: '01', label: 'FLOW', sub: 'Zoning', key: 'flow', done: projects.filter(p => p.stages.flow?.completedAt).length, total: Math.max(1, totalProjects) },
        { id: '02', label: 'TONE', sub: 'Coloring', key: 'tone', done: projects.filter(p => p.stages.tone?.completedAt).length, total: Math.max(1, totalProjects) },
        { id: '03', label: 'RISE', sub: 'Isometry', key: 'rise', done: projects.filter(p => p.stages.rise?.completedAt).length, total: Math.max(1, totalProjects) },
        { id: '04', label: 'FUSE', sub: 'Mix Board', key: 'fuse', done: projects.filter(p => p.stages.fuse?.completedAt).length, total: Math.max(1, totalProjects) },
        { id: '05', label: 'LENS', sub: 'AI Rendering', key: 'lens', done: projects.filter(p => p.stages.lens?.completedAt).length, total: Math.max(1, totalProjects) },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Page header */}
            <div className="animate-fadeInUp" style={{ marginBottom: 28 }}>
                <h2
                    style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                        marginBottom: 4,
                    }}
                >
                    오늘의 현황
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    AI 오케스트레이션 파이프라인 실시간 모니터링
                </p>
            </div>

            {/* Stat Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {statCards.map((card, i) => (
                    <div
                        key={card.label}
                        className="glass-card animate-fadeInUp"
                        style={{
                            padding: '18px 20px',
                            animationDelay: `${i * 0.08}s`,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: `${card.accent}1a`,
                                    border: `1px solid ${card.accent}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: card.accent,
                                }}
                            >
                                {card.icon}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {card.value}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{card.unit}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{card.label}</p>
                        <p style={{ fontSize: 11, color: card.positive ? '#7A8C72' : '#B87355', fontWeight: 500 }}>↑ {card.change}</p>
                    </div>
                ))}
            </div>

            {/* Lower grid: Pipeline + Activity + Projects */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                {/* Pipeline Progress */}
                <div
                    className="glass-card animate-fadeInUp"
                    style={{ padding: '22px 24px', animationDelay: '0.35s' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Cinematic Pipeline</h3>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{totalProjects}개 활성 프로젝트 처리 상태</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {pipelineStages.map((stage) => {
                            const pct = Math.round((stage.done / stage.total) * 100);
                            return (
                                <div key={stage.key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span
                                                className={`stage-${stage.key}`}
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    letterSpacing: '0.1em',
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    border: '1px solid',
                                                }}
                                            >
                                                {stage.id} {stage.label}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stage.sub}</span>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {stage.done}/{stage.total}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: 5,
                                            background: 'rgba(0,0,0,0.07)',
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: stageGradients[stage.key],
                                                borderRadius: 3,
                                                transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI Activity Feed */}
                <div
                    className="glass-card animate-fadeInUp"
                    style={{ padding: '22px 24px', animationDelay: '0.42s' }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI 활동 로그</h3>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>자율 에이전트 실시간 처리 내역 · 클릭하여 상세 확인</p>
                    </div>
                    <ActivityLog />
                </div>
            </div>

            {/* Recent Projects — interactive client component */}
            <div
                className="glass-card animate-fadeInUp"
                style={{ padding: '22px 24px', animationDelay: '0.5s' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>최근 프로젝트</h3>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>진행 중인 AI 파이프라인 프로젝트 · 클릭하여 상세 확인</p>
                    </div>
                    <Link
                        href="/projects"
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--accent-warm)',
                            textDecoration: 'none',
                            padding: '5px 12px',
                            borderRadius: 20,
                            background: 'rgba(201,169,110,0.12)',
                            border: '1px solid rgba(201,169,110,0.3)',
                        }}
                    >
                        전체 보기 →
                    </Link>
                </div>
                <RecentProjects />
            </div>
        </div>
    );
}
