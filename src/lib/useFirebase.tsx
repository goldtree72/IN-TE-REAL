'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import type { Project, PromptRecord } from './useProjectStore';

interface FirebaseContextType {
    user: User | null;
    loading: boolean;
    syncProject: (project: Project) => Promise<void>;
    fetchProjects: () => Promise<Project[]>;
    deleteRemoteProject: (projectId: string) => Promise<void>;
    syncPrompt: (prompt: PromptRecord) => Promise<void>;
    fetchPrompts: () => Promise<PromptRecord[]>;
}

const FirebaseContext = createContext<FirebaseContextType>({} as FirebaseContextType);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                signInAnonymously(auth).catch(console.error);
            }
        });
        return () => unsubscribe();
    }, []);

    const syncProject = async (project: Project) => {
        if (!user) return;
        try {
            await setDoc(doc(db, `users/${user.uid}/projects/${project.id}`), project, { merge: true });
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProjects = async (): Promise<Project[]> => {
        if (!user) return [];
        try {
            const q = query(collection(db, `users/${user.uid}/projects`), orderBy('updatedAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as Project);
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const deleteRemoteProject = async (projectId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/projects/${projectId}`));
        } catch (error) {
            console.error(error);
        }
    };

    const syncPrompt = async (prompt: PromptRecord) => {
        if (!user) return;
        try {
            await setDoc(doc(db, `users/${user.uid}/prompts/${prompt.id}`), prompt, { merge: true });
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPrompts = async (): Promise<PromptRecord[]> => {
        if (!user) return [];
        try {
            const q = query(collection(db, `users/${user.uid}/prompts`), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as PromptRecord);
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const contextValue = { user, loading, syncProject, fetchProjects, deleteRemoteProject, syncPrompt, fetchPrompts };

    return <FirebaseContext.Provider value={ contextValue }> { children } </FirebaseContext.Provider>;
};

export const useFirebase = () => useContext(FirebaseContext);
