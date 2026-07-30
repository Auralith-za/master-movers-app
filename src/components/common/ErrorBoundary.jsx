import React from 'react'

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            const errorMsg = this.state.error?.toString() || 'Unknown error'
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                            ⚠️
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Application Error</h2>
                        <p className="text-sm text-slate-500 mb-4">An unexpected error occurred in this view.</p>
                        
                        <div className="bg-red-50 text-red-700 text-xs font-mono p-3 rounded-lg border border-red-200 mb-6 text-left overflow-x-auto max-h-32">
                            {errorMsg}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-red-700 transition-colors"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
