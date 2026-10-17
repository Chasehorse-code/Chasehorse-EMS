import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: { inputId: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${error ? 'field--invalid' : ''}`.trim()}>
      <label htmlFor={inputId} className="field__label">
        {label}
        {required && <span className="field__req" aria-hidden> *</span>}
      </label>
      {children({ inputId, describedBy, invalid: Boolean(error) })}
      {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
      {error && <p id={errorId} className="field__error" role="alert">{error}</p>}
    </div>
  );
}

type Shared = { label: string; hint?: string; error?: string };

export function TextField({ label, hint, error, required, ...rest }: Shared & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy, invalid }) => (
        <input id={inputId} className="input" aria-describedby={describedBy} aria-invalid={invalid || undefined} required={required} {...rest} />
      )}
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, required, children, ...rest }: Shared & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy, invalid }) => (
        <select id={inputId} className="input" aria-describedby={describedBy} aria-invalid={invalid || undefined} required={required} {...rest}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function TextAreaField({ label, hint, error, required, ...rest }: Shared & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy, invalid }) => (
        <textarea id={inputId} className="input input--area" aria-describedby={describedBy} aria-invalid={invalid || undefined} required={required} {...rest} />
      )}
    </FieldShell>
  );
}
