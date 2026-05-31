import { PageShell } from '../../../components/common/PageShell';

export default function EnterpriseVault() {
  return (
    <PageShell
      title="Enterprise Knowledge Vault"
      subtitle="Secure storage for SOPs, reports, contracts, and policies — powers Level 7 Knowledge Memory."
    >
      <p style={{ opacity: 0.8 }}>
        Upload organizational documents here. MAYA will index them for RAG (requires pgvector + Edge Function{' '}
        <code>maya-embed</code>).
      </p>
    </PageShell>
  );
}
