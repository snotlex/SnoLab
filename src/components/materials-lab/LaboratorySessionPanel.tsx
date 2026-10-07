import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Play, FlaskConical, ChevronDown, ChevronUp, Copy, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Download } from "lucide-react";
import type { EngineeringMaterial } from "../../types";
import type { MaterialTestRecord } from "../../types/laboratoryTypes";
import type { LaboratorySession } from "../../types/laboratorySessionTypes";
import type { RegisteredEquipment, RegisteredStandard } from "../../services/laboratoryRegistry";
import {
  addSessionSample,
  addSessionTest,
  addTestReplicate,
  createLaboratorySession,
  legacyRecordToLaboratorySession,
  runReadyLaboratoryTests,
  summarizeLaboratorySession,
  validateLaboratorySession
} from "../../services/laboratorySessionService";
import { MASTER_TEST_CATALOG, executeLaboratoryTest } from "../../services/materialsLabEngine";
import { getCompatibleMaterials } from "../../services/laboratoryMaterialCompatibility";
import { buildLaboratorySessionReport, downloadLaboratorySessionPdf, downloadLaboratorySessionReport } from "../../services/laboratorySessionReport";
import { evaluateLaboratorySessionGovernance } from "../../services/laboratorySessionGovernance";

interface LaboratorySessionPanelProps {
  materials: EngineeringMaterial[];
  legacyTests: MaterialTestRecord[];
  language?: "ar" | "fr" | "en";
  projectId?: string;
  projectName?: string;
  onOpenTest?: (testId: string, category: any, materialId?: string) => void;
  projectSessions?: LaboratorySession[];
  onSessionsChange?: (sessions: LaboratorySession[]) => void;
  standardRegistry?: RegisteredStandard[];
  equipmentRegistry?: RegisteredEquipment[];
}

const text = (language: string, ar: string, fr: string, en: string) => language === "ar" ? ar : language === "fr" ? fr : en;
const STORAGE_KEY = "snolab_laboratory_sessions_v1";

export const LaboratorySessionPanel: React.FC<LaboratorySessionPanelProps> = ({ materials, legacyTests, language = "ar", projectId, projectName, onOpenTest, projectSessions, onSessionsChange, standardRegistry = [], equipmentRegistry = [] }) => {
  const storageKey = `${STORAGE_KEY}:${projectId || "global"}`;
  const [sessions, setSessions] = useState<LaboratorySession[]>(() => {
    if (projectSessions) return projectSessions;
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (saved) return JSON.parse(saved) as LaboratorySession[];
    } catch { /* use compatibility views below */ }
    return legacyTests.slice(0, 12).map(legacyRecordToLaboratorySession);
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [sampleNumber, setSampleNumber] = useState("");
  const [sampleCode, setSampleCode] = useState("");
  const [materialId, setMaterialId] = useState(materials[0]?.id || "");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(sessions)); } catch { /* storage remains session-local */ }
    onSessionsChange?.(sessions);
  }, [sessions, storageKey]);

  useEffect(() => {
    if (projectSessions) setSessions(projectSessions);
  }, [projectSessions]);

  const activeSession = sessions.find(session => session.id === activeId) || sessions[0];
  const activeSummary = activeSession ? summarizeLaboratorySession(activeSession) : null;
  const governance = activeSession ? evaluateLaboratorySessionGovernance(activeSession) : null;
  const selectedMaterial = materials.find(material => material.id === materialId);
  const visibleCatalog = useMemo(() => MASTER_TEST_CATALOG.filter(test => getCompatibleMaterials(test.id, materials).some(material => material.id === materialId)).slice(0, 36), [materials, materialId]);
  const visibleStandards = useMemo(() => {
    const selected = selectedTestIds.length ? selectedTestIds : visibleCatalog.map(test => test.id);
    return standardRegistry.filter(standard => selected.some(testId => standard.coveredTestIds?.includes(testId)));
  }, [selectedTestIds, standardRegistry, visibleCatalog]);

  const createSession = () => {
    if (!requestNumber.trim() || !sampleNumber.trim() || !sampleCode.trim() || !selectedMaterial || !selectedTestIds.length) {
      setMessage(text(language, "أدخل رقم الطلب والعينة والمادة واختر اختبارًا واحدًا على الأقل.", "Renseignez la demande, l'échantillon, le matériau et au moins un essai.", "Enter request, sample, material, and at least one test."));
      return;
    }
    try {
      const selectedStandard = standardRegistry.find(standard => standard.id === selectedStandardId);
      if (selectedStandard && selectedTestIds.some(testId => !selectedStandard.coveredTestIds?.includes(testId))) {
        setMessage(text(language, "المعيار المختار لا يغطي كل الاختبارات المحددة.", "La norme choisie ne couvre pas tous les essais sélectionnés.", "The selected standard does not cover every selected test."));
        return;
      }
      let next = createLaboratorySession({ requestNumber, projectId, projectName });
      if (selectedStandard || selectedEquipmentIds.length) {
        next = createLaboratorySession({ requestNumber, projectId, projectName, governance: {
          standardId: selectedStandard?.id,
          standardSnapshot: selectedStandard ? { id: selectedStandard.id, organization: selectedStandard.organization, code: selectedStandard.code, version: selectedStandard.version, status: selectedStandard.status, effectiveFrom: selectedStandard.effectiveFrom, effectiveTo: selectedStandard.effectiveTo, acceptanceRule: selectedStandard.acceptanceRule } : undefined,
          equipmentIds: selectedEquipmentIds,
          equipmentCalibrationSnapshots: selectedEquipmentIds.map(id => equipmentRegistry.find(device => device.id === id || device.equipmentId === id)).filter(Boolean).map(device => ({ id: device!.id, equipmentId: device!.equipmentId, serialNumber: device!.serialNumber, calibrationDate: device!.calibrationDate, nextCalibrationDate: device!.nextCalibrationDate, status: device!.status, location: device!.location }))
        }});
      }
      next = addSessionSample(next, { sampleNumber, sampleCode, materialId: selectedMaterial.id, materialName: selectedMaterial.name, materialCategory: selectedMaterial.category });
      const sampleId = next.samples[0].id;
      for (const testId of selectedTestIds) {
        const definition = MASTER_TEST_CATALOG.find(test => test.id === testId);
        if (!definition) continue;
        next = addSessionTest(next, {
          testType: definition.id,
          testTitleAr: definition.titleAr,
          testTitleFr: definition.titleFr,
          testTitleEn: definition.titleEn,
          standard: selectedStandard ? `${selectedStandard.organization} ${selectedStandard.code}:${selectedStandard.version}` : definition.standard,
          materialId: selectedMaterial.id,
          sampleId,
          status: "DRAFT",
          requiredReplicates: 1,
          hasChart: ["AGG_SIEVE", "AGG_BULKING_SAND", "CEM_SETTING_TIME", "CEM_COMPRESSIVE_STRENGTH"].includes(definition.id)
        });
      }
      setSessions(prev => [next, ...prev]);
      setActiveId(next.id);
      setShowCreate(false);
      setMessage(text(language, "تم إنشاء الطلب وحفظ الاختبارات كعناصر مستقلة.", "La demande et ses essais indépendants sont enregistrés.", "Request and independent test items saved."));
      setSelectedTestIds([]);
      setSelectedStandardId("");
      setSelectedEquipmentIds([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create laboratory session.");
    }
  };

  const addReplicate = (testId: string) => {
    if (!activeSession) return;
    try {
      const next = addTestReplicate(activeSession, testId, { sampleId: activeSession.tests.find(test => test.id === testId)!.sampleId, status: "EMPTY", rawInputs: {} });
      setSessions(prev => prev.map(session => session.id === next.id ? next : session));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not add replicate."); }
  };

  const runReady = async () => {
    if (!activeSession || running) return;
    const validation = validateLaboratorySession(activeSession);
    if (!validation.valid) {
      setMessage(text(language, `لا يمكن التشغيل: ${validation.issues[0]?.message || "بيانات ناقصة"}`, `Exécution impossible : ${validation.issues[0]?.message || "données incomplètes"}`, `Cannot run: ${validation.issues[0]?.message || "incomplete data"}`));
      return;
    }
    setRunning(true);
    const result = await runReadyLaboratoryTests(activeSession, (item, replicate) => {
      const material = materials.find(candidate => candidate.id === item.materialId);
      if (!material || !Object.keys(replicate.rawInputs).length) return { testId: item.id, status: "BLOCKED" as const, error: "Measurement inputs are not entered." };
      const calculated = executeLaboratoryTest(item.testType, replicate.rawInputs, material);
      return { testId: item.id, status: calculated.status, record: { results: calculated.results, score: calculated.score } as MaterialTestRecord };
    });
    setSessions(prev => prev.map(session => session.id === result.session.id ? result.session : session));
    setRunning(false);
    setMessage(text(language, `تم تنفيذ ${result.results.length} عنصر مستقل دون إلغاء بقية الاختبارات.`, ` ${result.results.length} élément(s) exécuté(s) indépendamment.`, `${result.results.length} item(s) executed independently.`));
  };

  const exportSessionReport = async (format: "pdf" | "html" | "json" | "csv") => {
    if (!activeSession) return;
    const report = buildLaboratorySessionReport(activeSession, { language: language as "ar" | "fr" | "en" });
    if (format === "pdf") await downloadLaboratorySessionPdf(report);
    else downloadLaboratorySessionReport(report, format);
    setMessage(text(language, "تم إنشاء التقرير الرسمي مع بصمة سلامة البيانات.", "Le rapport officiel a été généré avec son empreinte d'intégrité.", "Official report generated with its integrity hash."));
  };

  const statusLabel = (status: string) => ({ DRAFT: text(language, "مسودة", "Brouillon", "Draft"), READY: text(language, "جاهز", "Prêt", "Ready"), RUNNING: text(language, "قيد التنفيذ", "En cours", "Running"), PASS: "PASS", WARNING: "WARNING", FAIL: "FAIL", BLOCKED: text(language, "محظور", "Bloqué", "Blocked") }[status] || status);

  return <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-950" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300"><ClipboardList className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-wider">{text(language, "مركز الطلبات والجلسات المختبرية", "Centre des demandes et sessions", "Laboratory requests & sessions")}</span></div>
        <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{activeSession?.requestNumber || text(language, "ابدأ طلبًا متعدد الاختبارات", "Créer une demande multi-essais", "Start a multi-test request")}</h2>
        <p className="mt-1 text-xs text-slate-500">{text(language, "كل اختبار وعينة وتكرار يحتفظ بمدخلاته وحالته وسجل تدقيقه بشكل مستقل.", "Chaque essai, échantillon et répétition conserve ses données et son statut.", "Each test, sample, and replicate keeps independent inputs, status, and audit data.")}</p>
      </div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowCreate(value => !value)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />{text(language, "طلب جديد متعدد الاختبارات", "Nouvelle demande multi-essais", "New multi-test request")}</button>{activeSession && <><button type="button" disabled={running} onClick={runReady} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Play className="h-4 w-4" />{running ? text(language, "جارٍ التنفيذ...", "Exécution...", "Running...") : text(language, "تشغيل الجاهز", "Exécuter les prêts", "Run ready tests")}</button><div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"><Download className="mx-1 h-3.5 w-3.5 text-slate-500" /><button type="button" onClick={() => void exportSessionReport("pdf")} className="rounded-lg px-2 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200">PDF</button><button type="button" onClick={() => void exportSessionReport("html")} className="rounded-lg px-2 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200">HTML</button><button type="button" onClick={() => void exportSessionReport("json")} className="rounded-lg px-2 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200">JSON</button><button type="button" onClick={() => void exportSessionReport("csv")} className="rounded-lg px-2 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200">CSV</button></div></>}</div>
    </div>
    {activeSession && governance && <div data-testid="laboratory-governance-panel" className={`mt-4 rounded-2xl border p-3 ${governance.official ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-black"><AlertTriangle className="h-4 w-4 text-amber-600" />{text(language, governance.official ? "بوابة الحوكمة الرسمية جاهزة" : "الجلسة في الوضع التشخيصي فقط", governance.official ? "Gouvernance officielle prête" : "Session en mode diagnostique", governance.official ? "Official governance ready" : "Diagnostic-only session")}</div><p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">{text(language, governance.official ? "يمكن الانتقال إلى مراجعة مستقلة وفق السجل الموثق." : "لا تُستخدم هذه الجلسة كاعتماد مختبري رسمي قبل استكمال السجل الموثق.", governance.official ? "La revue indépendante peut commencer avec les preuves enregistrées." : "Cette session ne constitue pas une approbation officielle avant complétion des preuves.", governance.official ? "Independent review may proceed with recorded evidence." : "This session is not an official laboratory approval until traceable evidence is complete.")}</p></div><span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-black text-amber-700 dark:bg-slate-900/60">{governance.releaseEligibility}</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{governance.checks.map(check => <div key={check.id} className={`rounded-xl border p-2 ${check.ready ? "border-emerald-200 bg-emerald-100/70 text-emerald-800" : "border-amber-200 bg-white/70 text-amber-800 dark:border-amber-900/60 dark:bg-slate-900/50"}`}><div className="flex items-center gap-1 text-[10px] font-black">{check.ready ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{text(language, check.labelAr, check.labelFr, check.labelEn)}</div><div className="mt-1 font-mono text-[9px] opacity-70">{check.code}</div></div>)}</div>
    </div>}

    {showCreate && <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4 dark:border-indigo-900 dark:bg-slate-900"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-bold">{text(language, "رقم الطلب", "N° demande", "Request number")}<input value={requestNumber} onChange={event => setRequestNumber(event.target.value)} placeholder="LAB-2026-001" className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">{text(language, "رقم العينة", "N° échantillon", "Sample number")}<input value={sampleNumber} onChange={event => setSampleNumber(event.target.value)} placeholder="AGG-001" className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">{text(language, "رمز العينة", "Code échantillon", "Sample code")}<input value={sampleCode} onChange={event => setSampleCode(event.target.value)} placeholder="AGG-001-A" className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">{text(language, "المادة", "Matériau", "Material")}<select value={materialId} onChange={event => setMaterialId(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950">{materials.map(material => <option key={material.id} value={material.id}>{material.name}</option>)}</select></label></div><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"><label className="text-xs font-bold">{text(language, "المعيار المسجل", "Norme enregistrée", "Registered standard")}<select value={selectedStandardId} onChange={event => setSelectedStandardId(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">{text(language, "بدون snapshot — تشخيصي", "Sans snapshot — diagnostique", "No snapshot — diagnostic")}</option>{visibleStandards.map(standard => <option key={standard.id} value={standard.id}>{standard.organization} {standard.code}:{standard.version} · {standard.status}</option>)}</select></label><div className="text-xs font-bold">{text(language, "أجهزة ومعايرة الجلسة", "Appareils et étalonnage", "Session equipment & calibration")}<div className="mt-1 max-h-24 overflow-auto rounded-lg border p-2 dark:border-slate-700">{equipmentRegistry.length ? equipmentRegistry.map(device => <label key={device.id} className="flex items-center gap-2 py-1 text-[10px] font-normal"><input type="checkbox" checked={selectedEquipmentIds.includes(device.id)} onChange={event => setSelectedEquipmentIds(prev => event.target.checked ? [...prev, device.id] : prev.filter(id => id !== device.id))} />{device.name} · {device.serialNumber || device.equipmentId} · {device.status}</label>) : <span className="text-[10px] text-slate-500">{text(language, "لا توجد أجهزة مسجلة في المشروع.", "Aucun appareil enregistré dans le projet.", "No registered project equipment.")}</span>}</div></div></div><div className="mt-4"><div className="mb-2 text-xs font-black">{text(language, "اختر عدة اختبارات", "Sélectionnez plusieurs essais", "Select multiple tests")}</div><div className="grid max-h-52 grid-cols-1 gap-2 overflow-auto md:grid-cols-2 lg:grid-cols-3">{visibleCatalog.map(test => <label key={test.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-2 text-xs hover:border-indigo-400 dark:border-slate-700"><input type="checkbox" checked={selectedTestIds.includes(test.id)} onChange={event => setSelectedTestIds(prev => event.target.checked ? [...prev, test.id] : prev.filter(id => id !== test.id))} /><span><strong>{language === "ar" ? test.titleAr : language === "fr" ? test.titleFr : test.titleEn}</strong><span className="block text-[10px] text-slate-500">{test.id} · {test.standard}</span></span></label>)}</div></div><div className="mt-4 flex justify-end"><button type="button" onClick={createSession} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white dark:bg-white dark:text-slate-900">{text(language, "إنشاء الطلب", "Créer la demande", "Create request")}</button></div></div>}

    {message && <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{message}</div>}
    {sessions.length > 0 && <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]"><aside className="space-y-2">{sessions.map(session => { const summary = summarizeLaboratorySession(session); return <button key={session.id} type="button" onClick={() => setActiveId(session.id)} className={`w-full rounded-xl border p-3 text-start ${activeSession?.id === session.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}><span className="block truncate text-xs font-black">{session.requestNumber}</span><span className="mt-1 block text-[10px] text-slate-500">{summary.totalTests} {text(language, "اختبارات", "essais", "tests")} · {summary.completionPercent}%</span><span className="mt-1 block text-[10px] font-bold text-indigo-600">{statusLabel(summary.status)}</span></button>; })}</aside><div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">{activeSession && activeSummary && <><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{[[text(language, "الكل", "Total", "Total"), activeSummary.totalTests, "text-slate-700"], [text(language, "مكتمل", "Terminés", "Done"), activeSummary.completedTests, "text-emerald-600"], [text(language, "جاهز", "Prêts", "Ready"), activeSummary.readyTests, "text-blue-600"], [text(language, "فاشل", "Échecs", "Failed"), activeSummary.failedTests, "text-rose-600"], [text(language, "محظور", "Bloqués", "Blocked"), activeSummary.blockedTests, "text-orange-600"]].map(([label, value, tone]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-950"><span className="block text-[10px] text-slate-500">{label}</span><strong className={`text-xl font-black ${tone}`}>{value}</strong></div>)}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${activeSummary.completionPercent}%` }} /></div><div className="mt-4 space-y-2">{activeSession.tests.map(test => <div key={test.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex flex-wrap items-start justify-between gap-2"><div><span className="me-2 inline-flex rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">#{test.sequence} · {test.testType}</span><strong className="text-xs">{language === "ar" ? test.testTitleAr : language === "fr" ? test.testTitleFr : test.testTitleEn}</strong><span className="mt-1 block text-[10px] text-slate-500">{test.standard} · {activeSession.samples.find(sample => sample.id === test.sampleId)?.sampleCode || "—"} · {test.replicates.length} {text(language, "تكرار", "répétitions", "replicates")}</span></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${test.status === "PASS" ? "bg-emerald-100 text-emerald-700" : test.status === "BLOCKED" || test.status === "FAIL" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{statusLabel(test.status)}</span></div><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => addReplicate(test.id)} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold"><Copy className="h-3 w-3" />{text(language, "إضافة تكرار", "Ajouter répétition", "Add replicate")}</button>{onOpenTest && <button type="button" onClick={() => onOpenTest(test.testType, MASTER_TEST_CATALOG.find(definition => definition.id === test.testType)?.category || "aggregates", test.materialId)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-700"><ExternalLink className="h-3 w-3" />{text(language, "فتح نموذج الاختبار", "Ouvrir l'essai", "Open test")}</button>}</div>{test.replicates.length > 0 && <div className="mt-2 grid gap-1 sm:grid-cols-3">{test.replicates.map(replicate => <div key={replicate.id} className="rounded-lg bg-slate-50 p-2 text-[10px] dark:bg-slate-950"><span className="font-bold">Replicate {replicate.sequence}</span><span className="ms-2 text-slate-500">{replicate.status}</span>{replicate.numericResult !== undefined && <span className="ms-2 font-mono">{replicate.numericResult}</span>}</div>)}</div>}</div>)}</div></>}</div></div>}
    {sessions.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500"><FlaskConical className="mx-auto mb-2 h-8 w-8 text-indigo-400" />{text(language, "لا توجد جلسات بعد. أنشئ طلبًا يضم عدة اختبارات.", "Aucune session. Créez une demande avec plusieurs essais.", "No sessions yet. Create a request with multiple tests.")}</div>}
  </section>;
};
