import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

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
      return (
        <div
          style={{
            padding: "2rem",
            background: "#300",
            color: "#ff6666",
            fontFamily: "monospace",
            fontSize: "14px",
            height: "100vh",
            overflow: "auto",
          }}
        >
          <h1 style={{ color: "#ff6666", marginBottom: "1rem" }}>
            ⚠️ React Error Caught
          </h1>
          <pre style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
            {this.state.error?.toString()}
          </pre>
          <h2 style={{ color: "#ff9999", marginBottom: "0.5rem" }}>
            Component Stack:
          </h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
