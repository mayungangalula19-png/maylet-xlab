import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AdminButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  to?: string;
  children: ReactNode;
}

const variantClass: Record<AdminButtonVariant, string> = {
  primary: 'admin-btn admin-btn--primary',
  secondary: 'admin-btn admin-btn--secondary',
  danger: 'admin-btn admin-btn--danger',
  ghost: 'admin-btn admin-btn--ghost',
};

export function AdminButton({
  variant = 'secondary',
  to,
  children,
  className = '',
  ...rest
}: AdminButtonProps) {
  const cls = `${variantClass[variant]} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
