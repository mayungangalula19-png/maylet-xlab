import { type FormEvent, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNewsletter } from '../hooks/useNewsletter';
import type { NewsletterComponentProps } from '../types/newsletter.types';
import './newsletter.css';

const ENTERPRISE_VALUE_PROPS = [
  { icon: '📊', title: 'Pipeline intelligence', desc: 'Validation, funding, and commercialization signals weekly.' },
  { icon: '🔐', title: 'Vault-ready onboarding', desc: 'Confidential IP workflows and partner document exchange.' },
  { icon: '🤖', title: 'MAYA enterprise prompts', desc: 'Executive AI briefings tied to your innovation OS.' },
] as const;

const ENTERPRISE_PERKS = [
  'Tagged newsletter_lead + enterprise_users in CRM',
  'Welcome automation sequence triggered on signup',
  'UTM, referrer, and org metadata captured',
  'Rate-limited API with honeypot bot protection',
  'Ready for Resend, SendGrid, or Mailchimp sync',
] as const;

const ENTERPRISE_ROLES = [
  'Enterprise Admin',
  'Director',
  'Innovation Manager',
  'Research Lead',
  'Engineer',
  'Investor / Partner',
] as const;

const ENTERPRISE_BRIEFINGS = [
  { title: 'Validation gate playbook for health-tech', date: 'Jun 12, 2025' },
  { title: 'Funding Hub: grant vs angel decision tree', date: 'Jun 5, 2025' },
  { title: 'MAYA prompts for portfolio reviews', date: 'May 29, 2025' },
] as const;

function EnterprisePipeline() {
  return (
    <div className="mxl-nl__pipeline" aria-label="Data flow">
      <span>Email</span>
      <span aria-hidden="true">→</span>
      <span>Validate</span>
      <span aria-hidden="true">→</span>
      <span>API</span>
      <span aria-hidden="true">→</span>
      <span>CRM</span>
      <span aria-hidden="true">→</span>
      <span>Automation</span>
    </div>
  );
}

export function Newsletter({
  source: sourceProp,
  variant = 'default',
  title: titleProp,
  subtitle: subtitleProp,
  compact = false,
  className = '',
  onSuccess,
  showDashboardCta = true,
  showFeaturesCta = true,
  dashboardRoute,
  featuresRoute,
  dashboardLabel,
  featuresLabel,
}: NewsletterComponentProps) {
  const isEnterprise = variant === 'enterprise';
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Innovation Manager');

  const source = sourceProp ?? (isEnterprise ? 'enterprise' : 'landing_page');
  const title =
    titleProp ??
    (isEnterprise ? 'Enterprise innovation briefing' : 'Innovation insights for serious builders');
  const subtitle =
    subtitleProp ??
    (isEnterprise
      ? 'Executive pipeline intelligence, validation playbooks, funding signals, and MAYA prompts for innovation leaders.'
      : 'Weekly Maylet X Lab updates on research, validation, funding, and product releases. Unsubscribe anytime.');

  const resolvedDashboardRoute = dashboardRoute ?? (isEnterprise ? '/enterprise' : '/dashboard');
  const resolvedFeaturesRoute = featuresRoute ?? (isEnterprise ? '/enterprise/vault' : '/features');
  const resolvedDashboardLabel = dashboardLabel ?? (isEnterprise ? 'Command Center' : 'Go to Dashboard');
  const resolvedFeaturesLabel = featuresLabel ?? (isEnterprise ? 'Enterprise Vault' : 'Explore Features');

  const metadataExtras = useCallback(
    () => ({
      organization: organization.trim() || undefined,
      role: role || undefined,
      tags: ['newsletter_lead', 'enterprise_users'] as string[],
      segment: 'enterprise_users',
    }),
    [organization, role]
  );

  const {
    email,
    setEmail,
    honeypot,
    setHoneypot,
    fieldError,
    globalError,
    loading,
    success,
    inputId,
    errorId,
    successId,
    submit,
    retry,
  } = useNewsletter({
    source,
    onSuccess,
    metadataExtras: isEnterprise ? metadataExtras : undefined,
  });

  const orgId = `${inputId}-org`;
  const roleId = `${inputId}-role`;

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await submit();
    },
    [submit]
  );

  const rootClass = useMemo(
    () =>
      [
        'mxl-nl',
        isEnterprise ? 'mxl-nl--enterprise' : '',
        compact ? 'mxl-nl--compact' : '',
        success ? 'mxl-nl--success' : '',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className, compact, isEnterprise, success]
  );

  const duplicateMessage = isEnterprise
    ? 'We already have your email — watch your inbox for the next enterprise briefing.'
    : 'We already have your email — watch your inbox for the next issue.';

  const successMessage = isEnterprise
    ? 'Your organization is on the enterprise innovation briefing list. Check your inbox for onboarding and vault setup tips.'
    : 'Thanks for joining. Check your inbox for a welcome note and your first insights.';

  const submitLabel = isEnterprise ? 'Join enterprise briefing' : 'Join Newsletter';

  if (success) {
    return (
      <div className={`mxl-nl-shell${isEnterprise ? ' mxl-nl-shell--enterprise' : ''}`}>
        <section className={rootClass} aria-live="polite" aria-labelledby={successId}>
          <div className="mxl-nl__icon mxl-nl__icon--success" aria-hidden="true">
            ✓
          </div>
          <h2 id={successId} className="mxl-nl__title">
            {success.duplicate ? "You're already on the list" : "You're subscribed!"}
          </h2>
          <p className="mxl-nl__subtitle">{success.duplicate ? duplicateMessage : success.message || successMessage}</p>
          <div className="mxl-nl__actions">
            {showDashboardCta && (
              <Link to={resolvedDashboardRoute} className="mxl-nl__btn mxl-nl__btn--primary">
                {resolvedDashboardLabel}
              </Link>
            )}
            {showFeaturesCta && (
              <Link to={resolvedFeaturesRoute} className="mxl-nl__btn mxl-nl__btn--ghost">
                {resolvedFeaturesLabel}
              </Link>
            )}
            {isEnterprise && (
              <Link to="/ai-assistant" className="mxl-nl__btn mxl-nl__btn--ghost">
                Open MAYA AI
              </Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (isEnterprise && !compact) {
    return (
      <div className={`mxl-nl-shell mxl-nl-shell--enterprise ${className}`.trim()}>
        <div className="mxl-nl-enterprise-grid">
          <div className="mxl-nl-enterprise-aside">
            <header className="mxl-nl__header">
              <span className="mxl-nl__badge mxl-nl__badge--enterprise">Maylet X Lab · Enterprise</span>
              <h2 className="mxl-nl__title">{title}</h2>
              <p className="mxl-nl__subtitle">{subtitle}</p>
            </header>

            <div className="mxl-nl__value-grid">
              {ENTERPRISE_VALUE_PROPS.map((item) => (
                <article key={item.title} className="mxl-nl__value-card">
                  <span className="mxl-nl__value-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </article>
              ))}
            </div>

            <EnterprisePipeline />

            <ul className="mxl-nl__perks mxl-nl__perks--enterprise" aria-label="Enterprise newsletter benefits">
              {ENTERPRISE_PERKS.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>

            <section className="mxl-nl__briefings" aria-labelledby={`${inputId}-briefings`}>
              <h3 id={`${inputId}-briefings`}>Recent enterprise briefings</h3>
              <ul>
                {ENTERPRISE_BRIEFINGS.map((b) => (
                  <li key={b.title}>
                    <span>{b.title}</span>
                    <time>{b.date}</time>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className={rootClass} aria-labelledby={`${inputId}-heading`}>
            <h2 id={`${inputId}-heading`} className="mxl-nl__form-title">
              Subscribe your organization
            </h2>
            <p className="mxl-nl__form-lead">Secure acquisition · CRM-ready · automation trigger on success</p>

            {globalError && (
              <div id={errorId} role="alert" className="mxl-nl__alert">
                <span>{globalError}</span>
                <button type="button" className="mxl-nl__retry" onClick={() => void retry()}>
                  Retry
                </button>
              </div>
            )}

            <form className="mxl-nl__form" onSubmit={handleSubmit} noValidate>
              <label htmlFor={orgId} className="mxl-nl__label">
                Organization name
              </label>
              <input
                id={orgId}
                name="organization"
                type="text"
                autoComplete="organization"
                placeholder="Acme Innovation Labs"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={loading}
                className="mxl-nl__input"
              />

              <label htmlFor={roleId} className="mxl-nl__label">
                Your role
              </label>
              <select
                id={roleId}
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="mxl-nl__input mxl-nl__select"
              >
                {ENTERPRISE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <label htmlFor={inputId} className="mxl-nl__label">
                Work email
              </label>
              <div className="mxl-nl__row">
                <input
                  id={inputId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  enterKeyHint="send"
                  placeholder="innovation@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={fieldError ? `${inputId}-field-error` : undefined}
                  className={`mxl-nl__input${fieldError ? ' mxl-nl__input--error' : ''}`}
                />
                <button
                  type="submit"
                  className="mxl-nl__btn mxl-nl__btn--primary mxl-nl__btn--enterprise mxl-nl__submit"
                  disabled={loading || !email.trim()}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className="mxl-nl__spinner" aria-hidden="true" />
                      <span>Subscribing…</span>
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>

              {fieldError && (
                <p id={`${inputId}-field-error`} role="alert" className="mxl-nl__error">
                  {fieldError}
                </p>
              )}

              <div className="mxl-nl__honeypot" aria-hidden="true">
                <label htmlFor={`${inputId}-company`}>Company website</label>
                <input
                  id={`${inputId}-company`}
                  name="company_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
            </form>

            <div className="mxl-nl__trust" aria-label="Security">
              <span>🔒 Honeypot + rate limit</span>
              <span>✓ GDPR-ready consent</span>
              <span>⚡ API timeout handling</span>
            </div>

            <p className="mxl-nl__legal">
              By subscribing you agree to receive enterprise pipeline updates from Maylet X Lab.{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={`mxl-nl-shell${isEnterprise ? ' mxl-nl-shell--enterprise' : ''}`}>
      <section className={rootClass} aria-labelledby={`${inputId}-heading`}>
        <header className="mxl-nl__header">
          <span className="mxl-nl__badge">{isEnterprise ? 'Enterprise briefing' : 'Maylet X Lab Newsletter'}</span>
          <h2 id={`${inputId}-heading`} className="mxl-nl__title">
            {title}
          </h2>
          {!compact && <p className="mxl-nl__subtitle">{subtitle}</p>}
        </header>

        {globalError && (
          <div id={errorId} role="alert" className="mxl-nl__alert">
            <span>{globalError}</span>
            <button type="button" className="mxl-nl__retry" onClick={() => void retry()}>
              Retry
            </button>
          </div>
        )}

        <form className="mxl-nl__form" onSubmit={handleSubmit} noValidate>
          <label htmlFor={inputId} className="mxl-nl__label">
            {isEnterprise ? 'Work email (organization)' : 'Email address'}
          </label>

          <div className="mxl-nl__row">
            <input
              id={inputId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="send"
              placeholder={isEnterprise ? 'innovation@yourcompany.com' : 'you@company.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `${inputId}-field-error` : undefined}
              className={`mxl-nl__input${fieldError ? ' mxl-nl__input--error' : ''}`}
            />

            <button
              type="submit"
              className="mxl-nl__btn mxl-nl__btn--primary mxl-nl__submit"
              disabled={loading || !email.trim()}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="mxl-nl__spinner" aria-hidden="true" />
                  <span>Subscribing…</span>
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>

          {fieldError && (
            <p id={`${inputId}-field-error`} role="alert" className="mxl-nl__error">
              {fieldError}
            </p>
          )}

          <div className="mxl-nl__honeypot" aria-hidden="true">
            <label htmlFor={`${inputId}-company`}>Company website</label>
            <input
              id={`${inputId}-company`}
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
        </form>

        <p className="mxl-nl__legal">
          By subscribing you agree to receive {isEnterprise ? 'enterprise product and pipeline' : 'product'}{' '}
          updates from Maylet X Lab. Read our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      {isEnterprise && compact && (
        <ul className="mxl-nl__perks" aria-label="Newsletter benefits">
          {ENTERPRISE_PERKS.slice(0, 3).map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Newsletter;
