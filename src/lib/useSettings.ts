// useSettings — 사용자 설정 (localStorage)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from './useFirebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AppSettings {
    userName: string;
    role: string;
    theme: 'light' | 'auto';
    sidebarCompact: boolean;
}

const DEFAULTS: AppSettings = {
    userName: 'Mission Control',
    role: 'Commander',
    theme: 'auto',
    sidebarCompact: false,
};

const KEY = 'inte-real-settings';

export function useSettings() {
    const { user, loading } = useFirebase();
    const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial load from local storage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch { /* ignore */ }
    }, []);

    // Sync from Firebase when user logs in
    useEffect(() => {
        if (loading || !user) return;

        const loadRemoteSettings = async () => {
            try {
                const docRef = doc(db, `users/${user.uid}/settings/profile`);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const remoteData = snap.data() as Partial<AppSettings>;
                    setSettings(prev => {
                        const merged = { ...prev, ...remoteData };
                        localStorage.setItem(KEY, JSON.stringify(merged));
                        return merged;
                    });
                } else {
                    // If no remote settings exist, write local ones to remote
                    const currentLocal = localStorage.getItem(KEY);
                    if (currentLocal) {
                        await setDoc(docRef, JSON.parse(currentLocal), { merge: true });
                    } else {
                        await setDoc(docRef, DEFAULTS, { merge: true });
                    }
                }
                setIsLoaded(true);
            } catch (err) {
                console.error("Failed to load settings from Firebase:", err);
            }
        };

        loadRemoteSettings();
    }, [user, loading]);

    const save = useCallback((patch: Partial<AppSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            // Save locally immediately
            localStorage.setItem(KEY, JSON.stringify(next));

            // Sync to Firebase if available
            if (user) {
                setDoc(doc(db, `users/${user.uid}/settings/profile`), next, { merge: true })
                    .catch(e => console.error("Failed to sync settings:", e));
            }

            return next;
        });
    }, [user]);

    return { settings, save, isLoaded };
}
