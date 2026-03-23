import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error) {
    // 防止错误循环
    const now = Date.now();
    return {
      hasError: true,
      error,
      lastErrorTime: now
    };
  }

  componentDidCatch(error, info) {
    // 防止DOM操作错误导致的无限循环
    if (error.message && error.message.includes('insertBefore') &&
        error.message.includes('not a child of this node')) {
      console.warn('React DOM insertBefore error caught and suppressed:', error.message);

      // 延迟重置状态，避免立即重新渲染
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          info: null
        });
      }, 100);
      return;
    }

    const now = Date.now();
    const errorCount = this.state.errorCount + 1;

    // 如果错误频繁发生（1秒内超过3次），停止重试
    if (errorCount > 3 && (now - this.state.lastErrorTime) < 1000) {
      console.error('Too many errors in short time, stopping error handling');
      this.setState({
        hasError: true,
        error: new Error('应用遇到了严重错误，请刷新页面'),
        info,
        errorCount,
        lastErrorTime: now
      });
      return;
    }

    console.error('Global React ErrorBoundary caught:', error, info);
    this.setState({
      info,
      errorCount,
      lastErrorTime: now
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, info: null });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-md w-full bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border border-purple-100">
            <h1 className="text-2xl font-bold mb-4 text-purple-600">页面发生错误</h1>
            <p className="text-sm text-gray-600 mb-4 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >重新尝试</button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full mt-3 py-3 rounded-xl border border-purple-300 text-purple-600 font-semibold hover:bg-purple-50 transition"
            >返回首页</button>
            {process.env.NODE_ENV !== 'production' && (
              <details className="mt-4 text-xs whitespace-pre-wrap max-h-40 overflow-auto bg-gray-50 p-3 rounded">
                <summary className="cursor-pointer mb-2 text-gray-500">调试信息</summary>
                {this.state.info?.componentStack}
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
