import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Void Disruption:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-10 font-biz-mincho border-4 border-red-950">
          <div className="text-[#f15a24] text-4xl font-black mb-8 tracking-tighter uppercase">Spectral Convergence Failed</div>
          <div className="max-w-2xl text-white/60 text-center leading-relaxed mb-10 italic">
            「霊界の同期中に予期せぬ歪みが発生しました。深淵は一時的に閉ざされています。」
          </div>
          <div className="bg-red-950/20 p-6 border border-red-900/50 rounded-lg max-w-2xl overflow-auto group">
            <code className="text-red-400 text-xs font-mono break-all">
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-12 px-8 py-3 bg-[#f15a24] text-black font-black uppercase tracking-widest hover:bg-white transition-colors"
          >
            Ritual Retry / 儀式の再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
