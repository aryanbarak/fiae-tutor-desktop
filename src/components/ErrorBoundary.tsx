import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch and display rendering errors
 * Prevents black screens by showing error UI instead
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "2rem",
            background: "#300",
            color: "#ff6666",
            fontFamily: "monospace",
            fontSize: "14px",
            minHeight: "200px",
            borderRadius: "8px",
            border: "2px solid #ff6666",
          }}
        >
          <h2 style={{ color: "#ff6666", marginBottom: "1rem", fontSize: "18px" }}>
            ⚠️ Rendering Error
          </h2>
          <pre style={{ whiteSpace: "pre-wrap", marginBottom: "1rem", fontSize: "13px" }}>
            {this.state.error?.toString()}
          </pre>
          {this.state.errorInfo && (
            <details style={{ marginTop: "1rem" }}>
              <summary style={{ cursor: "pointer", color: "#ff9999" }}>
                Stack Trace
              </summary>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", marginTop: "0.5rem" }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: "1rem",
              padding: "8px 16px",
              background: "#ff6666",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
