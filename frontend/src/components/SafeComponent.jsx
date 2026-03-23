import React, { Component } from 'react';

class SafeComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // 如果是DOM操作错误，尝试恢复
    if (error.message && error.message.includes('insertBefore')) {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    // 特殊处理DOM操作错误
    if (error.message && error.message.includes('insertBefore')) {
      console.warn('DOM operation error caught in SafeComponent:', error.message);

      // 限制重试次数
      if (this.state.retryCount < 3) {
        setTimeout(() => {
          this.setState({
            hasError: false,
            retryCount: this.state.retryCount + 1
          });
        }, 100);
      } else {
        console.error('Too many DOM errors, giving up retry');
      }
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 3) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            组件加载出现问题，请刷新页面重试
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
          >
            刷新页面
          </button>
        </div>
      );
    }

    if (this.state.hasError) {
      // 正在重试中
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-sm text-gray-600">重新加载中...</span>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeComponent;