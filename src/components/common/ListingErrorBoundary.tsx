import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ListingErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ListingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ListingErrorBoundary extends Component<
  ListingErrorBoundaryProps,
  ListingErrorBoundaryState
> {
  constructor(props: ListingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ListingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ListingErrorBoundary caught render error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-4 my-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Couldn't display this result, try again
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              An unexpected format issue occurred while displaying the listing copy. Please try regenerating again.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-md shadow-[#FF6B5A]/25"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
