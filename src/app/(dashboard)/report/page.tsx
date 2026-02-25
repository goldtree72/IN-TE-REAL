'use client';

import { useState } from 'react';
import {
    useProjectStore,
    completedStageCount,
    stageColor,
    stageLabel,
    type StageKey,
} from '@/lib/useProjectStore';
import { downloadReportHTML } from '@/lib/generateReport';

const STAGE_ORDER: StageKey[] = ['flow', 'tone', 'rise', 'fuse', 'lens'];

// ── Stat Card ───────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: {
    label: string; value: string | number; sub?: string; accent: string;
}) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)',
            borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            padding: '18px 22px', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8, paddingTop: 4 }}>
                {label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────
export default function ReportPage() {
    const { projects, prompts, stats, deletePrompt } = useProjectStore();
    const [promptFilter, setPromptFilter] = useState<'all' | StageKey>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [embedUrl, setEmbedUrl] = useState('');
    const [savedEmbedUrl, setSavedEmbedUrl] = useState('');

    const filteredPrompts = promptFilter === 'all'
        ? prompts
        : prompts.filter(p => p.stage === promptFilter);

    const copyPrompt = async (id: string, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Gather all result images from projects
    const allImages = projects.flatMap(p =>
        STAGE_ORDER.flatMap(s =>
            (p.stages[s]?.resultImages || []).map(img => ({
                img, stage: s, projectName: p.name,
            }))
        )
    );

    const maxStageCount = Math.max(...stats.stageCompletion.map(s => s.count), 1);

    const handleExport = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        setExportingId(projectId);
        setTimeout(() => {
            downloadReportHTML(project);
            setExportingId(null);
        }, 300);
    };

    // Convert Google Slides share URL to embed URL
    const toEmbedUrl = (url: string) => {
        if (!url) return '';
        // https://docs.google.com/presentation/d/ID/edit → /pub?start=false&loop=false&delayms=3000
        const match = url.match(/\/presentation\/d\/([^/]+)/);
        if (match) return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
        // Already embed URL
        if (url.includes('/embed')) return url;
        return url;
    };

    return (
        <div style={{ padding: '24px 28px', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>리포트</h1>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    AI 파이프라인 작업 현황 및 통계
                </p>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                <StatCard label="총 프로젝트" value={stats.totalProjects} accent="#528A42" sub="전체 등록" />
                <StatCard label="완료 프로젝트" value={stats.completedProjects} accent="#3458AA" sub="5단계 완료" />
                <StatCard label="생성된 프롬프트" value={stats.totalPrompts} accent="#C08018" sub="전체 히스토리" />
                <StatCard
                    label="평균 진행률"
                    value={projects.length
                        ? `${Math.round(projects.reduce((s, p) => s + completedStageCount(p), 0) / projects.length / 5 * 100)}%`
                        : '0%'
                    }
                    accent="#B04428"
                    sub="전체 프로젝트 평균"
                />
            </div>

            {/* ── Stage funnel ── */}
            <div style={{
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(14px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                padding: '20px 22px', marginBottom: 24,
            }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                    단계별 진행 현황 (파이프라인 퍼널)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.stageCompletion.map(s => (
                        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, fontSize: 10, fontWeight: 800, color: s.color }}>{s.label}</div>
                            <div style={{ flex: 1, height: 22, background: 'rgba(200,200,200,0.2)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', inset: 0, width: `${(s.count / maxStageCount) * 100}%`,
                                    background: `linear-gradient(90deg, ${s.color}cc, ${s.color}55)`,
                                    borderRadius: 6, transition: 'width 0.4s ease',
                                }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 10.5, fontWeight: 700, color: s.count > 0 ? '#fff' : 'var(--text-muted)' }}>
                                    {s.count > 0 ? `${s.count}개 프로젝트 완료` : '아직 없음'}
                                </div>
                            </div>
                            <div style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 800, color: s.color }}>{s.count}</div>
                        </div>
                    ))}
                </div>
                {projects.length === 0 && (
                    <div style={{ textAlign: 'center', paddingTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                        프로젝트를 추가하면 단계별 현황이 표시됩니다
                    </div>
                )}
            </div>

            {/* ── Prompt history ── */}
            <div style={{
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(14px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                padding: '20px 22px', marginBottom: 24,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                        프롬프트 히스토리 ({prompts.length}개)
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                        {(['all', ...STAGE_ORDER] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setPromptFilter(s)}
                                style={{
                                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                                    border: `1.5px solid ${promptFilter === s ? (s === 'all' ? '#528A42' : stageColor[s]) : 'rgba(180,180,180,0.4)'}`,
                                    background: promptFilter === s ? `${s === 'all' ? '#528A42' : stageColor[s]}15` : 'rgba(255,255,255,0.5)',
                                    color: promptFilter === s ? (s === 'all' ? '#528A42' : stageColor[s]) : 'var(--text-muted)',
                                    transition: 'all 0.12s ease',
                                }}
                            >{s === 'all' ? '전체' : stageLabel[s as StageKey]}</button>
                        ))}
                    </div>
                </div>

                {filteredPrompts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
                        저장된 프롬프트가 없습니다
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                        {filteredPrompts.map(rec => (
                            <div key={rec.id} style={{
                                padding: '10px 12px', borderRadius: 10,
                                background: `${stageColor[rec.stage]}08`,
                                border: `1px solid ${stageColor[rec.stage]}25`,
                                display: 'flex', gap: 10, alignItems: 'flex-start',
                            }}>
                                <div style={{
                                    flexShrink: 0, padding: '2px 8px', borderRadius: 8, fontSize: 9.5,
                                    fontWeight: 800, background: `${stageColor[rec.stage]}20`,
                                    color: stageColor[rec.stage],
                                }}>
                                    {stageLabel[rec.stage]}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 3 }}>
                                        {rec.projectName}
                                    </div>
                                    <div style={{
                                        fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                        maxHeight: 60, overflow: 'hidden',
                                        maskImage: 'linear-gradient(to bottom, black 70%, transparent)',
                                    }}>
                                        {rec.prompt}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                                    <button
                                        onClick={() => copyPrompt(rec.id, rec.prompt)}
                                        style={{
                                            fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 7, cursor: 'pointer',
                                            border: `1px solid ${stageColor[rec.stage]}30`,
                                            background: copiedId === rec.id ? stageColor[rec.stage] : `${stageColor[rec.stage]}12`,
                                            color: copiedId === rec.id ? '#fff' : stageColor[rec.stage],
                                            transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {copiedId === rec.id ? '✓ 복사됨' : '📋 복사'}
                                    </button>
                                    <button
                                        onClick={() => deletePrompt(rec.id)}
                                        style={{
                                            fontSize: 10, padding: '4px 8px', borderRadius: 7, cursor: 'pointer',
                                            border: '1px solid rgba(180,180,180,0.3)', background: 'rgba(255,255,255,0.5)',
                                            color: 'var(--text-muted)', whiteSpace: 'nowrap',
                                        }}
                                    >삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── NotebookLM Export ── */}
            <div style={{
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(14px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                padding: '20px 22px', marginBottom: 24,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>📓 NotebookLM 발표자료 만들기</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>프로젝트 보고서 → NotebookLM 슬라이드 → 여기에 임베드</div>
                    </div>
                </div>

                {/* Step guide */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
                    {[
                        { step: '1', icon: '📄', title: '보고서 내보내기', desc: '아래 버튼으로 HTML 보고서 다운로드' },
                        { step: '2', icon: '📓', title: 'NotebookLM 업로드', desc: 'notebooklm.google.com → 소스 추가 → HTML 파일 업로드' },
                        { step: '3', icon: '🎞️', title: '슬라이드 생성', desc: 'NotebookLM 우측 패널 → 슬라이드 → 생성' },
                        { step: '4', icon: '🔗', title: 'URL 붙여넣기', desc: '아래 임베드 패널에 공유 URL 입력 후 저장' },
                    ].map(item => (
                        <div key={item.step} style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: '#3458AA08', border: '1px solid #3458AA20',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#3458AA', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.step}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#3458AA' }}>{item.icon} {item.title}</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.55, paddingLeft: 28 }}>{item.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Export buttons */}
                {projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
                        보고서를 내보내려면 먼저 프로젝트를 추가하세요
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>프로젝트 선택</div>
                        {projects.map(p => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(200,200,200,0.35)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.usage} · {completedStageCount(p)}/5단계 완료</div>
                                </div>
                                <button
                                    onClick={() => handleExport(p.id)}
                                    disabled={exportingId === p.id}
                                    style={{
                                        fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                                        border: 'none',
                                        background: exportingId === p.id ? 'rgba(200,200,200,0.5)' : 'linear-gradient(135deg, #3458AA, #2845888)',
                                        color: exportingId === p.id ? 'var(--text-muted)' : '#fff',
                                        transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 5,
                                        boxShadow: exportingId !== p.id ? '0 3px 10px #3458AA30' : 'none',
                                    }}
                                >
                                    {exportingId === p.id ? '⟳ 생성 중...' : '📄 보고서 내보내기'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{
                    marginTop: 14, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,200,80,0.1)', border: '1px solid rgba(255,200,80,0.3)',
                    fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                    💡 다운로드된 HTML 파일은 브라우저에서 열어 <strong>인쇄 → PDF로 저장</strong>하거나, NotebookLM에 직접 업로드할 수 있습니다.
                    NotebookLM: <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3458AA', fontWeight: 700 }}>notebooklm.google.com</a>
                </div>
            </div>

            {/* ── Google Slides Embed ── */}
            <div style={{
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(14px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                padding: '20px 22px', marginBottom: 24,
            }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>🎞️ 최종 발표자료 임베드</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>NotebookLM 슬라이드 또는 Google Slides 공유 URL을 입력하세요</div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                        className="stage-input"
                        style={{ flex: 1 }}
                        placeholder="https://docs.google.com/presentation/d/xxxxxx/edit 또는 /pub URL"
                        value={embedUrl}
                        onChange={e => setEmbedUrl(e.target.value)}
                    />
                    <button
                        onClick={() => setSavedEmbedUrl(toEmbedUrl(embedUrl))}
                        disabled={!embedUrl.trim()}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: embedUrl ? 'pointer' : 'not-allowed',
                            background: embedUrl ? 'linear-gradient(135deg, #3458AA, #284588)' : 'rgba(200,200,200,0.5)',
                            color: '#fff', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
                            boxShadow: embedUrl ? '0 3px 10px #3458AA30' : 'none',
                            transition: 'all 0.15s ease',
                        }}
                    >저장</button>
                    {savedEmbedUrl && (
                        <button
                            onClick={() => { setSavedEmbedUrl(''); setEmbedUrl(''); }}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(180,180,180,0.4)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
                        >✕ 제거</button>
                    )}
                </div>

                {savedEmbedUrl ? (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(200,200,200,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <iframe
                            src={savedEmbedUrl}
                            width="100%"
                            height="500"
                            frameBorder="0"
                            allowFullScreen
                            style={{ display: 'block' }}
                            title="발표자료"
                        />
                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>🎞️ 발표자료가 임베드되었습니다</span>
                            <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3458AA', fontWeight: 700, textDecoration: 'none' }}>새 탭에서 열기 ↗</a>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        height: 200, borderRadius: 12, border: '2px dashed rgba(52,88,170,0.2)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: '#3458AA06', color: 'var(--text-muted)',
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>🎞️</div>
                        <div style={{ fontSize: 12, opacity: 0.5 }}>위에 Google Slides URL을 입력하면 여기에 표시됩니다</div>
                    </div>
                )}
            </div>

            {/* ── Output gallery ── */}
            <div style={{
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(14px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                padding: '20px 22px',
            }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
                    전체 결과물 갤러리 ({allImages.length}개)
                </div>

                {allImages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
                        각 단계에서 AI 결과 이미지를 업로드하면 여기에 모아집니다
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                        {allImages.map((item, i) => (
                            <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.7)', position: 'relative' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.img} alt={`${item.stage} result`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                                    padding: '8px 8px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                                }}>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', opacity: 0.9 }}>{stageLabel[item.stage]}</span>
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{item.projectName.slice(0, 8)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
