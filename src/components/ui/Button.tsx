import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  style?: CSSProperties;
}

export function Button({
  variant,
  tone,
  size = 'md',
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const chosenVariant = variant || tone || 'secondary';
  return (
    <button type={type} className={`btn btn--${chosenVariant} btn--${size} ${className}`.trim()} {...rest}>
      {icon && <span className="btn__icon" aria-hidden>{icon}</span>}
      {children}
    </button>
  );
}
