import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../../../lib/constants/branding';

const SIZES = { sm: 36, md: 44, lg: 56 } as const;

interface Props {
  /** Router link target — omit for image only */
  to?: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Use eager load for above-the-fold (landing header) */
  eager?: boolean;
}

/**
 * Shared brand logo — always points at public/images/logo.jpeg.
 * Use this everywhere instead of hard-coded paths or emoji placeholders.
 */
export const BrandLogo = memo(function BrandLogo({
  to,
  size = 'md',
  className = '',
  eager = false,
}: Props) {
  const px = SIZES[size];
  const img = (
    <img
      src={BRAND.logoSrc}
      alt={BRAND.logoAlt}
      width={px}
      height={px}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`brand-logo-img ${className}`.trim()}
      style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
    />
  );

  if (to) {
    return (
      <Link to={to} className="brand-logo-link" aria-label={BRAND.name}>
        {img}
      </Link>
    );
  }

  return img;
});
