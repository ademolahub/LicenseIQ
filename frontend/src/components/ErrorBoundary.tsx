import React, { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled React error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-grid">
          <div className="card card-error">
            <h2>Something went wrong</h2>
            <p>We encountered an unexpected error. Please refresh the page and try again.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
