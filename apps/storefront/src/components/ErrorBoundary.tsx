import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-[#E4E2E1] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-[24px] bg-[#1F2020] border border-white/10 p-8 text-center space-y-4">
            <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-[#E0C0AF]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#FF7A00] text-[#121212] font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
