import { Component, StrictMode, type PropsWithChildren, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

type AppErrorBoundaryState = {
  hasError: boolean;
};

class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: unknown) {
    console.error("PsyPerspective render failure", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <div className="ambient ambient-left" />
          <div className="ambient ambient-right" />
          <main className="app-frame">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Recovery</span>
                  <h2>The workspace hit a render error</h2>
                </div>
                <p>Refresh the page. If the issue continues, check the latest UI changes and browser console.</p>
              </div>
            </section>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootNode = document.getElementById("root");

if (!rootNode) {
  throw new Error("PsyPerspective root element was not found in index.html.");
}

createRoot(rootNode).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
