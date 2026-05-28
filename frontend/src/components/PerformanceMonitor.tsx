import { useState, useEffect, useRef } from 'react';
import { performanceStore, PerformanceData } from '../api/performanceStore';
import { Zap, Activity, X, ChevronUp, ChevronDown, Trash2, Clock, Terminal } from 'lucide-react';
import { cn } from '../utils/cn';

export default function PerformanceMonitor() {
    const [logs, setLogs] = useState<PerformanceData[]>(performanceStore.getLogs());
    const [visible, setVisible] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = performanceStore.subscribe((newLogs) => {
            setLogs([...newLogs]);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (expanded && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [expanded, logs]);

    if (!visible) return (
        <button 
            onClick={() => setVisible(true)}
            className="fixed bottom-4 right-4 z-[9999] w-10 h-10 bg-slate-900 text-primary-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all border border-slate-700"
        >
            <Terminal className="w-5 h-5" />
        </button>
    );

    const latest = logs[0];

    const getTimeColor = (ms: number) => {
        if (ms < 150) return 'text-emerald-400';
        if (ms < 500) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getStatusColor = (status: number) => {
        if (status < 300) return 'text-emerald-400';
        if (status < 400) return 'text-blue-400';
        return 'text-rose-400';
    };

    return (
        <div className={cn(
            "fixed right-4 z-[9999] transition-all duration-500 ease-in-out",
            expanded ? "bottom-4 w-[450px]" : "bottom-4 w-[380px]"
        )}>
            <div className="bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                {/* Header / Latest Info */}
                <div 
                    onClick={() => setExpanded(!expanded)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                    <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                        <Activity className="w-5 h-5 text-primary-500 animate-pulse" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Latency Optimizer</span>
                            {latest && (
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800", getTimeColor(latest.time))}>
                                    {latest.time}ms
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <h4 className="text-white font-bold text-xs truncate">
                                {latest ? `${latest.method} ${latest.url}` : 'No requests yet'}
                            </h4>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                        <button onClick={(e) => { e.stopPropagation(); setVisible(false); }} className="p-1 hover:text-rose-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Expanded Logs List */}
                <div className={cn(
                    "transition-all duration-500 ease-in-out overflow-hidden border-t border-slate-800",
                    expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                )}>
                    <div className="p-4 bg-slate-900/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request History ({logs.length})</span>
                        <button 
                            onClick={() => performanceStore.clear()}
                            className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div 
                        ref={scrollRef}
                        className="overflow-y-auto max-h-[350px] p-2 space-y-1 custom-scrollbar"
                    >
                        {logs.length === 0 ? (
                            <div className="py-10 text-center text-slate-600 italic text-xs">
                                Waiting for network activity...
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-slate-800">
                                    <div className={cn("text-[9px] font-black px-1.5 py-0.5 rounded w-10 text-center", 
                                        log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 
                                        log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                    )}>
                                        {log.method}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-medium text-slate-300 truncate">
                                            {log.url}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-500">
                                            <span className="flex items-center gap-1 font-mono">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className={cn("font-bold", getStatusColor(log.status))}>
                                                Status: {log.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={cn("text-xs font-black font-mono", getTimeColor(log.time))}>
                                        {log.time}ms
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Tip */}
                {expanded && (
                    <div className="p-3 bg-indigo-600/10 border-t border-slate-800 text-center">
                        <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <Zap className="w-3 h-3" />
                            Optimize slow requests to improve user experience
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
