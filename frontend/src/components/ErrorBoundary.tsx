import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
                        <div className="text-6xl mb-4">😵</div>
                        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Oops! Something went wrong.</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We're sorry, but the application encountered an unexpected error.
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded text-left mb-6 overflow-auto max-h-32">
                            <code className="text-xs text-red-600 dark:text-red-400 font-mono">
                                {this.state.error?.message}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
