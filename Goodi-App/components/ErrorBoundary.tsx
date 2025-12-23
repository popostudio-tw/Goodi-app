import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary Component
 * 
 * Catches React errors and prevents app crashes.
 * Logs errors to Firebase Crashlytics for monitoring.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state to trigger fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        // Log to Crashlytics if available
        try {
            // Dynamic import to avoid issues in non-browser environments
            import('../firebase').then(({ crashlytics }) => {
                if (crashlytics) {
                    // @ts-ignore - Crashlytics types may vary
                    crashlytics.recordError(error);
                    // @ts-ignore
                    crashlytics.log(`Component stack: ${errorInfo.componentStack}`);
                }
            });
        } catch (e) {
            console.error('Failed to log error to Crashlytics:', e);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
                    <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center">
                        <div className="mb-6">
                            <div className="text-6xl mb-4">🦖</div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                哎呀！Goodi 遇到一點小問題
                            </h1>
                            <p className="text-gray-600">
                                別擔心，重新載入頁面就可以繼續使用囉！
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg"
                        >
                            重新載入
                        </button>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    開發者資訊
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-xs text-red-600">
                                    {this.state.error.toString()}
                                </pre>
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
