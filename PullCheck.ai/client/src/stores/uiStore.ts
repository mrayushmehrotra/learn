import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    notifications: Notification[];

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    theme: 'system',
    notifications: [],

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', isDark);
        } else {
            document.documentElement.classList.toggle('dark', theme === 'dark');
        }
    },

    addNotification: (notification) => set((state) => ({
        notifications: [
            ...state.notifications,
            { ...notification, id: crypto.randomUUID() },
        ],
    })),

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
    })),

    clearNotifications: () => set({ notifications: [] }),
}));

export default useUIStore;
