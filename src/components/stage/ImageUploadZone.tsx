'use client';

import { useState, useCallback, useRef } from 'react';

interface ImageUploadZoneProps {
    label?: string;
    accept?: string;
    multiple?: boolean;
    onFiles?: (files: File[]) => void;
    previewMode?: 'single' | 'grid';
    stageColor?: string;
}

export default function ImageUploadZone({
    label = '이미지를 드래그하거나 클릭하여 업로드',
    accept = 'image/*',
    multiple = false,
    onFiles,
    previewMode = 'single',
    stageColor = '#888',
}: ImageUploadZoneProps) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        const arr = Array.from(files);
        const urls = arr.map(f => URL.createObjectURL(f));
        setPreviews(prev => multiple ? [...prev, ...urls] : urls);
        setFileNames(arr.map(f => f.name));
        onFiles?.(arr);
    }, [multiple, onFiles]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleRemove = (idx: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== idx));
        setFileNames(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div>
            {/* Upload trigger */}
            <div
                className={`upload-zone ${dragging ? 'drag-over' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{ borderColor: dragging ? stageColor : undefined }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    style={{ display: 'none' }}
                    onChange={e => processFiles(e.target.files)}
                />
                <div className="upload-zone-icon">
                    {previews.length > 0 ? '🔄' : '📁'}
                </div>
                <div className="upload-zone-text">
                    {previews.length > 0
                        ? `${previews.length}개 업로드됨 · 클릭하여 변경`
                        : label
                    }
                    <br />
                    <span style={{ fontSize: 10, opacity: 0.6 }}>PNG, JPG, WEBP · 최대 10MB</span>
                </div>
            </div>

            {/* Previews */}
            {previews.length > 0 && (
                <div style={{
                    display: previewMode === 'grid' ? 'grid' : 'block',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    marginTop: 10,
                }}>
                    {previews.map((url, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.6)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={fileNames[i]}
                                style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 180 }}
                            />
                            <button
                                onClick={e => { e.stopPropagation(); handleRemove(i); }}
                                style={{
                                    position: 'absolute', top: 5, right: 5,
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.55)', border: 'none',
                                    color: '#fff', cursor: 'pointer', fontSize: 11,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                title="제거"
                            >✕</button>
                            <div style={{ fontSize: 10, padding: '4px 8px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {fileNames[i]}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
