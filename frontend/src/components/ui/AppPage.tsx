import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16", className)}>
            {children}
        </div>
    );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
            {children}
        </div>
    );
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl shadow-sm", className)}>
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
                    <img src={media} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
                    <div className="absolute inset-0 bg-slate-950/65" />
                </>
            )}
            <div className={cn("relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6", media && "text-white")}>
                <div className="max-w-3xl">
                    {eyebrow && (
                        <div className={cn("text-[10px] font-black uppercase tracking-widest mb-3", media ? "text-orange-300" : "text-orange-500")}>
                            {eyebrow}
                        </div>
                    )}
                    <h1 className={cn("text-3xl md:text-5xl font-black leading-tight", media ? "text-white" : "text-slate-950 dark:text-white")}>
                        {title}
                    </h1>
                    {description && (
                        <p className={cn("mt-3 text-sm md:text-base max-w-2xl", media ? "text-slate-200" : "text-slate-500 dark:text-slate-400")}>
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap gap-3 shrink-0">{actions}</div>}
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

export const inputClassName = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors";

export const primaryButtonClassName = "inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed";

export const secondaryButtonClassName = "inline-flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
