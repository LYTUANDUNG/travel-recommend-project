import React, { Component, ErrorInfo, ReactNode } from "react";
import { MapPin } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Map rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center mb-4">
             <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Không thể tải bản đồ</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
             Đã xảy ra lỗi khi khởi tạo bản đồ. Vui lòng làm mới trang hoặc thử lại sau.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
