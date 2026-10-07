import { Component, ErrorInfo, PropsWithChildren, StrictMode } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from "./services/localization";
import { ProjectProvider } from "./services/storage/ProjectContext";
import { ProjectWorkflowProvider } from "./services/workflow/ProjectWorkflowController";

type AppErrorBoundaryState = { error: Error | null };
type AppErrorBoundaryProps = PropsWithChildren<{}>;

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare props: AppErrorBoundaryProps;
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SnoLab] React render error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main dir="rtl" style={{ minHeight: "100vh", padding: "32px", background: "#071126", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <section style={{ maxWidth: "860px", margin: "0 auto", border: "1px solid #7f1d1d", borderRadius: "16px", padding: "24px", background: "#1e293b" }}>
          <h1 style={{ marginTop: 0, color: "#fca5a5" }}>تعذر تحميل واجهة SnoLab</h1>
          <p>حدث خطأ أثناء تشغيل الواجهة. أعد تحميل الصفحة، وإذا تكرر الخطأ أرسل نص التشخيص التالي:</p>
          <pre dir="ltr" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: "16px", borderRadius: "8px", background: "#020617", color: "#fecaca" }}>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{ cursor: "pointer", border: 0, borderRadius: "8px", padding: "10px 18px", background: "#2563eb", color: "white" }}>
            إعادة تحميل الصفحة
          </button>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#C7F43A] focus:px-4 focus:py-3 focus:font-bold focus:text-[#0A0F15] focus:shadow-xl"
    >
      تخطي إلى المحتوى الرئيسي / Skip to main content
    </a>
    <AppErrorBoundary>
      <div id="main-content" tabIndex={-1}>
        <LanguageProvider>
        <ProjectProvider>
            <ProjectWorkflowProvider>
              <App />
            </ProjectWorkflowProvider>
          </ProjectProvider>
        </LanguageProvider>
      </div>
    </AppErrorBoundary>
  </StrictMode>,
);
