import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Beaker, Plus, Save, ShieldAlert, Trash2, X } from "lucide-react";
import type { LaboratoryTestRun } from "../../types/laboratoryDomain";
import type { LaboratorySession } from "../../types/laboratorySessionTypes";
import type { ProctorResult, SoilSieveResult } from "../../services/geotechnicalTestEngine";
import { executeGeotechnicalLaboratoryTest, getGeotechnicalTestDefinition } from "../../services/geotechnicalLaboratoryEngine";
import { addSessionSample, addSessionTest, addTestReplicate, createLaboratorySession, recordGeotechnicalTestRun } from "../../services/laboratorySessionService";
import { inferLaboratorySessionDomain } from "../../services/laboratoryDomains";

interface Props {
  language: "ar" | "fr" | "en";
  projectId?: string;
  projectName?: string;
  projectSessions?: LaboratorySession[];
  onSessionsChange?: (sessions: LaboratorySession[]) => void;
  initialTestId?: string;
  onClose?: () => void;
}

type DiagnosticTestId = "GT_SIEVE_SOIL" | "GT_PROCTOR";
type InputRow = { first: string; second: string };
const STORAGE_PREFIX = "snolab_laboratory_sessions_v1";
const copy = (language: Props["language"], ar: string, fr: string, en: string) => language === "ar" ? ar : language === "fr" ? fr : en;
const blankRows = (count: number): InputRow[] => Array.from({ length: count }, () => ({ first: "", second: "" }));
const isDiagnosticTestId = (value: string): value is DiagnosticTestId => value === "GT_SIEVE_SOIL" || value === "GT_PROCTOR";
const toFiniteNumber = (value: string, label: string, optional = false): number | undefined => {
  if (optional && !value.trim()) return undefined;
  if (!value.trim()) throw new Error(`${label}: ${copy("ar", "الحقل مطلوب", "Champ requis", "Field is required")}`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label}: ${copy("ar", "أدخل رقمًا محدودًا صالحًا", "Saisissez un nombre fini", "Enter a finite number")}`);
  return parsed;
};
const displayNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(4)).toString() : String(value ?? "—");

export const GeotechnicalTestWorkspace: React.FC<Props> = ({ language, projectId, projectName, projectSessions, onSessionsChange, initialTestId, onClose }) => {
  const storageKey = `${STORAGE_PREFIX}:${projectId || "global"}`;
  const [localSessions, setLocalSessions] = useState<LaboratorySession[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem(storageKey) || "[]") as LaboratorySession[]; } catch { return []; }
  });
  const sessions = projectSessions ?? localSessions;
  const [testId, setTestId] = useState<DiagnosticTestId>(isDiagnosticTestId(initialTestId || "") ? initialTestId as DiagnosticTestId : "GT_SIEVE_SOIL");
  const [requestNumber, setRequestNumber] = useState("");
  const [sampleNumber, setSampleNumber] = useState("");
  const [sampleCode, setSampleCode] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [operator, setOperator] = useState("");
  const [totalMass, setTotalMass] = useState("");
  const [washLoss, setWashLoss] = useState("");
  const [sieveRows, setSieveRows] = useState<InputRow[]>(blankRows(3));
  const [moldVolume, setMoldVolume] = useState("");
  const [proctorPoints, setProctorPoints] = useState<InputRow[]>(blankRows(3));
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<LaboratoryTestRun<Record<string, unknown>> | null>(null);

  useEffect(() => {
    if (isDiagnosticTestId(initialTestId || "")) setTestId(initialTestId as DiagnosticTestId);
  }, [initialTestId]);

  const definition = getGeotechnicalTestDefinition(testId);
  const geotechnicalSessions = useMemo(() => sessions.filter(session => inferLaboratorySessionDomain(session) === "geotechnical"), [sessions]);
  const latestSavedRun = geotechnicalSessions.flatMap(session => session.tests.map(test => test.domainRun)).find((run): run is LaboratoryTestRun<Record<string, unknown>> => Boolean(run)) || null;
  const visibleRun = lastRun || latestSavedRun;
  const visibleRunTestId: DiagnosticTestId = visibleRun?.testDefinitionId === "GT_PROCTOR" ? "GT_PROCTOR" : "GT_SIEVE_SOIL";

  const persistSession = (session: LaboratorySession) => {
    const next = [session, ...sessions.filter(existing => existing.id !== session.id)];
    setLocalSessions(next);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* the active app state remains available */ }
    onSessionsChange?.(next);
  };

  const runTest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (running || !definition) return;
    setError("");
    setLastRun(null);
    setRunning(true);
    try {
      const metadata = [requestNumber.trim(), sampleNumber.trim(), sampleCode.trim(), materialId.trim(), materialName.trim(), operator.trim()];
      if (metadata.some(value => !value)) throw new Error(copy(language, "أكمل رقم الطلب والعينة ورمزها وهوية المادة واسمها واسم المشغل.", "Renseignez la demande, l'échantillon, la matière et l'opérateur.", "Enter the request, sample, material identity/name, and operator."));
      if (sessions.some(session => session.requestNumber === requestNumber.trim())) throw new Error(copy(language, "رقم الطلب مستخدم بالفعل في جلسة محفوظة.", "Cette référence existe déjà.", "This request number already exists in a saved session."));

      let rawData: Record<string, unknown>;
      if (testId === "GT_SIEVE_SOIL") {
        const totalSampleMassG = toFiniteNumber(totalMass, "totalSampleMassG") as number;
        const washLossMassG = toFiniteNumber(washLoss, "washLossMassG", true);
        const rows = sieveRows.map((row, index) => ({
          sieveMm: toFiniteNumber(row.first, `rows.${index}.sieveMm`) as number,
          retainedMassG: toFiniteNumber(row.second, `rows.${index}.retainedMassG`) as number
        }));
        rawData = { totalSampleMassG, rows, ...(washLossMassG === undefined ? {} : { washLossMassG }) };
      } else {
        const moldVolumeCm3 = toFiniteNumber(moldVolume, "moldVolumeCm3") as number;
        const points = proctorPoints.map((point, index) => ({
          waterContentPercent: toFiniteNumber(point.first, `points.${index}.waterContentPercent`) as number,
          wetSampleMassG: toFiniteNumber(point.second, `points.${index}.wetSampleMassG`) as number
        }));
        rawData = { moldVolumeCm3, points };
      }

      let session = createLaboratorySession({ domainId: "geotechnical", requestNumber: requestNumber.trim(), projectId, projectName, reason: "Diagnostic geotechnical test run; not an official acceptance decision." });
      session = addSessionSample(session, {
        domainId: "geotechnical",
        sampleNumber: sampleNumber.trim(),
        sampleCode: sampleCode.trim(),
        materialId: materialId.trim(),
        materialName: materialName.trim(),
        materialCategory: "soil"
      }, operator.trim());
      session = addSessionTest(session, {
        domainId: "geotechnical",
        testType: definition.id,
        testTitleAr: definition.names.ar,
        testTitleFr: definition.names.fr,
        testTitleEn: definition.names.en,
        standard: `${definition.standard?.code || "Method not configured"} · ${definition.standard?.status || "Draft"}`,
        materialId: materialId.trim(),
        sampleId: session.samples[0].id,
        operator: operator.trim(),
        status: "DRAFT",
        requiredReplicates: 1,
        notes: "Diagnostic-only execution; no acceptance profile was applied."
      }, operator.trim());
      const testItem = session.tests[0];
      session = addTestReplicate(session, testItem.id, { sampleId: testItem.sampleId, status: "IN_PROGRESS", rawInputs: rawData }, operator.trim());
      const replicate = session.tests[0].replicates[0];
      const runId = `GT-RUN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const run = executeGeotechnicalLaboratoryTest(testId, {
        runId,
        projectId,
        materialId: materialId.trim(),
        sampleId: testItem.sampleId,
        operator: operator.trim(),
        rawData,
        official: false
      });
      session = recordGeotechnicalTestRun(session, testItem.id, replicate.id, run, operator.trim());
      persistSession(session);
      setLastRun(run);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy(language, "تعذر تنفيذ الاختبار.", "Échec de l'essai.", "Test execution failed."));
    } finally {
      setRunning(false);
    }
  };

  const updateRow = (kind: "sieve" | "proctor", index: number, field: "first" | "second", value: string) => {
    const setter = kind === "sieve" ? setSieveRows : setProctorPoints;
    setter(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };
  const appendRow = (kind: "sieve" | "proctor") => {
    const setter = kind === "sieve" ? setSieveRows : setProctorPoints;
    setter(previous => [...previous, { first: "", second: "" }]);
  };
  const removeRow = (kind: "sieve" | "proctor", index: number) => {
    const setter = kind === "sieve" ? setSieveRows : setProctorPoints;
    setter(previous => previous.length > (kind === "sieve" ? 2 : 3) ? previous.filter((_, rowIndex) => rowIndex !== index) : previous);
  };

  return <section data-testid="geotechnical-test-workspace" className="rounded-3xl border border-violet-200 bg-white p-4 shadow-sm dark:border-violet-900/60 dark:bg-slate-950" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-violet-100 pb-4 dark:border-violet-900/50">
      <div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200"><Beaker className="h-5 w-5" /></span><div><h2 className="text-base font-black">{copy(language, "تشغيل جيوتقني تشخيصي", "Exécution géotechnique diagnostique", "Geotechnical diagnostic run")}</h2><p className="mt-1 text-[11px] leading-5 text-slate-500">{copy(language, "يُحفظ أثر الحساب والمدخلات والتفاصيل في جلسة جيوتقنية. لا يصدر قبولًا أو تصنيفًا للتربة.", "La trace, les entrées et les détails sont conservés dans une session géotechnique. Aucun verdict d'acceptation ou classement du sol.", "Inputs, calculation trace, and full details are saved to a geotechnical session. No acceptance verdict or soil classification is issued.")}</p></div></div>
      <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800"><ShieldAlert className="h-3.5 w-3.5" />{copy(language, "تشخيصي فقط · Draft", "Diagnostic · Draft", "Diagnostic only · Draft")}</span>{onClose && <button type="button" aria-label={copy(language, "إغلاق", "Fermer", "Close")} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>}</div>
    </div>

    <form onSubmit={runTest} className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-[10px] font-black text-slate-500">{copy(language, "الاختبار", "Essai", "Test")}<select value={testId} onChange={event => setTestId(event.target.value as DiagnosticTestId)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"><option value="GT_SIEVE_SOIL">GT_SIEVE_SOIL · {copy(language, "تحليل منخلي للتربة", "Tamisage des sols", "Soil sieve analysis")}</option><option value="GT_PROCTOR">GT_PROCTOR · {copy(language, "بروكتور", "Proctor", "Proctor compaction")}</option></select></label>
        <TextField label={copy(language, "رقم الطلب", "Référence de demande", "Request number")} value={requestNumber} setValue={setRequestNumber} placeholder="GT-2026-001" />
        <TextField label={copy(language, "المشغل", "Opérateur", "Operator")} value={operator} setValue={setOperator} />
        <TextField label={copy(language, "معرف المادة/التربة", "ID matériau/sol", "Material/soil ID")} value={materialId} setValue={setMaterialId} />
        <TextField label={copy(language, "اسم المادة/التربة", "Nom matériau/sol", "Material/soil name")} value={materialName} setValue={setMaterialName} />
        <TextField label={copy(language, "رقم العينة", "N° échantillon", "Sample number")} value={sampleNumber} setValue={setSampleNumber} />
        <TextField label={copy(language, "رمز العينة", "Code échantillon", "Sample code")} value={sampleCode} setValue={setSampleCode} />
      </div>

      {testId === "GT_SIEVE_SOIL" ? <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
        <h3 className="text-xs font-black">{copy(language, "بيانات التحليل المنخلي", "Données granulométriques", "Soil sieve inputs")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><TextField type="number" label={copy(language, "كتلة العينة الكلية (g)", "Masse totale (g)", "Total sample mass (g)")} value={totalMass} setValue={setTotalMass} min="0" step="any" /><TextField type="number" label={copy(language, "فاقد الغسل (g) — اختياري", "Perte au lavage (g) — optionnel", "Wash loss (g) — optional")} value={washLoss} setValue={setWashLoss} min="0" step="any" /></div>
        <div className="mt-3 space-y-2">{sieveRows.map((row, index) => <div key={`sieve-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2"><TextField type="number" label={`${copy(language, "فتحة المنخل (mm)", "Ouverture (mm)", "Sieve aperture (mm)")} #${index + 1}`} value={row.first} setValue={value => updateRow("sieve", index, "first", value)} min="0" step="any" /><TextField type="number" label={`${copy(language, "الكتلة المحتجزة (g)", "Masse retenue (g)", "Retained mass (g)")} #${index + 1}`} value={row.second} setValue={value => updateRow("sieve", index, "second", value)} min="0" step="any" /><button type="button" onClick={() => removeRow("sieve", index)} aria-label={copy(language, "حذف الصف", "Supprimer la ligne", "Remove row")} className="mt-5 rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-rose-600 dark:border-slate-700"><Trash2 className="h-4 w-4" /></button></div>)}</div>
        <button type="button" onClick={() => appendRow("sieve")} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-2 text-[10px] font-black text-violet-700 dark:border-violet-900 dark:text-violet-200"><Plus className="h-3.5 w-3.5" />{copy(language, "إضافة منخل", "Ajouter un tamis", "Add sieve row")}</button>
      </div> : <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
        <h3 className="text-xs font-black">{copy(language, "نقاط الرطوبة والكثافة المقاسة", "Points humidité-densité mesurés", "Measured moisture-density points")}</h3>
        <TextField type="number" label={copy(language, "حجم القالب (cm³)", "Volume du moule (cm³)", "Mold volume (cm³)")} value={moldVolume} setValue={setMoldVolume} min="0" step="any" />
        <div className="mt-3 space-y-2">{proctorPoints.map((point, index) => <div key={`point-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2"><TextField type="number" label={`${copy(language, "محتوى الماء (%)", "Teneur en eau (%)", "Water content (%)")} #${index + 1}`} value={point.first} setValue={value => updateRow("proctor", index, "first", value)} min="0" step="any" /><TextField type="number" label={`${copy(language, "كتلة العينة الرطبة (g)", "Masse humide (g)", "Wet sample mass (g)")} #${index + 1}`} value={point.second} setValue={value => updateRow("proctor", index, "second", value)} min="0" step="any" /><button type="button" onClick={() => removeRow("proctor", index)} aria-label={copy(language, "حذف الصف", "Supprimer la ligne", "Remove row")} className="mt-5 rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-rose-600 dark:border-slate-700"><Trash2 className="h-4 w-4" /></button></div>)}</div>
        <button type="button" onClick={() => appendRow("proctor")} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-2 text-[10px] font-black text-violet-700 dark:border-violet-900 dark:text-violet-200"><Plus className="h-3.5 w-3.5" />{copy(language, "إضافة نقطة قياس", "Ajouter un point", "Add measurement point")}</button>
        <p className="mt-3 text-[10px] leading-5 text-amber-700 dark:text-amber-300">{copy(language, "تُعرض أعلى كثافة جافة مقاسة فقط؛ لا يُستوفى منحنى ولا يُفترض بروكتور قياسي أو معدل.", "Seul le maximum sec mesuré est rapporté; aucune interpolation ni méthode standard/modifiée n'est supposée.", "Only the highest measured dry density is reported; no curve fitting or standard/modified method is inferred.")}</p>
      </div>}

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] leading-5 text-slate-500">{copy(language, "المعيار المسجل مسودة. لن تُزامن نتيجة إلى خصائص المادة ولن تُصدر PASS/FAIL للقبول.", "La méthode est en brouillon. Aucun résultat ne sera synchronisé aux propriétés et aucun verdict d'acceptation ne sera émis.", "The method is draft. No material properties will be synced and no acceptance PASS/FAIL will be issued.")}</p><button type="submit" disabled={running} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{running ? copy(language, "جارٍ التشغيل...", "Exécution...", "Running...") : copy(language, "تشغيل وحفظ تشخيصي", "Exécuter et enregistrer", "Run and save diagnostic")}</button></div>
    </form>

    {visibleRun && <RunResult run={visibleRun} testId={visibleRunTestId} language={language} />}
    {geotechnicalSessions.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800"><h3 className="text-xs font-black">{copy(language, "تشغيلات محفوظة في جلسات هذا المشروع", "Exécutions enregistrées dans le projet", "Saved project runs")}</h3><div className="mt-2 flex flex-wrap gap-2">{geotechnicalSessions.slice(0, 6).map(session => <button key={session.id} type="button" onClick={() => setLastRun(session.tests.find(test => test.domainRun)?.domainRun || null)} className="rounded-lg bg-slate-100 px-2 py-1 text-start font-mono text-[10px] text-slate-600 hover:bg-violet-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-violet-950/50">{session.requestNumber} · {session.tests[0]?.testType} · {session.tests[0]?.status || session.status}</button>)}</div></div>}
  </section>;
};

const RunResult = ({ run, testId, language }: { run: LaboratoryTestRun<Record<string, unknown>>; testId: DiagnosticTestId; language: Props["language"] }) => {
  const sieve = testId === "GT_SIEVE_SOIL" ? run.calculationDetails as SoilSieveResult | undefined : undefined;
  const proctor = testId === "GT_PROCTOR" ? run.calculationDetails as ProctorResult | undefined : undefined;
  return <div data-testid="geotechnical-run-result" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-black">{copy(language, "نتيجة التشغيل التشخيصي", "Résultat diagnostique", "Diagnostic run result")}</h3><p className="mt-1 font-mono text-[10px] text-slate-500">{run.id} · {run.testDefinitionId} · {run.standard?.code} · {run.standard?.status}</p></div><span className="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black text-amber-900">{run.status} · {run.verificationStatus || "NEEDS_REVIEW"}</span></div>
    <p className="mt-2 text-[11px] font-bold text-amber-900 dark:text-amber-200">{copy(language, "نتيجة حسابية للمراجعة فقط؛ ليست حكم مطابقة أو اعتمادًا رسميًا.", "Calcul indicatif uniquement; ce n'est pas un verdict de conformité ou une approbation officielle.", "Calculation for review only; not a conformity verdict or official approval.")}</p>
    {run.validation.issues.length > 0 && <ul className="mt-2 list-disc space-y-1 ps-5 text-[10px] text-slate-600 dark:text-slate-300">{run.validation.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.code}: {issue.message}</li>)}</ul>}
    {sieve && <><div className="mt-3 flex flex-wrap gap-3 text-[11px]"><span>{copy(language, "فاقد ميزان الكتلة", "Écart de bilan", "Mass-balance error")}: <strong>{displayNumber(sieve.massBalanceErrorG)} g</strong></span>{sieve.finesPercent !== undefined && <span>{copy(language, "المار من 0.063 mm", "Passant à 0,063 mm", "Passing at 0.063 mm")}: <strong>{displayNumber(sieve.finesPercent)}%</strong></span>}</div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[540px] border-collapse text-[10px]"><thead><tr className="bg-violet-100 text-start dark:bg-violet-900/50">{[copy(language, "المنخل (mm)", "Tamis (mm)", "Sieve (mm)"), copy(language, "المحتجز (g)", "Retenu (g)", "Retained (g)"), copy(language, "% المحتجز", "% retenu", "% retained"), copy(language, "% المحتجز التراكمي", "% cumulé", "% cumulative retained"), copy(language, "% المار", "% passant", "% passing")].map(item => <th key={item} className="p-2 text-start">{item}</th>)}</tr></thead><tbody>{sieve.rows.map((row, index) => <tr key={`${row.sieveMm}-${index}`} className="border-b border-violet-100 dark:border-violet-900/40"><td className="p-2">{displayNumber(row.sieveMm)}</td><td className="p-2">{displayNumber(row.retainedMassG)}</td><td className="p-2">{displayNumber(row.percentRetained)}</td><td className="p-2">{displayNumber(row.cumulativePercentRetained)}</td><td className="p-2">{displayNumber(row.percentPassing)}</td></tr>)}</tbody></table></div></>}
    {proctor && <><div className="mt-3 rounded-xl bg-white/70 p-3 text-[11px] dark:bg-slate-900/50"><strong>{copy(language, "أعلى كثافة جافة مقاسة", "Densité sèche mesurée maximale", "Highest measured dry density")}: {displayNumber(proctor.maximumDryDensityGPerCm3)} g/cm³</strong><span className="ms-3">{copy(language, "محتوى الماء عند هذه النقطة", "Teneur en eau à ce point", "Water content at this measured point")}: {displayNumber(proctor.optimumMoisturePercent)}%</span></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] border-collapse text-[10px]"><thead><tr className="bg-violet-100 text-start dark:bg-violet-900/50">{[copy(language, "محتوى الماء (%)", "Teneur en eau (%)", "Water content (%)"), copy(language, "الكتلة الرطبة (g)", "Masse humide (g)", "Wet mass (g)"), copy(language, "الكثافة الجافة (g/cm³)", "Densité sèche (g/cm³)", "Dry density (g/cm³)")].map(item => <th key={item} className="p-2 text-start">{item}</th>)}</tr></thead><tbody>{proctor.points.map((point, index) => <tr key={`${point.waterContentPercent}-${index}`} className="border-b border-violet-100 dark:border-violet-900/40"><td className="p-2">{displayNumber(point.waterContentPercent)}</td><td className="p-2">{displayNumber(point.wetSampleMassG)}</td><td className="p-2">{displayNumber(point.dryDensityGPerCm3)}</td></tr>)}</tbody></table></div></>}
    <details className="mt-3 rounded-xl border border-amber-200 bg-white/70 p-3 text-[10px] dark:border-amber-900/50 dark:bg-slate-900/50"><summary className="cursor-pointer font-black">{copy(language, "أثر الحساب والتحقق", "Trace de calcul et vérification", "Calculation trace and verification")}</summary><ol className="mt-2 space-y-2">{run.calculationTrace.map(step => <li key={`${run.id}-${step.stepNumber}`}><strong>{step.label}</strong><div className="font-mono text-slate-600 dark:text-slate-300">{step.formula} · {step.substitution} = {displayNumber(step.result)} {step.unit}</div></li>)}</ol></details>
  </div>;
};

const TextField = ({ label, value, setValue, placeholder, type = "text", min, step }: { label: string; value: string; setValue: (value: string) => void; placeholder?: string; type?: "text" | "number"; min?: string; step?: string }) => <label className="block text-[10px] font-black text-slate-500"><span>{label}</span><input type={type} min={min} step={step} value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900" /></label>;
