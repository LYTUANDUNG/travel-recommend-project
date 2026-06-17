import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("w-full animate-in fade-in duration-500", className)}>
            {children}
        </div>
    );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("max-w-7xl mx-auto space-y-8", className)}>
            {children}
        </div>
    );
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.012)]", className)}>
            {children}
        </div>
    );
}

export function PageHeader({
    eyebrow,
    title,
    description,
    media,
    actions,
    className
}: {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    media?: string;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <Surface className={cn("relative overflow-hidden p-6 md:p-8", className)}>
            {media && (
                <>
                    <img src={media} alt="" className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-950/40" />
                </>
            )}
            <div className={cn("relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6", media && "text-white")}>
                <div className="max-w-3xl">
                    {eyebrow && (
                        <div className={cn("text-xs font-bold uppercase tracking-wider mb-2.5", media ? "text-orange-350" : "text-orange-500")}>
                            {eyebrow}
                        </div>
                    )}
                    <h1 className={cn("font-serif text-2xl md:text-3xl font-black leading-tight tracking-tight", media ? "text-white" : "text-slate-950 dark:text-white")}>
                        {title}
                    </h1>
                    {description && (
                        <p className={cn("mt-2.5 text-xs md:text-sm max-w-2xl font-medium", media ? "text-slate-200/95" : "text-slate-500 dark:text-slate-400")}>
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap gap-2.5 shrink-0 relative z-20">{actions}</div>}
            </div>
        </Surface>
    );
}

export function PageLoader({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
    return (
        <PageShell className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-sm font-bold">{label}</span>
            </div>
        </PageShell>
    );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
    return (
        <Surface className="p-10 text-center">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
            {description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            {action && <div className="mt-6 flex justify-center">{action}</div>}
        </Surface>
    );
}

export const inputClassName = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all";

export const primaryButtonClassName = "text-xs font-semibold tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm hover:shadow-md hover:shadow-orange-500/15 active:scale-[0.98] transition-all duration-300 rounded-xl px-5 py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

export const secondaryButtonClassName = "text-xs font-semibold tracking-wide bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 hover:border-slate-350 hover:text-slate-900 active:scale-[0.98] transition-all duration-300 rounded-xl px-5 py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
