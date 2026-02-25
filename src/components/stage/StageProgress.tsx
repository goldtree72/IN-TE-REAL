'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const stages = [
    { key: 'flow', label: 'FLOW', color: '#528A42', route: '/flow' },
    { key: 'tone', label: 'TONE', color: '#C08018', route: '/tone' },
    { key: 'rise', label: 'RISE', color: '#8B5E2A', route: '/rise' },
    { key: 'fuse', label: 'FUSE', color: '#B04428', route: '/fuse' },
    { key: 'lens', label: 'LENS', color: '#3458AA', route: '/lens' },
];

const stageBg: Record<string, string> = {
    flow: 'rgba(122,155,112,0.18)',
    tone: 'rgba(210,175,100,0.18)',
    rise: 'rgba(165,135,100,0.18)',
    fuse: 'rgba(185,120,95,0.18)',
    lens: 'rgba(100,125,175,0.18)',
};

export default function StageProgress() {
    const pathname = usePathname();

    return (
        <div className="stage-progress-bar">
            {stages.map((s, i) => {
                const active = pathname === s.route;
                const done = stages.findIndex(st => st.route === pathname) > i;
                return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < stages.length - 1 ? 1 : 'none' }}>
                        <Link
                            href={s.route}
                            className="stage-pip"
                            style={{
                                background: active ? stageBg[s.key] : done ? `${s.color}18` : 'rgba(255,255,255,0.3)',
                                border: `1.5px solid ${active ? s.color : done ? `${s.color}55` : 'rgba(200,200,200,0.4)'}`,
                                color: active ? s.color : done ? `${s.color}aa` : 'var(--text-muted)',
                                fontWeight: active ? 800 : 600,
                            }}
                        >
                            {done && <span>✓</span>}
                            {s.label}
                        </Link>
                        {i < stages.length - 1 && (
                            <div
                                key={`conn-${s.key}`}
                                className={`stage-pip-connector ${active ? 'active' : ''}`}
                                style={active ? {
                                    backgroundImage: `linear-gradient(90deg, ${s.color}30 0%, ${s.color} 50%, ${stages[i + 1].color}30 100%)`
                                } : { background: done ? `${s.color}55` : 'rgba(0,0,0,0.08)' }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
