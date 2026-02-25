'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSettings } from '@/lib/useSettings';

// ── Stage & Nav data ─────────────────────────────────────────────
const stages = [
    {
        id: '01', key: 'flow', label: 'FLOW', sub: 'Zoning', href: '/flow',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    },
    {
        id: '02', key: 'tone', label: 'TONE', sub: 'Coloring', href: '/tone',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 3C12 3 16 7 16 12C16 17 12 21 12 21" /><path d="M3 12h18" /></svg>
    },
    {
        id: '03', key: 'rise', label: 'RISE', sub: 'Isometry', href: '/rise',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
    },
    {
        id: '04', key: 'fuse', label: 'FUSE', sub: 'Mix Board', href: '/fuse',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 22a10 10 0 0 1-10-10" /><path d="M2 12h20" /><circle cx="12" cy="12" r="3" /></svg>
    },
    {
        id: '05', key: 'lens', label: 'LENS', sub: 'AI Rendering', href: '/lens',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><circle cx="11" cy="11" r="4" /></svg>
    },
];

const navItems = [
    {
        label: 'Dashboard', href: '/',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
    },
    {
        label: 'Projects', href: '/projects',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
    },
    {
        label: 'Report', href: '/report',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>
    },
];

const ROLE_OPTIONS = ['Commander', 'Designer', 'Architect', 'Project Manager', 'Client'];

// ── Settings Panel ────────────────────────────────────────────────
function SettingsPanel({ onClose, settings, save }: {
    onClose: () => void;
    settings: ReturnType<typeof useSettings>['settings'];
    save: ReturnType<typeof useSettings>['save'];
}) {
    const [name, setName] = useState(settings.userName);
    const [role, setRole] = useState(settings.role);

    const handleSave = () => {
        save({ userName: name.trim() || 'Mission Control', role });
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.15)' }}
                onClick={onClose}
            />

            {/* Panel */}
            <div style={{
                position: 'fixed', bottom: 80, left: 12, zIndex: 201,
                width: 260,
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(24px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                padding: '18px 18px 16px',
                animation: 'slideUpIn 0.18s ease',
            }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    ⚙️ 사용자 설정
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>✕</button>
                </div>

                {/* Avatar preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'rgba(201,169,110,0.1)', borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A96E, #8B7355)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {(name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{name || 'Mission Control'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{role}</div>
                    </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>이름</label>
                    <input
                        className="stage-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Mission Control"
                        maxLength={30}
                    />
                </div>

                {/* Role */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>역할</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {ROLE_OPTIONS.map(r => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                style={{
                                    fontSize: 10.5, fontWeight: 600, padding: '4px 10px', borderRadius: 14, cursor: 'pointer',
                                    border: `1.5px solid ${role === r ? '#C9A96E' : 'rgba(180,180,180,0.4)'}`,
                                    background: role === r ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.5)',
                                    color: role === r ? '#8B6914' : 'var(--text-secondary)',
                                    transition: 'all 0.12s ease',
                                }}
                            >{r}</button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 0 12px' }} />

                {/* Version info */}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                    IN-TE-REAL v1.0 · 클라우드 동기화 모드 ☁️<br />
                    <span style={{ opacity: 0.6, color: '#528A42' }}>Firebase 실시간 데이터 연동 중</span>
                </div>

                <button
                    onClick={handleSave}
                    style={{
                        width: '100%', padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #C9A96E, #8B7355)',
                        color: '#fff', fontWeight: 700, fontSize: 12,
                        boxShadow: '0 3px 12px rgba(201,169,110,0.35)',
                    }}
                >✓ 저장</button>
            </div>

            <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </>
    );
}

// ── Main Sidebar ──────────────────────────────────────────────────
export default function Sidebar() {
    const pathname = usePathname();
    const { settings, save } = useSettings();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <aside
            className="glass-sidebar flex flex-col h-screen relative z-10"
            style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
        >
            {/* Logo */}
            <div style={{ position: 'relative', height: 92, overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'stretch' }}>
                <Image
                    src="/Logo.png?v=4"
                    alt="IN-TE-REAL AI Orchestration"
                    width={210} height={92} priority
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 10, display: 'block' }}
                />
                <Image
                    src="/Logo_Rotate_Alpha.png?v=5"
                    alt="IN-TE-REAL Logo Mark"
                    width={210} height={92} priority
                    className="spin-logo-anim"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 10, display: 'block', pointerEvents: 'none', transformOrigin: '17.64% 50.72%' }}
                />
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes spinLogo { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .spin-logo-anim { animation: spinLogo 15s linear infinite; }
                `}} />
            </div>

            {/* Nav */}
            <div className="px-3 mb-4">
                {navItems.map(item => {
                    const active = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            borderRadius: 10, marginBottom: 2, fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            color: active ? 'var(--accent-warm)' : 'var(--text-secondary)',
                            background: active ? 'rgba(201,169,110,0.15)' : 'transparent',
                            textDecoration: 'none', transition: 'all 0.15s ease',
                        }}>
                            {item.icon}{item.label}
                        </Link>
                    );
                })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 16px 16px' }} />

            {/* Cinematic Pipeline */}
            <div className="px-4 mb-3">
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                    Cinematic Pipeline
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stages.map((stage, index) => {
                        const active = pathname === stage.href;
                        return (
                            <Link
                                key={stage.key} href={stage.href}
                                className={`animate-fadeInUp stage-panel stage-${stage.key}-panel`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 13px', textDecoration: 'none', cursor: 'pointer',
                                    animationDelay: `${index * 0.07}s`,
                                    ...(active ? { outline: '2px solid rgba(255,255,255,0.6)', outlineOffset: '-2px' } : {}),
                                }}
                            >
                                <span style={{ opacity: 0.85, flexShrink: 0 }}>{stage.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.45, letterSpacing: '0.05em' }}>{stage.id}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>{stage.label}</span>
                                    </div>
                                    <span style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.02em' }}>{stage.sub}</span>
                                </div>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', opacity: active ? 1 : 0.3, background: 'currentColor', flexShrink: 0 }} />
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Bottom: Mission Control user card */}
            <div style={{ marginTop: 'auto', padding: '16px 12px', position: 'relative' }}>
                <button
                    onClick={() => setShowSettings(s => !s)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                        background: showSettings ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${showSettings ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.6)'}`,
                        backdropFilter: 'blur(10px)', transition: 'all 0.15s ease',
                    }}
                >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A96E 0%, #8B7355 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {settings.userName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.userName}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{settings.role}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"
                        style={{ transform: showSettings ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                </button>

                {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} settings={settings} save={save} />}
            </div>
        </aside>
    );
}
