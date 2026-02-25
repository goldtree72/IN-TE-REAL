'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications, type NotifType } from '@/lib/useNotifications';

// ── Page meta (dynamic header title) ─────────────────────────────
const PAGE_META: Record<string, { title: string; sub: string }> = {
    '/': { title: 'Dashboard', sub: 'AI Orchestration Overview' },
    '/projects': { title: '프로젝트', sub: '실내건축 프로젝트 관리' },
    '/report': { title: '리포트', sub: 'AI 파이프라인 통계 및 현황' },
    '/flow': { title: '01 FLOW — Zoning', sub: '공간 조닝 분석 및 프롬프트 생성' },
    '/tone': { title: '02 TONE — Coloring', sub: '컬러 & 재질 선택' },
    '/rise': { title: '03 RISE — Isometry', sub: '아이소메트릭 3D 뷰 생성' },
    '/fuse': { title: '04 FUSE — Mix Board', sub: 'AI 스타일 트랜스퍼' },
    '/lens': { title: '05 LENS — Rendering', sub: 'AI PBR 최종 렌더링' },
};

// ── Notification type icons/colors ───────────────────────────────
const NOTIF_STYLE: Record<NotifType, { icon: string; color: string }> = {
    success: { icon: '✓', color: '#528A42' },
    info: { icon: 'ℹ', color: '#3458AA' },
    warning: { icon: '⚠', color: '#C08018' },
    error: { icon: '✕', color: '#B04428' },
};

// ── Main Header ───────────────────────────────────────────────────
export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const { notifications, unreadCount, markAllRead, remove, clearAll, push } = useNotifications();
    const [showNotifs, setShowNotifs] = useState(false);
    const [showManualAiInfo, setShowManualAiInfo] = useState(false);
    const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'error' | 'quota'>('checking');
    const [searchQuery, setSearchQuery] = useState('');
    const bellRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const manualRef = useRef<HTMLButtonElement>(null);
    const manualPopupRef = useRef<HTMLDivElement>(null);

    const pageMeta = PAGE_META[pathname] ?? { title: 'Mission Control', sub: 'AI Orchestration Dashboard' };

    // Live clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }));
        };
        tick();
        const id = setInterval(tick, 10_000);
        return () => clearInterval(id);
    }, []);

    // Seed a welcome notification once
    useEffect(() => {
        if (notifications.length === 0) {
            push('info', 'IN-TE-REAL에 오신 것을 환영합니다!', 'FLOW 단계에서 첫 번째 프로젝트를 시작하세요.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // AI Status Polling
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/ai-status');
                const data = await res.json();
                if (data.status === 'ready') setAiStatus('ready');
                else if (data.status === 'quota') setAiStatus('quota');
                else setAiStatus('error');
            } catch {
                setAiStatus('error');
            }
        };
        checkStatus();
        const id = setInterval(checkStatus, 60000);
        return () => clearInterval(id);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (dropRef.current && !dropRef.current.contains(target) &&
                bellRef.current && !bellRef.current.contains(target)) {
                setShowNotifs(false);
            }
            if (manualPopupRef.current && !manualPopupRef.current.contains(target) &&
                manualRef.current && !manualRef.current.contains(target)) {
                setShowManualAiInfo(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);


    return (
        <header className="glass-header" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 32px', height: 92, position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
        }}>
            {/* Left: dynamic page title */}
            <div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', transition: 'all 0.2s ease' }}>{pageMeta.title}</h1>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{pageMeta.sub}</p>
            </div>

            {/* Center: real search input */}
            <div style={{ position: 'relative', width: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.55)', border: `1px solid ${searchQuery ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.7)'}`, borderRadius: 24, padding: '6px 14px', transition: 'all 0.15s ease' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                                router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
                                searchRef.current?.blur();
                            }
                            if (e.key === 'Escape') { setSearchQuery(''); searchRef.current?.blur(); }
                        }}
                        placeholder="프로젝트 검색..."
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text-primary)', width: '100%', '::placeholder': { color: 'var(--text-muted)' } } as React.CSSProperties}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, padding: 0 }}>✕</button>
                    )}
                </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Clock */}
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{time}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{date}</p>
                </div>

                {/* AI Status - Manual Mode */}
                <div style={{ position: 'relative' }}>
                    <button
                        ref={manualRef}
                        onClick={() => setShowManualAiInfo(s => !s)}
                        title="AI 상태 및 하이브리드 운영 방식 안내"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: aiStatus === 'ready' ? 'rgba(82,138,66,0.1)' : aiStatus === 'error' ? 'rgba(176,68,40,0.1)' : 'rgba(107,114,128,0.15)',
                            border: `1px solid ${aiStatus === 'ready' ? 'rgba(82,138,66,0.3)' : aiStatus === 'error' ? 'rgba(176,68,40,0.3)' : 'rgba(107,114,128,0.35)'}`,
                            borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                            transition: 'all 0.25s ease',
                        }}
                    >
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: aiStatus === 'ready' ? '#528A42' : aiStatus === 'error' ? '#B04428' : '#6B7280',
                            display: 'inline-block',
                            boxShadow: aiStatus === 'ready' ? '0 0 6px #528A4280' : 'none'
                        }} />
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: aiStatus === 'ready' ? '#528A42' : aiStatus === 'error' ? '#B04428' : '#4B5563'
                        }}>
                            {aiStatus === 'checking' ? 'Connecting...' : aiStatus === 'ready' ? 'AI Ready' : aiStatus === 'quota' ? 'Quota Limit' : 'AI Error'}
                        </span>
                    </button>

                    {showManualAiInfo && (
                        <div
                            ref={manualPopupRef}
                            style={{
                                position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 300,
                                width: 280, padding: '16px',
                                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)',
                                borderRadius: 14, border: '1px solid rgba(255,255,255,0.9)',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                                animation: 'slideDownIn 0.15s ease',
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                ⚙️ 자동 하이브리드 AI 모드
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                                현재 IN-TE-REAL은 Gemini API를 활용하여 <strong>자동 이미지 생성 및 폴백(Fallback)</strong> 방식으로 운영되고 있습니다.
                            </p>
                            <ol style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 18, margin: 0, lineHeight: 1.7 }}>
                                <li>각 단계에서 파라미터 입력 시 최적화된 프롬프트 자동 생성</li>
                                <li><strong style={{ color: '#528A42' }}>[✨ AI 자동 생성]</strong> 버튼으로 결과물 즉시 확인</li>
                                <li><strong>일일 무료 할당량(50~100회) 초과 시</strong> 자동으로 수동 모드 전환</li>
                                <li>수동 전환 시 프롬프트를 복사하여 외부 AI 도구 활용 가능</li>
                            </ol>
                        </div>
                    )}
                </div>

                {/* Bell */}
                <div style={{ position: 'relative' }}>
                    <button
                        ref={bellRef}
                        onClick={() => { setShowNotifs(s => !s); if (!showNotifs && unreadCount > 0) markAllRead(); }}
                        style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: showNotifs ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.5)',
                            border: `1px solid ${showNotifs ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.7)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative', transition: 'all 0.15s ease',
                        }}
                        aria-label="알림"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: 5, right: 5,
                                minWidth: 14, height: 14, borderRadius: 7,
                                background: '#C9A96E', border: '1.5px solid var(--cloud-dancer)',
                                fontSize: 8, fontWeight: 800, color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 3px',
                            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {/* Notification dropdown */}
                    {showNotifs && (
                        <div
                            ref={dropRef}
                            style={{
                                position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 300,
                                width: 320, maxHeight: 420, overflowY: 'auto',
                                background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)',
                                borderRadius: 16, border: '1px solid rgba(255,255,255,0.9)',
                                boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                                animation: 'slideDownIn 0.15s ease',
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                                    🔔 알림
                                    {notifications.length > 0 && (
                                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{notifications.length}개</span>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >전체 삭제</button>
                                )}
                            </div>

                            {/* Notification list */}
                            {notifications.length === 0 ? (
                                <div style={{ padding: '36px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
                                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🔕</div>
                                    새로운 알림이 없습니다
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const s = NOTIF_STYLE[notif.type];
                                    return (
                                        <div
                                            key={notif.id}
                                            style={{
                                                padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
                                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                                background: notif.read ? 'transparent' : `${s.color}06`,
                                                transition: 'background 0.2s ease',
                                            }}
                                        >
                                            <div style={{
                                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                background: `${s.color}20`, color: s.color,
                                                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>{s.icon}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{notif.title}</div>
                                                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.message}</div>
                                                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 3 }}>
                                                    {new Date(notif.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => remove(notif.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, flexShrink: 0, padding: '2px 4px', borderRadius: 4 }}
                                            >✕</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
        </header>
    );
}
