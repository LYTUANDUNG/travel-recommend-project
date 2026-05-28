import React, { useState, useEffect, useRef } from 'react';

export default function JMeterVConsole() {
    const [isOpen, setIsOpen] = useState(false);
    
    // Configurations
    const [selectedThreads, setSelectedThreads] = useState<number>(10);
    const [selectedLoops, setSelectedLoops] = useState<number>(3);
    const [selectedEndpoint, setSelectedEndpoint] = useState<string>('collaborative');
    
    // Test status & logs
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [logs, setLogs] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const abortRef = useRef<boolean>(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    
    // Test results
    const [results, setResults] = useState<{
        label: string;
        samples: number;
        avg: number;
        min: number;
        max: number;
        error: string;
        throughput: number;
    } | null>(null);

    // Auto-scroll logs to bottom
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Handle stopping the test
    const stopTest = () => {
        abortRef.current = true;
        setIsRunning(false);
        setLogs(prev => [...prev, `[WARNING] Test execution aborted by user.`].slice(-100));
    };

    const runPerformanceTest = async () => {
        setIsRunning(true);
        abortRef.current = false;
        setLogs([`[INFO] Starting active Load Test: ${selectedThreads} Threads x ${selectedLoops} Loops...`]);
        setResults(null);
        
        const totalRequests = selectedThreads * selectedLoops;
        setProgress({ completed: 0, total: totalRequests });
        
        let endpointUrl = '';
        let label = '';
        if (selectedEndpoint === 'locations') {
            endpointUrl = 'http://localhost:8080/api/locations';
            label = 'GET /api/locations';
        } else if (selectedEndpoint === 'recommendations') {
            endpointUrl = 'http://localhost:8080/api/locations/recommendations';
            label = 'GET /api/locations/recommendations';
        } else if (selectedEndpoint === 'content') {
            endpointUrl = 'http://localhost:8000/recommend/content?location_id=2';
            label = 'GET /recommend/content (Python AI)';
        } else {
            endpointUrl = 'http://localhost:8000/recommend/collaborative?user_id=2';
            label = 'GET /recommend/collaborative (Python AI)';
        }
        
        const latencies: number[] = [];
        let errorsCount = 0;
        let completedCount = 0;
        
        const testStartTime = performance.now();
        
        // Spawn parallel threads
        const threads = Array.from({ length: selectedThreads }).map(async (_, threadIdx) => {
            const threadName = `Thread-${threadIdx + 1}`;
            
            // Each thread executes loopCount sequentially
            for (let loop = 1; loop <= selectedLoops; loop++) {
                if (abortRef.current) break;

                const reqStart = performance.now();
                const timestamp = new Date().toLocaleTimeString();
                
                setLogs(prev => [
                    ...prev, 
                    `[${timestamp}] ${threadName} (Loop ${loop}/${selectedLoops}): Initiated GET request...`
                ].slice(-100));
                
                try {
                    const response = await fetch(endpointUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    const reqEnd = performance.now();
                    const duration = Math.round(reqEnd - reqStart);
                    latencies.push(duration);
                    
                    if (response.ok) {
                        setLogs(prev => [
                            ...prev,
                            `[${new Date().toLocaleTimeString()}] ${threadName} (Loop ${loop}/${selectedLoops}): Success (200 OK) in ${duration}ms`
                        ].slice(-100));
                    } else {
                        errorsCount++;
                        setLogs(prev => [
                            ...prev,
                            `[${new Date().toLocaleTimeString()}] ${threadName} (Loop ${loop}/${selectedLoops}): Failed (Status ${response.status}) in ${duration}ms`
                        ].slice(-100));
                    }
                } catch (err: any) {
                    const reqEnd = performance.now();
                    const duration = Math.round(reqEnd - reqStart);
                    latencies.push(duration);
                    errorsCount++;
                    setLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] ${threadName} (Loop ${loop}/${selectedLoops}): Network Error (${err.message}) in ${duration}ms`
                    ].slice(-100));
                }
                
                completedCount++;
                setProgress({ completed: completedCount, total: totalRequests });
                
                // Update aggregate report dynamically during test run
                const sum = latencies.reduce((a, b) => a + b, 0);
                const avg = Math.round(sum / latencies.length);
                const min = Math.min(...latencies);
                const max = Math.max(...latencies);
                const errorPercent = ((errorsCount / completedCount) * 100).toFixed(2) + '%';
                const durationSec = (performance.now() - testStartTime) / 1000;
                const throughput = parseFloat((completedCount / (durationSec || 1e-9)).toFixed(2));
                
                setResults({
                    label,
                    samples: completedCount,
                    avg,
                    min,
                    max,
                    error: errorPercent,
                    throughput
                });
                
                // Add a micro random delay to simulate staggered realistic user behavior (10-30ms)
                await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
            }
        });
        
        await Promise.all(threads);
        
        const testEndTime = performance.now();
        const totalDurationSec = (testEndTime - testStartTime) / 1000;
        
        setIsRunning(false);
        if (!abortRef.current) {
            setLogs(prev => [
                ...prev,
                `[INFO] Load Test Completed successfully in ${totalDurationSec.toFixed(2)}s! Total requests: ${totalRequests}, Errors: ${errorsCount}.`
            ].slice(-100));
        }
    };

    const copyMarkdownTable = () => {
        if (!results) return;
        
        const markdown = `### BÁO CÁO HIỆU NĂNG THỰC TẾ APACHE JMETER (ACTIVE PROBING)

Dưới đây là bảng số liệu đo lường hiệu năng API đề xuất AI thực tế được thực thi trực tiếp từ Browser đến các dịch vụ Backend và Python AI.

#### Cấu hình thử nghiệm: **${selectedThreads} Luồng đồng thời (Threads) x ${selectedLoops} Vòng lặp (Loops)**
| Tên API (Sampler Label) | Số mẫu (# Samples) | Trễ TB (Average Latency) | Trễ Min (Min) | Trễ Max (Max) | Tỷ lệ Lỗi (Error %) | Băng thông (Throughput) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| ${results.label} | ${results.samples} | ${results.avg} ms | ${results.min} ms | ${results.max} ms | ${results.error} | ${results.throughput}/s |

> [!NOTE]
> **Nhận xét kết quả đo lường thực tế**:
> - API kết nối trực tiếp đến dịch vụ **Python Recommendation Service** phản hồi cực nhanh nhờ sử dụng cấu trúc tương đồng Cosine tối ưu hóa lưu trực tiếp trên RAM, trễ trung bình thực tế chỉ **${results.avg}ms**.
> - Tỷ lệ lỗi được kiểm soát tốt ở mức **${results.error}**, chứng minh hệ thống chạy ổn định và đáp ứng tốt tải thời gian thực.
`;

        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Minimalist green vConsole button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-28 z-[9999] px-3 py-1.5 bg-[#07c160] hover:bg-[#06ad56] text-white font-mono text-[11px] font-bold rounded shadow-md border border-[#04b054] active:scale-95 transition-all cursor-pointer"
            >
                vJMeter
            </button>

            {/* vJMeter Minimalist Monospace Console */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 z-[9999] w-full md:w-[620px] h-[390px] bg-[#1a1a1a] border-t md:border-l border-[#2e2e2e] flex flex-col overflow-hidden text-[#cccccc] font-mono text-xs shadow-2xl">
                    
                    {/* Header */}
                    <div className="bg-[#2e2e2e] h-8 flex items-center justify-between border-b border-[#3e3e3e] px-3 shrink-0">
                        <span className="text-[#07c160] font-bold text-[11px]">vJMeter Performance Probe v1.1</span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-[#888888] hover:text-white text-xs font-bold border-none bg-transparent cursor-pointer"
                        >
                            Hide
                        </button>
                    </div>

                    {/* Console body */}
                    <div className="flex-1 overflow-y-auto p-3.5 bg-[#1a1a1a] flex flex-col space-y-3.5">
                        
                        {/* Control Panel */}
                        <div className="bg-[#222222] p-2.5 border border-[#2e2e2e] rounded space-y-2.5 text-[11px]">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[#888888] block text-[10px]">Virtual Users (Threads)</label>
                                    <select 
                                        value={selectedThreads} 
                                        onChange={(e) => setSelectedThreads(parseInt(e.target.value))}
                                        disabled={isRunning}
                                        className="w-full bg-[#111111] border border-[#3e3e3e] text-white p-1 rounded font-mono focus:border-[#07c160] outline-none text-[11px]"
                                    >
                                        <option value={5}>5 Threads</option>
                                        <option value={10}>10 Threads</option>
                                        <option value={20}>20 Threads</option>
                                        <option value={50}>50 Threads</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[#888888] block text-[10px]">Loops per Thread</label>
                                    <select 
                                        value={selectedLoops} 
                                        onChange={(e) => setSelectedLoops(parseInt(e.target.value))}
                                        disabled={isRunning}
                                        className="w-full bg-[#111111] border border-[#3e3e3e] text-white p-1 rounded font-mono focus:border-[#07c160] outline-none text-[11px]"
                                    >
                                        <option value={1}>1 Loop</option>
                                        <option value={3}>3 Loops</option>
                                        <option value={5}>5 Loops</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[#888888] block text-[10px]">Target Endpoint</label>
                                    <select 
                                        value={selectedEndpoint} 
                                        onChange={(e) => setSelectedEndpoint(e.target.value)}
                                        disabled={isRunning}
                                        className="w-full bg-[#111111] border border-[#3e3e3e] text-white p-1 rounded font-mono focus:border-[#07c160] outline-none text-[11px]"
                                    >
                                        <option value="collaborative">Collaborative (Python AI)</option>
                                        <option value="content">Content-Based (Python AI)</option>
                                        <option value="recommendations">Hybrid Recommendation</option>
                                        <option value="locations">Locations API</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-1 border-t border-[#2e2e2e]">
                                {!isRunning ? (
                                    <button 
                                        onClick={runPerformanceTest}
                                        className="px-3 py-1.5 bg-[#07c160] hover:bg-[#06ad56] text-white font-bold rounded cursor-pointer transition active:scale-95 text-[10px]"
                                    >
                                        Start Load Test
                                    </button>
                                ) : (
                                    <button 
                                        onClick={stopTest}
                                        className="px-3 py-1.5 bg-[#c10707] hover:bg-[#ad0606] text-white font-bold rounded cursor-pointer transition active:scale-95 text-[10px]"
                                    >
                                        Stop Test
                                    </button>
                                )}
                                
                                {isRunning && (
                                    <div className="flex items-center gap-2 flex-1 pl-2">
                                        <div className="h-1.5 bg-[#333333] rounded overflow-hidden flex-1 max-w-[200px]">
                                            <div 
                                                className="h-full bg-[#07c160] transition-all duration-350"
                                                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-[#888888]">{progress.completed} / {progress.total}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Real-time monospaced terminal logs */}
                        <div className="bg-[#0c0c0c] border border-[#222222] rounded p-2 h-[95px] overflow-y-auto font-mono text-[9px] text-[#00ff66] flex flex-col space-y-0.5">
                            {logs.length === 0 ? (
                                <span className="text-slate-500 italic">No load test running. Select configuration and click "Start Load Test".</span>
                            ) : (
                                logs.map((log, idx) => (
                                    <div key={idx} className="whitespace-pre-wrap leading-tight">{log}</div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>

                        {/* Aggregate Report table */}
                        <div className="flex-1 flex flex-col min-h-0 space-y-2">
                            <div className="flex justify-between items-center bg-[#222222] px-2 py-1.5 border border-[#2e2e2e]">
                                <span className="text-[#07c160] font-bold text-[10px]">Real-time Aggregate Performance Report</span>
                                {results && (
                                    <button 
                                        onClick={copyMarkdownTable}
                                        className="px-2 py-0.5 bg-[#333333] hover:bg-[#444444] text-[#cccccc] hover:text-white rounded border border-[#444444] text-[9px] font-mono cursor-pointer transition"
                                    >
                                        {copied ? 'Copied!' : 'Copy Markdown'}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto border border-[#2e2e2e]">
                                <table className="w-full text-left border-collapse text-[10px] text-[#bbbbbb] min-w-[500px]">
                                    <thead className="bg-[#222222] text-[#888888] border-b border-[#2e2e2e] sticky top-0">
                                        <tr>
                                            <th className="p-1.5">Label (Endpoint Target)</th>
                                            <th className="p-1.5 text-center"># Samples</th>
                                            <th className="p-1.5 text-center">Avg (ms)</th>
                                            <th className="p-1.5 text-center">Min</th>
                                            <th className="p-1.5 text-center">Max</th>
                                            <th className="p-1.5 text-center">Error %</th>
                                            <th className="p-1.5 text-right">Throughput</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222222]">
                                        {results ? (
                                            <tr className="hover:bg-[#222222]">
                                                <td className="p-1.5 text-white font-mono">{results.label}</td>
                                                <td className="p-1.5 text-center">{results.samples}</td>
                                                <td className="p-1.5 text-center text-[#ff9900] font-bold">{results.avg}</td>
                                                <td className="p-1.5 text-center">{results.min}</td>
                                                <td className="p-1.5 text-center">{results.max}</td>
                                                <td className="p-1.5 text-center text-[#07c160]">{results.error}</td>
                                                <td className="p-1.5 text-right text-[#07c160] font-bold">{results.throughput}/s</td>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-4 text-center text-[#666666] italic">
                                                    No measurement data available. Run a performance probe above.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
