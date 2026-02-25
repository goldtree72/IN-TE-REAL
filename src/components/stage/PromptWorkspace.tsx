'use client';

import { useState, useCallback } from 'react';

interface PromptWorkspaceProps {
    prompt: string;
    stageColor: string;
    title?: string;
    hint?: string;
    onAutoGenerate?: () => void;
    isGenerating?: boolean;
}

export default function PromptWorkspace({ prompt, stageColor, title = 'AI 프롬프트', hint, onAutoGenerate, isGenerating }: PromptWorkspaceProps) {
    const [copied, setCopied] = useState(false);

    const hexToRgba = (hex: string, alpha: number) => {
        const h = hex.replace('#', '');
        if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const handleCopy = useCallback(async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [prompt]);

    // Simple syntax-coloring: wrap keys and values in spans
    const formatted = prompt
        .replace(/("[\w_\s가-힣]+")(?=\s*:)/g, '<span class="prompt-key">$1</span>')
        .replace(/:\s*"([^"]+)"/g, ': <span class="prompt-str">"$1"</span>');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {title}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={handleCopy}
                        disabled={!prompt}
                        title="클립보드에 복사"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            cursor: prompt ? 'pointer' : 'not-allowed', transition: 'all 0.15s ease',
                            background: copied ? stageColor : hexToRgba(stageColor, 0.2),
                            border: `1px solid ${copied ? stageColor : hexToRgba(stageColor, 0.4)}`,
                            color: copied ? '#fff' : stageColor,
                            opacity: prompt ? 1 : 0.5,
                            boxShadow: copied ? `0 4px 12px ${hexToRgba(stageColor, 0.4)}` : 'none',
                        }}
                    >
                        {copied ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                                복사됨!
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                클립보드 복사
                            </>
                        )}
                    </button>
                    {onAutoGenerate && (
                        <button
                            onClick={onAutoGenerate}
                            disabled={!prompt || isGenerating}
                            title="AI 이미지 컨셉 자동 생성"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                cursor: (!prompt || isGenerating) ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
                                background: isGenerating ? 'transparent' : stageColor,
                                color: isGenerating ? stageColor : '#fff',
                                border: `1px solid ${stageColor}`,
                                opacity: prompt ? 1 : 0.5,
                                boxShadow: isGenerating ? 'none' : `0 4px 12px ${hexToRgba(stageColor, 0.4)}`,
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="spin-anim" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    ⏳ 생성 중...
                                </>
                            ) : '✨ AI 자동 생성 (무료)'}
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes spin { 100% { transform: rotate(360deg); } }
                                .spin-anim { animation: spin 1s linear infinite; }
                            `}} />
                        </button>
                    )}
                </div>
            </div>

            {hint && (
                <div style={{
                    fontSize: 11,
                    color: stageColor,
                    background: `${stageColor}12`,
                    border: `1px solid ${stageColor}30`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    lineHeight: 1.55,
                }}>
                    💡 {hint}
                </div>
            )}

            <div
                className="prompt-display"
                dangerouslySetInnerHTML={{ __html: prompt ? formatted : '<span class="prompt-comment">// 좌측 입력 패널에서 정보를 입력하면\n// 최적화된 AI 프롬프트가 자동 생성됩니다.</span>' }}
                style={{
                    flex: 1,
                    background: hexToRgba(stageColor, 0.25),
                    border: `1px solid rgba(255, 255, 255, 0.35)`,
                    boxShadow: `0 0 36px rgba(255, 255, 255, 0.15) inset, 0 0 16px ${hexToRgba(stageColor, 0.4)} inset`,
                    color: stageColor,
                    textShadow: `0 1px 1.5px ${hexToRgba(stageColor, 0.35)}`
                }}
            />

            {prompt && (
                <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    lineHeight: 1.55,
                }}>
                    📋 복사 후 <strong>Gemini</strong>, <strong>ChatGPT</strong>, <strong>Google Imagen</strong> 등 원하시는 AI 툴에 붙여넣기 하세요.
                </div>
            )}
        </div>
    );
}
