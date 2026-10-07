import React, { useEffect, useRef } from "react";

export interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  unit?: React.ReactNode;
  focusOnError?: boolean;
  className?: string;
  children: React.ReactElement;
}

/**
 * Accessible form-field contract used by wizard and laboratory inputs.
 * The control remains responsible for its visual styling; Field owns the
 * label/error relationship and the common ARIA wiring.
 */
export const Field: React.FC<FieldProps> = ({
  id,
  label,
  hint,
  error,
  required = false,
  unit,
  focusOnError = false,
  className = "",
  children,
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const controlRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (focusOnError && error) {
      controlRef.current?.focus();
    }
  }, [error, focusOnError]);

  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = React.cloneElement(children, {
    id,
    ref: (node: HTMLElement | null) => {
      controlRef.current = node;
      const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") childRef.current = node;
    },
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
    "aria-required": required || undefined,
  });

  return (
    <div className={`sno-field ${className}`.trim()}>
      <label htmlFor={id} className="sno-field-label">
        {label}
        {unit && <span className="ms-1 text-[10px] font-normal text-slate-400">({unit})</span>}
      </label>
      {control}
      {hint && <span id={hintId} className="sno-field-hint">{hint}</span>}
      {error && <span id={errorId} className="sno-field-error" role="alert">{error}</span>}
    </div>
  );
};

Field.displayName = "Field";
