import React, { Component } from "react";

interface AsyncBoundaryProps {
  children: React.ReactNode;
  language?: string;
}

interface AsyncBoundaryState {
  hasError: boolean;
}

export class AsyncBoundary extends Component<AsyncBoundaryProps, AsyncBoundaryState> {
  declare props: AsyncBoundaryProps;
  declare setState: (state: AsyncBoundaryState) => void;
  state: AsyncBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AsyncBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("[AsyncBoundary] lazy feature failed to load", error);
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    const isAr = this.props.language === "ar";
    const isFr = this.props.language === "fr";

    return (
      <section
        role="alert"
        aria-live="assertive"
        className="mx-auto my-8 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-slate-800 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-slate-100"
        dir={isAr ? "rtl" : "ltr"}
      >
        <h2 className="text-base font-black">{isAr ? "تعذر تحميل هذه الأداة" : isFr ? "Impossible de charger cet outil" : "Unable to load this tool"}</h2>
        <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
          {isAr ? "حدث خطأ مؤقت أثناء تحميل الواجهة. يمكنك إعادة المحاولة دون فقدان بيانات المشروع الحالية." : isFr ? "Une erreur temporaire est survenue. Réessayez sans perdre les données du projet." : "A temporary loading error occurred. Retry without losing the current project data."}
        </p>
        <button
          type="button"
          onClick={this.retry}
          className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
        >
          {isAr ? "إعادة المحاولة" : isFr ? "Réessayer" : "Retry"}
        </button>
      </section>
    );
  }
}

export function AsyncLoadingState({ language = "ar" }: { language?: string }): React.ReactElement {
  const isAr = language === "ar";
  const isFr = language === "fr";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] p-8 text-center font-sans text-slate-400"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div
        className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"
        role="progressbar"
        aria-label={isAr ? "جاري التحميل" : isFr ? "Chargement" : "Loading"}
      />
      <span className="font-bold text-slate-200">{isAr ? "SNO Engineering - جاري تحميل الأدوات الهندسية..." : isFr ? "SNO Engineering - Chargement des outils..." : "SNO Engineering - Loading engineering tools..."}</span>
      <span className="mt-2 text-xs text-slate-500">{isAr ? "يرجى الانتظار لتجهيز الواجهات والرسومات والتحاليل المعملية" : isFr ? "Veuillez patienter pendant la préparation des interfaces et analyses." : "Please wait while interfaces and analyses are prepared."}</span>
    </div>
  );
}
