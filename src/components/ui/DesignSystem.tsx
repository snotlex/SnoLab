import React from "react";

export type CardTone = "default" | "muted" | "accent" | "danger";

const toneClasses: Record<CardTone, string> = {
  default: "sno-card",
  muted: "sno-card sno-card-muted",
  accent: "sno-card sno-card-accent",
  danger: "sno-card sno-card-danger",
};

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof React.JSX.IntrinsicElements;
  tone?: CardTone;
}

export const SurfaceCard = React.forwardRef<HTMLElement, SurfaceCardProps>(function SurfaceCard(
  { as: Element = "section", tone = "default", className = "", children, ...props },
  ref,
) {
  return React.createElement(
    Element,
    { ref, className: `${toneClasses[tone]} ${className}`.trim(), ...props },
    children,
  );
});

SurfaceCard.displayName = "SurfaceCard";

export const SectionHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, description, eyebrow, actions, className = "" }) => (
  <div className={`sno-section-header ${className}`.trim()}>
    <div className="min-w-0">
      {eyebrow && <div className="sno-eyebrow">{eyebrow}</div>}
      <h2 className="sno-section-title">{title}</h2>
      {description && <p className="sno-section-description">{description}</p>}
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);

export const FormField: React.FC<{
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, error, children, className = "" }) => (
  <label className={`sno-field ${className}`.trim()}>
    <span className="sno-field-label">{label}</span>
    {children}
    {hint && !error && <span className="sno-field-hint">{hint}</span>}
    {error && <span className="sno-field-error" role="alert">{error}</span>}
  </label>
);

export interface DataTableColumn<Row> {
  key: string;
  header: React.ReactNode;
  render: (row: Row) => React.ReactNode;
  className?: string;
}

export const DataTable = <Row extends { id?: string | number }>({
  columns,
  rows,
  empty,
  className = "",
}: {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  empty?: React.ReactNode;
  className?: string;
}) => (
  <div className="sno-table-wrap">
    <table className={`sno-table ${className}`.trim()}>
      <thead>
        <tr>
          {columns.map(column => <th key={column.key} className={column.className}>{column.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id ?? index}>
            {columns.map(column => <td key={column.key} className={column.className}>{column.render(row)}</td>)}
          </tr>
        ))}
        {!rows.length && empty && <tr><td colSpan={columns.length} className="sno-table-empty">{empty}</td></tr>}
      </tbody>
    </table>
  </div>
);
