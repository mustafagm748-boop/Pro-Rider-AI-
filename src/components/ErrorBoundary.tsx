import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear storage:', e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-neutral-900 rounded-3xl p-8 border-2 border-yellow-400/40 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-yellow-400/10 text-yellow-400 rounded-2xl border border-yellow-400/30 flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                Pro Rider AI
              </h1>
              <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">
                Application Recovery
              </p>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed pt-2">
                An unforeseen error occurred in the visual display layout. You can reload the application or reset local cache data below.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-left overflow-x-auto max-h-32 text-[10px] text-red-400 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 bg-yellow-400 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={this.handleResetData}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl font-bold text-xs uppercase tracking-wider border border-neutral-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                Clear Local Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
