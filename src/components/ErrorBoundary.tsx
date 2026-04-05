import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean; message: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || 'Something went wrong.' }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', err, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
          <h1 className="bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-lg font-semibold text-transparent">
            This view hit an error
          </h1>
          <p className="mt-2 max-w-md font-mono text-[13px] text-rose-200/90">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: null })}
            className="btn-chrome mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
