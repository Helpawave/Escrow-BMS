import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error("Critical Application Error:", error, errorInfo);
    
    // AUTO-RECOVERY: Detect dynamic import failures (MIME type mismatch/missing chunk)
    // and trigger a full reload to fetch the latest index.html and manifest.
    if (
      error.name === 'ChunkLoadError' || 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Expected a JavaScript-or-Wasm module script')
    ) {
      console.warn("Detected asset mismatch/chunk load error. Attempting automatic recovery...");
      setTimeout(() => {
        window.location.reload();
      }, 500); 
      return;
    }

    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = "/dashboard";
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-6 text-center">
          <div className="max-w-xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Error Icon & Visuals */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping opacity-25" />
              <div className="relative w-24 h-24 bg-destructive/10 rounded-3xl flex items-center justify-center border-2 border-destructive/20 shadow-inner">
                <ShieldAlert className="w-12 h-12 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-4">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Whoops! App encountered a hiccup
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                Something went wrong under the hood. Don't worry, your data is safe. 
                You can try refreshing the page or head back to the dashboard.
              </p>
            </div>

            {/* Error Details (Only in Development or for advanced debugging) */}
            {(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && this.state.error && (
              <div className="mt-8 p-4 md:p-6 bg-slate-900 rounded-2xl text-left border border-slate-800 shadow-2xl">
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Debug Console
                </p>
                <div className="overflow-auto max-h-60 space-y-2">
                  <p className="text-rose-400 text-xs font-mono font-bold">{this.state.error.toString()}</p>
                  <pre className="text-slate-500 text-[10px] font-mono leading-tight whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              <Button 
                onClick={this.handleReload} 
                className="h-14 font-black rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-transform shadow-xl shadow-slate-200 dark:shadow-none"
              >
                <RefreshCw className="w-5 h-5 mr-3 animate-spin-slow" />
                Reload Application
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleReset}
                className="h-14 font-black rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 hover:scale-[1.02] transition-transform"
              >
                <Home className="w-5 h-5 mr-3" />
                Back to Safety
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
              Error Reference: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
