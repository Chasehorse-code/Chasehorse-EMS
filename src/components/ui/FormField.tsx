import { type ReactNode } from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  icon?: ReactNode;
  rightElement?: ReactNode;
  isShaking?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  required,
  hint,
  error,
  icon,
  rightElement,
  isShaking,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`form-field ${error ? 'form-field--invalid' : ''} ${isShaking ? 'form-field--shake' : ''} ${className}`}>
      <div className="form-field__label-row">
        <label htmlFor={id} className="form-field__label">
          {label}
          {required && <span className="form-field__req" aria-hidden="true"> *</span>}
        </label>
        {rightElement && <div className="form-field__top-right">{rightElement}</div>}
      </div>

      <div className="form-field__input-wrap">
        {icon && <span className="form-field__icon" aria-hidden="true">{icon}</span>}
        {children}
      </div>

      {hint && !error && <div className="form-field__hint">{hint}</div>}

      <div
        id={`${id}-error`}
        role="alert"
        aria-live="polite"
        className={`form-field__error-container ${error ? 'form-field__error-container--visible' : ''}`}
      >
        {error && <span className="form-field__error">{error}</span>}
      </div>
    </div>
  );
}
