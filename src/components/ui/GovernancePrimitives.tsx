import React from "react";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "border-slate-300/60 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200",
  info: "border-blue-300/60 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200",
  success: "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  warning: "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  danger: "border-rose-300/60 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
};

export function StatusBadge({
  status,
  tone = "neutral",
  className = ""
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${toneClass[tone]} ${className}`}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}

export function InlineError({
  id,
  message,
  title = "Validation error"
}: {
  id?: string;
  message: string;
  title?: string;
}) {
  return (
    <p id={id} role="alert" className={`mt-1 rounded-md border px-2.5 py-2 text-xs ${toneClass.danger}`}>
      <span className="font-semibold">{title}: </span>{message}
    </p>
  );
}

export function BlockingGate({
  title,
  reason,
  action,
  children
}: {
  title: string;
  reason: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section
      role="region"
      aria-label={title}
      className={`rounded-xl border p-4 ${toneClass.danger}`}
    >
      <div className="text-sm font-black">{title}</div>
      <p className="mt-1 text-xs leading-5">{reason}</p>
      {action ? <div className="mt-3">{action}</div> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section aria-label={title} className={`rounded-xl border p-6 text-center ${toneClass.neutral}`}>
      <h2 className="text-sm font-black">{title}</h2>
      {description ? <p className="mt-1 text-xs opacity-80">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </section>
  );
}

export function LoadingState({
  label = "Loading"
}: {
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
      <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="snolab-confirm-title"
        aria-describedby={description ? "snolab-confirm-description" : undefined}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="snolab-confirm-title" className="text-base font-black">{title}</h2>
        {description ? <p id="snolab-confirm-description" className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-sm">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function AuditPanel({
  entries
}: {
  entries: Array<{ id: string; timestamp: string; action: string; actor?: string }>;
}) {
  return (
    <section aria-label="Audit trail" className={`rounded-xl border p-4 ${toneClass.info}`}>
      <h2 className="text-sm font-black">Audit trail</h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs opacity-80">No audit events recorded.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="text-xs">
              <span className="font-semibold">{entry.action}</span>
              <span className="mx-1 opacity-70">·</span>
              <time dateTime={entry.timestamp}>{entry.timestamp}</time>
              {entry.actor ? <span className="ml-1 opacity-80">· {entry.actor}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function EvidencePanel({
  items
}: {
  items: Array<{ reference: string; type: string; description?: string }>;
}) {
  return (
    <section aria-label="Evidence" className={`rounded-xl border p-4 ${toneClass.success}`}>
      <h2 className="text-sm font-black">Evidence</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-xs opacity-80">No evidence attached.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${item.reference}-${index}`} className="text-xs">
              <span className="font-semibold">{item.type}</span>
              <span className="mx-1 opacity-70">·</span>
              <span>{item.reference}</span>
              {item.description ? <p className="mt-0.5 opacity-80">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
