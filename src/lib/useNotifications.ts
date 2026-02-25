// useNotifications — 알림 저장소 (localStorage)
'use client';
import { useState, useEffect, useCallback } from 'react';

export type NotifType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
    id: string;
    type: NotifType;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
}

const KEY = 'inte-real-notifications';
const uid = () => `n${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setNotifications(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const persist = (list: Notification[]) => {
        setNotifications(list);
        localStorage.setItem(KEY, JSON.stringify(list));
    };

    const push = useCallback((type: NotifType, title: string, message: string) => {
        setNotifications(prev => {
            const list = [
                { id: uid(), type, title, message, createdAt: new Date().toISOString(), read: false },
                ...prev,
            ].slice(0, 50); // keep max 50
            localStorage.setItem(KEY, JSON.stringify(list));
            return list;
        });
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => {
            const list = prev.map(n => ({ ...n, read: true }));
            localStorage.setItem(KEY, JSON.stringify(list));
            return list;
        });
    }, []);

    const remove = useCallback((id: string) => {
        setNotifications(prev => {
            const list = prev.filter(n => n.id !== id);
            localStorage.setItem(KEY, JSON.stringify(list));
            return list;
        });
    }, []);

    const clearAll = useCallback(() => persist([]), []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return { notifications, unreadCount, push, markAllRead, remove, clearAll };
}
