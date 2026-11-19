import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMsg = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed.error) displayMsg = parsed.error;
    } catch {
      // Plain error string
    }
    return { hasError: true, message: displayMsg };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('CyberShield ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 space-y-5 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-700 mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-900">Something Went Wrong</h1>
            <p className="text-base text-slate-600 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reload CyberShield</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
