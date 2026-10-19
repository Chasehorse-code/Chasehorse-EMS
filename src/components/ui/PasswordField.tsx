import { useState, useId, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { FormField } from './FormField';

export interface PasswordFieldProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  isShaking?: boolean;
  rightElement?: React.ReactNode;
  showStrengthMeter?: boolean;
  autoComplete?: 'current-password' | 'new-password';
}

function calculateStrength(pass: string): { score: number; label: string; colorClass: string } {
  if (!pass) return { score: 0, label: '', colorClass: '' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 12) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', colorClass: 'strength--weak' };
    case 2:
      return { score: 2, label: 'Fair', colorClass: 'strength--fair' };
    case 3:
      return { score: 3, label: 'Good', colorClass: 'strength--good' };
    case 4:
      return { score: 4, label: 'Strong', colorClass: 'strength--strong' };
    default:
      return { score: 0, label: 'Too short', colorClass: 'strength--weak' };
  }
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      id: customId,
      name = 'password',
      label = 'Password',
      value,
      onChange,
      onBlur,
      placeholder = '••••••••',
      required = true,
      error,
      hint,
      isShaking,
      rightElement,
      showStrengthMeter = false,
      autoComplete = 'current-password',
    },
    ref
  ) => {
    const defaultId = useId();
    const id = customId || defaultId;
    const [showPassword, setShowPassword] = useState(false);
    const strength = showStrengthMeter ? calculateStrength(value) : null;

    return (
      <FormField
        id={id}
        label={label}
        required={required}
        hint={hint}
        error={error}
        isShaking={isShaking}
        rightElement={rightElement}
        icon={<Lock size={18} />}
      >
        <div className="password-input-wrapper">
          <input
            ref={ref}
            id={id}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="input input--with-icon input--with-eye"
          />
          <button
            type="button"
            className="password-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {showStrengthMeter && value.length > 0 && (
          <div className="password-strength">
            <div className="password-strength__bars" aria-hidden="true">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`password-strength__segment ${
                    (strength?.score ?? 0) >= step ? strength?.colorClass : ''
                  }`}
                />
              ))}
            </div>
            <div className="password-strength__label">
              Strength: <span className="password-strength__val">{strength?.label}</span> (min 8 chars)
            </div>
          </div>
        )}
      </FormField>
    );
  }
);

PasswordField.displayName = 'PasswordField';
