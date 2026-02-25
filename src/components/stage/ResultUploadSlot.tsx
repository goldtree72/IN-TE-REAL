'use client';

import { useState, useRef } from 'react';

export default function ResultUploadSlot({
    label, note, icon, stageColor, preview, onPreviewChange
}: { label: string; note: string; icon: string; stageColor: string; preview?: string | null; onPreviewChange?: (s: string | null) => void }) {
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const activePreview = preview !== undefined ? preview : localPreview;

    const setPreviewWrapper = (val: string | null) => {
        if (onPreviewChange) onPreviewChange(val);
        setLocalPreview(val);
    };

    const [selected, setSelected] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setPreviewWrapper(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="output-card"
            style={{ outline: selected ? `2.5px solid ${stageColor}` : 'none', outlineOffset: 2 }}
        >
            <div
                onClick={() => activePreview ? setIsFullscreen(true) : fileRef.current?.click()}
                style={{
                    width: '100%', aspectRatio: '4/3', cursor: activePreview ? 'zoom-in' : 'pointer',
                    background: preview ? undefined : `${stageColor}08`,
                    border: preview ? 'none' : '1px dashed rgba(150,150,150,0.25)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                }}
            >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                {activePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activePreview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <>
                        <span style={{ fontSize: 26, marginBottom: 6, opacity: 0.35 }}>{icon}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>AI 결과 이미지 업로드</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.5, marginTop: 2 }}>{note}</span>
                    </>
                )}
                {activePreview && (
                    <button
                        onClick={e => { e.stopPropagation(); setPreviewWrapper(null); setSelected(false); }}
                        style={{
                            position: 'absolute', top: 5, right: 5, width: 22, height: 22,
                            borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none',
                            color: '#fff', cursor: 'pointer', fontSize: 11,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >✕</button>
                )}
            </div>
            <div className="output-card-footer">
                <span className="output-card-label">{label}</span>
                {activePreview && (
                    <button
                        onClick={() => setSelected(s => !s)}
                        style={{
                            fontSize: 10, fontWeight: 700,
                            color: selected ? '#fff' : stageColor,
                            background: selected ? stageColor : `${stageColor}18`,
                            border: `1px solid ${stageColor}40`,
                            borderRadius: 12, padding: '3px 10px', cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {selected ? '✓ 최종안' : '최종안 선택'}
                    </button>
                )}
            </div>

            {isFullscreen && activePreview && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(10px)', animation: 'slideUpIn 0.2s ease-out'
                    }}
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        style={{ position: 'absolute', top: 20, right: 30, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}
                        onClick={() => setIsFullscreen(false)}
                    >
                        ✕
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activePreview} alt={label} style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                    <a
                        href={activePreview}
                        download={`${label.replace(/[^a-zA-Z0-9]/g, '_')}_result.png`}
                        onClick={e => e.stopPropagation()}
                        style={{
                            marginTop: 30, padding: '14px 28px', background: stageColor, color: '#fff',
                            borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 15,
                            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s ease', cursor: 'pointer',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        이미지 다운로드
                    </a>
                </div>
            )}
        </div>
    );
}
