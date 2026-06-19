import { BrandLogo } from '../../../modules/shared/components/common/BrandLogo';

const VerifyEmail = () => {
  return (
    <div
      className="verify-email-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '1rem',
      }}
    >
      <div
        className="verify-email-container"
        style={{
          maxWidth: 520,
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 32,
          padding: '2.5rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        <div className="logo-section" style={{ marginBottom: '1.25rem' }}>
          <div className="logo-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <BrandLogo to="/" size="lg" />
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', margin: '0.75rem 0 0.25rem' }}>
            Verify your email
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
            Check your email for verification link
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

