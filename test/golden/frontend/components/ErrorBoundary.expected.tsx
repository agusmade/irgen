import React, { Component, ErrorInfo, ReactNode } from "react";
interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong.</h2>
          <p className="text-sm text-red-600">Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }

}
