
export type PerformanceData = {
    id: string;
    method: string;
    url: string;
    status: number;
    time: number;
    timestamp: number;
};

let logs: PerformanceData[] = [];
const listeners: ((logs: PerformanceData[]) => void)[] = [];

export const performanceStore = {
    add: (data: Omit<PerformanceData, 'id' | 'timestamp'>) => {
        const newLog = {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now()
        };
        // Keep only last 50 requests
        logs = [newLog, ...logs].slice(0, 50);
        listeners.forEach(l => l(logs));
    },
    subscribe: (callback: (logs: PerformanceData[]) => void) => {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    },
    getLogs: () => logs,
    clear: () => {
        logs = [];
        listeners.forEach(l => l(logs));
    }
};
