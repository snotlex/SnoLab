import React from "react";

export interface A4PageProps {
  pageNumber: number;
  title: string;
  isRtl: boolean;
  companyName: string;
  reportLanguage: "ar" | "fr" | "en";
  children: React.ReactNode;
  totalPages?: number;
}

export const A4Page: React.FC<A4PageProps> = ({ 
  pageNumber, 
  title, 
  isRtl, 
  companyName, 
  reportLanguage, 
  children, 
  totalPages = 10 
}) => {
  return (
    <div 
      id={`pdf-page-${pageNumber}`}
      className="pdf-page-container bg-white text-slate-900 p-[12mm] relative shadow-xl mx-auto my-6 border border-slate-200 flex flex-col justify-between overflow-hidden"
      style={{ 
        width: "210mm", 
        height: "297mm", 
        boxSizing: "border-box", 
        pageBreakAfter: "always",
        direction: isRtl ? "rtl" : "ltr"
      }}
    >
      {/* Page Header */}
      <div className="flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-100 pb-1.5 mb-3 font-sans uppercase tracking-wider">
        <span className="font-semibold text-slate-500">{companyName || "SNO Quality Lab"}</span>
        <span className="font-extrabold text-blue-600 dark:text-amber-500">{title}</span>
        <span className="font-mono">SNO-MX-2026-CERT</span>
      </div>

      {/* Watermark background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none rotate-12 z-0">
        <span className="text-[72px] font-black tracking-widest font-sans text-slate-900">SNO AI ENGINE</span>
      </div>

      {/* Page Content */}
      <div className="flex-1 flex flex-col justify-start z-10 overflow-hidden text-right">
        {children}
      </div>

      {/* Page Footer */}
      <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 mt-3 font-sans">
        <span>{new Date().toLocaleDateString(reportLanguage === "ar" ? "ar-EG" : "en-US")}</span>
        <span className="font-semibold tracking-wider text-slate-500">SNO® PLATFORM CERTIFICATION</span>
        <span>Page {pageNumber} of {totalPages}</span>
      </div>
    </div>
  );
};
