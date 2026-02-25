'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    useProjectStore,
    completedStageCount,
    progressPercent,
    stageLabel,
    stageColor,
    type StageKey,
    type Project,
} from '@/lib/useProjectStore';
import { useFirebase } from '@/lib/useFirebase';

const STAGE_ORDER: StageKey[] = ['flow', 'tone', 'rise', 'fuse', 'lens'];
const USAGE_OPTIONS = [
    '소규모 의원', '치과', '피부과', '어린이집', '학원', '사무소',
    '카페', '레스토랑', '호텔·숙박', '주거 리모델링', '상업 매장', '기타',
];

// ── New Project Modal ───────────────────────────────────────────
function NewProjectModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (name: string, usage: string, client: string, location: string) => void;
}) {
    const [name, setName] = useState('');
    const [usage, setUsage] = useState('');
    const [client, setClient] = useState('');
    const [location, setLocation] = useState('');
    const canCreate = name.trim() && usage.trim();

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: 440, background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(20px)', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    padding: '28px 32px',
                }}
            >
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>
                    새 프로젝트 만들기
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
                    FLOW 단계부터 자동으로 시작됩니다
                </div>

                {[
                    { label: '프로젝트명 *', placeholder: '예: 강남 소아과 리모델링', val: name, set: setName },
                    { label: '의뢰인', placeholder: '예: 홍길동 원장님', val: client, set: setClient },
                    { label: '위치 / 현장', placeholder: '예: 서울 강남구', val: location, set: setLocation },
                ].map(({ label, placeholder, val, set }) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {label}
                        </label>
                        <input
                            className="stage-input"
                            placeholder={placeholder}
                            value={val}
                            onChange={e => set(e.target.value)}
                        />
                    </div>
                ))}

                {/* Usage */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        건물 용도 *
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {USAGE_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setUsage(opt)}
                                style={{
                                    fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 20,
                                    border: `1.5px solid ${usage === opt ? '#528A42' : 'rgba(180,180,180,0.5)'}`,
                                    background: usage === opt ? '#528A4218' : 'rgba(255,255,255,0.5)',
                                    color: usage === opt ? '#528A42' : 'var(--text-secondary)',
                                    cursor: 'pointer', transition: 'all 0.13s ease',
                                }}
                            >{opt}</button>
                        ))}
                    </div>
                    <input
                        className="stage-input"
                        style={{ marginTop: 8 }}
                        placeholder="직접 입력 (위에 없을 경우)"
                        value={USAGE_OPTIONS.includes(usage) ? '' : usage}
                        onChange={e => setUsage(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                            border: '1px solid rgba(180,180,180,0.5)', background: 'rgba(255,255,255,0.5)',
                            color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13,
                        }}
                    >취소</button>
                    <button
                        onClick={() => { if (canCreate) { onCreate(name.trim(), usage.trim(), client.trim(), location.trim()); onClose(); } }}
                        disabled={!canCreate}
                        style={{
                            flex: 2, padding: '10px', borderRadius: 10, cursor: canCreate ? 'pointer' : 'not-allowed',
                            border: 'none',
                            background: canCreate ? 'linear-gradient(135deg, #528A42, #3d6b30)' : 'rgba(200,200,200,0.5)',
                            color: '#fff', fontWeight: 700, fontSize: 13,
                            boxShadow: canCreate ? '0 4px 14px #528A4240' : 'none',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        ✦ 프로젝트 시작
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Project Card ────────────────────────────────────────────────
function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
    const completed = completedStageCount(project);
    const pct = progressPercent(project);
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(14px)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.75)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
            position: 'relative',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
        >
            {/* Color accent */}
            <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 3, borderRadius: '0 0 3px 3px', background: project.color }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 4 }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{project.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {project.usage}
                        {project.client && ` · ${project.client}`}
                    </div>
                </div>
                {/* Menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowMenu(s => !s)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 6 }}
                    >⋯</button>
                    {showMenu && (
                        <div style={{
                            position: 'absolute', right: 0, top: '100%', zIndex: 100,
                            background: 'rgba(255,255,255,0.95)', borderRadius: 10,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            border: '1px solid rgba(200,200,200,0.4)',
                            minWidth: 130, overflow: 'hidden',
                        }}>
                            <button
                                onClick={() => { setShowMenu(false); onDelete(); }}
                                style={{
                                    width: '100%', textAlign: 'left', padding: '10px 14px',
                                    border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: 12, color: '#c03030', fontWeight: 600,
                                }}
                            >🗑 프로젝트 삭제</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stage progress dots */}
            <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {STAGE_ORDER.map(s => {
                        const done = !!project.stages[s]?.completedAt;
                        const isCurrent = project.currentStage === s && !done;
                        return (
                            <div key={s} style={{
                                flex: 1, height: 5, borderRadius: 3,
                                background: done ? stageColor[s] : isCurrent ? `${stageColor[s]}50` : 'rgba(200,200,200,0.4)',
                                transition: 'background 0.2s ease',
                            }} title={stageLabel[s]} />
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>{completed}/5 단계 완료</span>
                    <span style={{ color: project.color, fontWeight: 700 }}>{pct}%</span>
                </div>
            </div>

            {/* Stage badges */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {STAGE_ORDER.map(s => {
                    const done = !!project.stages[s]?.completedAt;
                    const current = project.currentStage === s;
                    return (
                        <span key={s} style={{
                            fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: done ? `${stageColor[s]}20` : current ? `${stageColor[s]}10` : 'rgba(200,200,200,0.15)',
                            color: done ? stageColor[s] : current ? stageColor[s] : 'var(--text-muted)',
                            border: `1px solid ${done || current ? `${stageColor[s]}35` : 'transparent'}`,
                        }}>
                            {done ? '✓ ' : current ? '▶ ' : ''}{stageLabel[s]}
                        </span>
                    );
                })}
            </div>

            {/* Meta */}
            {project.location && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    📍 {project.location}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 7 }}>
                <Link
                    href={`/${project.currentStage}?project=${project.id}`}
                    style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 10,
                        background: `linear-gradient(135deg, ${project.color}, ${project.color}bb)`,
                        color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none',
                        boxShadow: `0 3px 10px ${project.color}30`,
                        transition: 'opacity 0.15s ease',
                    }}
                >
                    {completed === 5 ? '📋 결과 보기' : `▶ ${stageLabel[project.currentStage]} 계속`}
                </Link>
            </div>

            {/* Date */}
            <div style={{ fontSize: 10, color: 'rgba(130,130,140,0.6)', textAlign: 'right', marginTop: -6 }}>
                {new Date(project.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const { projects, createProject, deleteProject, saveProjects } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'all' | StageKey | 'done'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'progress'>('recent');

    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const [search, setSearch] = useState(initialQuery);

    // Firebase connection
    const { user, fetchProjects, loading } = useFirebase();
    const [isSyncing, setIsSyncing] = useState(true);

    // Initial load: prefer Firebase if logged in, else fallback to localStorage
    useEffect(() => {
        if (!loading) {
            if (user) {
                fetchProjects().then(cloudProjects => {
                    saveProjects(cloudProjects);
                    setIsSyncing(false);
                });
            } else {
                setIsSyncing(false);
            }
        }
    }, [user, loading, fetchProjects]);

    // If URL changes from header search, update local state
    useEffect(() => {
        setSearch(searchParams.get('q') || '');
    }, [searchParams]);

    const filtered = useMemo(() => {
        let list = [...projects];
        if (search) list = list.filter(p => p.name.includes(search) || p.usage.includes(search) || (p.client || '').includes(search));
        if (filter === 'done') list = list.filter(p => completedStageCount(p) === 5);
        else if (filter !== 'all') list = list.filter(p => p.currentStage === filter);
        if (sortBy === 'recent') list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'progress') list.sort((a, b) => progressPercent(b) - progressPercent(a));
        return list;
    }, [projects, filter, sortBy, search]);

    return (
        <div style={{ padding: '24px 28px', height: '100%', overflowY: 'auto' }}>
            {showModal && (
                <NewProjectModal
                    onClose={() => setShowModal(false)}
                    onCreate={(name, usage, client, location) => createProject(name, usage, client, location)}
                />
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        프로젝트
                        {isSyncing && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--text-muted)10', padding: '2px 8px', borderRadius: 10 }}>☁️ 동기화 중...</span>}
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        총 {projects.length}개 프로젝트
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '10px 20px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #528A42, #3d6b30)',
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        boxShadow: '0 4px 14px #528A4235', display: 'flex', alignItems: 'center', gap: 7,
                    }}
                >✦ 새 프로젝트</button>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <input
                    className="stage-input"
                    style={{ flex: '1 1 180px', minWidth: 180, maxWidth: 280 }}
                    placeholder="🔍 프로젝트 검색..."
                    value={search}
                    onChange={e => {
                        const val = e.target.value;
                        setSearch(val);
                        // Clear URL param if user empties input so it doesn't stick
                        if (!val && searchParams.has('q')) {
                            router.replace('/projects');
                        }
                    }}
                />

                {/* Stage filter */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[
                        { val: 'all', label: '전체' },
                        { val: 'flow', label: 'FLOW 중' },
                        { val: 'tone', label: 'TONE 중' },
                        { val: 'rise', label: 'RISE 중' },
                        { val: 'fuse', label: 'FUSE 중' },
                        { val: 'lens', label: 'LENS 중' },
                        { val: 'done', label: '✓ 완료' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => setFilter(opt.val as typeof filter)}
                            style={{
                                fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                                border: `1.5px solid ${filter === opt.val ? '#528A42' : 'rgba(180,180,180,0.4)'}`,
                                background: filter === opt.val ? '#528A4218' : 'rgba(255,255,255,0.45)',
                                color: filter === opt.val ? '#528A42' : 'var(--text-secondary)',
                                transition: 'all 0.13s ease',
                            }}
                        >{opt.label}</button>
                    ))}
                </div>

                {/* Sort */}
                <select
                    className="stage-select"
                    style={{ width: 120 }}
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                >
                    <option value="recent">최근 수정순</option>
                    <option value="name">이름순</option>
                    <option value="progress">진행률순</option>
                </select>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px 0',
                    color: 'var(--text-muted)',
                }}>
                    <div style={{ fontSize: 42, marginBottom: 16, opacity: 0.3 }}>🏗️</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                        {search || filter !== 'all' ? '조건에 맞는 프로젝트가 없습니다' : '아직 프로젝트가 없습니다'}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 24 }}>
                        상단의 <strong>✦ 새 프로젝트</strong> 버튼으로 첫 프로젝트를 시작하세요
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: '10px 24px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #528A42, #3d6b30)',
                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        }}
                    >✦ 첫 프로젝트 만들기</button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                }}>
                    {filtered.map(p => (
                        <ProjectCard key={p.id} project={p} onDelete={() => deleteProject(p.id)} />
                    ))}
                </div>
            )}
        </div>
    );
}
