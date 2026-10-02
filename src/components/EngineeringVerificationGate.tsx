import React from "react";
import { ShieldAlert } from "lucide-react";

type Language = "ar" | "fr" | "en";

export const EngineeringVerificationGate: React.FC<{
  language: Language;
  engineeringGate: any;
  inputs: any;
  onNavigateToCalculator: () => void;
  onOpenBatchProperties: () => void;
}> = ({ language, engineeringGate, inputs, onNavigateToCalculator, onOpenBatchProperties }) => (
<div className="bg-white dark:bg-[#0F172A] border-2 border-dashed border-amber-200 dark:border-amber-900/40 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center justify-center gap-6 max-w-3xl mx-auto my-12 animate-fade-in" dir="rtl">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center animate-bounce">
                  <ShieldAlert size={36} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
                    {language === "ar" ? "بوابة التحقق الهندسي: متطلبات الخلطة غير مكتملة" : "Engineering Verification Gate: Incomplete Mix Requirements"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans max-w-lg">
                    {language === "ar"
                      ? engineeringGate.summaryMessageAr
                      : engineeringGate.summaryMessageEn}
                  </p>
                </div>

                <div className="w-full border-t border-b border-slate-150/60 dark:border-slate-800/60 py-4 my-2 text-right space-y-3" dir="rtl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                      {language === "ar" ? "تفاصيل حالة المواد المطلوبة للخلطة الحالية" : "Required Material Status Details"}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {inputs.selectedMethod?.toUpperCase()} | {inputs.concreteType || "NSC"}
                    </span>
                  </div>

                  {/* Dynamic Role Cards */}
                  {engineeringGate.roles.map((r) => {
                    const isReady = r.status === "ready";
                    const isUnselected = r.status === "unselected";
                    const isIncomplete = r.status === "incomplete";
                    const isPendingApproval = r.status === "pending_approval";
                    const isIncompatible = r.status === "incompatible";

                    return (
                      <div
                        key={r.role}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                          isReady
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
                            : isUnselected
                            ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                            : isIncomplete || isPendingApproval
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40"
                            : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">{r.icon}</span>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                {language === "ar" ? r.roleLabelAr : r.roleLabelEn}
                              </span>
                              {r.isRequired && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  {language === "ar" ? "إلزامي" : "Required"}
                                </span>
                              )}
                            </div>

                            {r.selectedMaterial ? (
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                                🏷️ {r.selectedMaterial.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {language === "ar" ? "لم يتم تعيين مادة لهذا البند بعد" : "No material assigned yet"}
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 font-sans">
                              ℹ️ {language === "ar" ? r.sourceReasonAr : r.sourceReasonEn}
                            </span>

                            {isIncomplete && r.eligibility?.missingProperties && r.eligibility.missingProperties.length > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block mt-1">
                                {language === "ar" ? `تنقص الخصائص: ${r.eligibility.missingProperties.join(", ")}` : `Missing: ${r.eligibility.missingProperties.join(", ")}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isReady ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider">
                              {language === "ar" ? "🟢 مكتمل ومعتمد" : "Ready & Approved"}
                            </span>
                          ) : isUnselected ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToCalculator()}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <span>👉</span>
                              <span>{language === "ar" ? "تعيين في الخلطة" : "Assign in Mix"}</span>
                            </button>
                          ) : isIncomplete || isPendingApproval ? (
                            <button
                              type="button"
                              onClick={() => onOpenBatchProperties()}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <span>⚡</span>
                              <span>{language === "ar" ? "إكمال خصائص المواد" : "Complete Properties"}</span>
                            </button>
                          ) : isIncompatible ? (
                            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase font-mono">
                              {language === "ar" ? "❌ غير متوافق" : "Incompatible"}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase font-mono">
                              {language === "ar" ? "⚪ اختياري" : "Optional"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToCalculator()}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🧪</span>
                    <span>{language === "ar" ? "العودة إلى تحضير الخلطة" : "Return to Mix Preparation"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenBatchProperties()}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>{language === "ar" ? "إكمال خصائص المواد" : "Complete Material Properties"}</span>
                  </button>
                </div>
              </div>

);
