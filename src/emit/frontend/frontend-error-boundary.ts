
import { Project } from "ts-morph";
import path from "node:path";
import { FrontendPolicy } from "../../ir/target/frontend.policy.js";

export function emitErrorBoundary(project: Project, srcDir: string, policy: FrontendPolicy) {
    const eb = policy.errorBoundary;
    if (!eb.enabled) return;

    const componentName = eb.componentName;
    const filePath = path.join(srcDir, "components", `${componentName}.tsx`);
    const sf = project.createSourceFile(filePath, "", { overwrite: true });

    sf.addStatements([
        `import React, { Component, ErrorInfo, ReactNode } from "react";`,
        ``,
        `interface Props {`,
        `  children?: ReactNode;`,
        `}`,
        ``,
        `interface State {`,
        `  hasError: boolean;`,
        `  error?: Error;`,
        `}`,
        ``,
        `export class ${componentName} extends Component<Props, State> {`,
        `  public state: State = {`,
        `    hasError: false`,
        `  };`,
        ``,
        `  public static getDerivedStateFromError(error: Error): State {`,
        `    return { hasError: true, error };`,
        `  }`,
        ``,
        `  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {`,
        `    console.error("Uncaught error:", error, errorInfo);`,
        `  }`,
        ``,
        `  public render() {`,
        `    if (this.state.hasError) {`,
        `      return (`,
        `        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md">`,
        `          <h2 className="text-lg font-semibold text-red-800">Something went wrong.</h2>`,
        ...(eb.fallback === "detailed" ? [
            `          <details className="mt-2 text-sm text-red-600">`,
            `            <summary>Error Details</summary>`,
            `            <pre className="mt-1 whitespace-pre-wrap">{this.state.error?.toString()}</pre>`,
            `          </details>`
        ] : [
            `          <p className="text-sm text-red-600">Please refresh the page or try again later.</p>`
        ]),
        `        </div>`,
        `      );`,
        `    }`,
        ``,
        `    return this.props.children;`,
        `  }`,
        `}`,
    ]);
}
