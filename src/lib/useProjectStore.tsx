// ──────────────────────────────────────────────
//  IN-TE-REAL  ·  Project Store (localStorage)
// ──────────────────────────────────────────────
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useFirebase } from '@/lib/useFirebase';

// ── Types ────────────────────────────────────
export type StageKey = 'flow' | 'tone' | 'rise' | 'fuse' | 'lens';

export interface StageResult {
    prompt?: string;
    selectedAlt?: string;        // e.g. 'A' | 'B' | 'C'
    resultImages?: string[];     // base64 or URLs of uploaded result images
    completedAt?: string;        // ISO date
}

export interface Project {
    id: string;
    name: string;
    usage: string;               // 건물 용도
    client?: string;             // 의뢰인
    location?: string;           // 위치/현장
    createdAt: string;           // ISO date
    updatedAt: string;           // ISO date
    stages: Record<StageKey, StageResult>;
    currentStage: StageKey;
    color: string;               // accent color for the card
}

export interface PromptRecord {
    id: string;
    projectId: string;
    projectName: string;
    stage: StageKey;
    prompt: string;
    createdAt: string;
}

// ── Constants ────────────────────────────────
const STORAGE_KEY = 'inte-real-projects';
const PROMPTS_KEY = 'inte-real-prompts';
const STAGE_ORDER: StageKey[] = ['flow', 'tone', 'rise', 'fuse', 'lens'];
const CARD_COLORS = ['#528A42', '#C08018', '#8B5E2A', '#B04428', '#3458AA'];

const emptyStages = (): Record<StageKey, StageResult> => ({
    flow: {}, tone: {}, rise: {}, fuse: {}, lens: {},
});

// ── Helpers ──────────────────────────────────
const uid = () => `p${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const stageLabel: Record<StageKey, string> = {
    flow: 'FLOW', tone: 'TONE', rise: 'RISE', fuse: 'FUSE', lens: 'LENS',
};

export const stageColor: Record<StageKey, string> = {
    flow: '#528A42', tone: '#C08018', rise: '#8B5E2A', fuse: '#B04428', lens: '#3458AA',
};

export const completedStageCount = (p: Project) =>
    STAGE_ORDER.filter(s => !!p.stages[s]?.completedAt).length;

export const progressPercent = (p: Project) =>
    Math.round((completedStageCount(p) / STAGE_ORDER.length) * 100);

interface ProjectContextType {
    projects: Project[];
    prompts: PromptRecord[];
    stats: any;
    createProject: (name: string, usage: string, client?: string, location?: string) => Project;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    completeStage: (projectId: string, stage: StageKey, result: Omit<StageResult, 'completedAt'>) => void;
    savePrompt: (projectId: string, projectName: string, stage: StageKey, prompt: string) => void;
    deletePrompt: (id: string) => void;
    saveProjects: (updated: Project[]) => void;
    savePrompts: (updated: PromptRecord[]) => void;
    STAGE_ORDER: StageKey[];
}

const ProjectContext = createContext<ProjectContextType>({} as ProjectContextType);

// ── Provider ─────────────────────────────────────
export function ProjectProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [prompts, setPrompts] = useState<PromptRecord[]>([]);

    const { syncProject, deleteRemoteProject, syncPrompt } = useFirebase();

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setProjects(JSON.parse(raw));
            const pr = localStorage.getItem(PROMPTS_KEY);
            if (pr) setPrompts(JSON.parse(pr));
        } catch { /* ignore */ }
    }, []);

    // Persist projects
    const saveProjects = useCallback((updated: Project[]) => {
        setProjects(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    // Persist prompts
    const savePrompts = useCallback((updated: PromptRecord[]) => {
        setPrompts(updated);
        localStorage.setItem(PROMPTS_KEY, JSON.stringify(updated));
    }, []);

    // ── CRUD ──────────────────────────────────
    const createProject = useCallback((
        name: string, usage: string, client?: string, location?: string,
    ): Project => {
        const colorIdx = projects.length % CARD_COLORS.length;
        const p: Project = {
            id: uid(), name, usage,
            client: client || '',
            location: location || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stages: emptyStages(),
            currentStage: 'flow',
            color: CARD_COLORS[colorIdx],
        };
        saveProjects([p, ...projects]);
        if (syncProject) syncProject(p);
        return p;
    }, [projects, saveProjects, syncProject]);

    const updateProject = useCallback((id: string, patch: Partial<Project>) => {
        const updatedList = projects.map(p => {
            if (p.id === id) {
                const updated = { ...p, ...patch, updatedAt: new Date().toISOString() };
                if (syncProject) syncProject(updated);
                return updated;
            }
            return p;
        });
        saveProjects(updatedList);
    }, [projects, saveProjects, syncProject]);

    const deleteProject = useCallback((id: string) => {
        saveProjects(projects.filter(p => p.id !== id));
        if (deleteRemoteProject) deleteRemoteProject(id);
    }, [projects, saveProjects, deleteRemoteProject]);

    const completeStage = useCallback((
        projectId: string, stage: StageKey,
        result: Omit<StageResult, 'completedAt'>,
    ) => {
        const stageResult: StageResult = { ...result, completedAt: new Date().toISOString() };
        const idx = STAGE_ORDER.indexOf(stage);
        const nextStage: StageKey = STAGE_ORDER[idx + 1] ?? stage;

        const updatedList = projects.map(p => {
            if (p.id === projectId) {
                const updated = { ...p, updatedAt: new Date().toISOString(), currentStage: nextStage, stages: { ...p.stages, [stage]: stageResult } };
                if (syncProject) syncProject(updated);
                return updated;
            }
            return p;
        });
        saveProjects(updatedList);
    }, [projects, saveProjects, syncProject]);

    const savePrompt = useCallback((
        projectId: string, projectName: string, stage: StageKey, prompt: string,
    ) => {
        const rec: PromptRecord = {
            id: uid(), projectId, projectName, stage, prompt,
            createdAt: new Date().toISOString(),
        };
        savePrompts([rec, ...prompts]);
        if (syncPrompt) syncPrompt(rec);
    }, [prompts, savePrompts, syncPrompt]);

    const deletePrompt = useCallback((id: string) => {
        savePrompts(prompts.filter(r => r.id !== id));
    }, [prompts, savePrompts]);

    // ── Stats ─────────────────────────────────
    const stats = {
        totalProjects: projects.length,
        completedProjects: projects.filter(p => completedStageCount(p) === 5).length,
        totalPrompts: prompts.length,
        stageCompletion: STAGE_ORDER.map(s => ({
            key: s,
            label: stageLabel[s],
            color: stageColor[s],
            count: projects.filter(p => !!p.stages[s]?.completedAt).length,
        })),
    };

    const contextValue = {
        projects, prompts, stats,
        createProject, updateProject, deleteProject,
        completeStage, savePrompt, deletePrompt,
        saveProjects, savePrompts,
        STAGE_ORDER,
    };

    return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>;
}

export const useProjectStore = () => useContext(ProjectContext);
