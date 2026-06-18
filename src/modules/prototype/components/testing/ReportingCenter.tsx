import {
  buildTestingReports,
  downloadReport,
  type ReadinessScores,
  type TestingKPIs,
} from '../../utils/testingCenter.utils';
import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';

interface Props {
  prototypeName: string;
  version: string | number;
  kpis: TestingKPIs;
  readiness: ReadinessScores;
  workspace: PrototypeTestingWorkspace;
  onExported?: (label: string) => void;
}

export function ReportingCenter({ prototypeName, version, kpis, readiness, workspace, onExported }: Props) {
  const reports = buildTestingReports(prototypeName, version, kpis, readiness, workspace);
  const slug = prototypeName.replace(/\s+/g, '-').toLowerCase();

  const exportPdf = (content: string, name: string) => {
    downloadReport(content, `${slug}-${name}.pdf`, 'application/pdf');
    onExported?.(name);
  };

  const exportDocx = (content: string, name: string) => {
    downloadReport(content, `${slug}-${name}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    onExported?.(name);
  };

  const cards = [
    { id: 'summary', title: 'Testing summary', body: reports.summary },
    { id: 'defects', title: 'Defect summary', body: reports.defects },
    { id: 'readiness', title: 'Readiness report', body: reports.readiness },
    { id: 'executive', title: 'Executive report', body: reports.executive },
  ];

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Reporting center</h2>
        <p>Generate and export testing documentation for stakeholders</p>
      </header>
      <div className="proto-test-reports">
        {cards.map((r) => (
          <article key={r.id} className="proto-test-report-card">
            <h3>{r.title}</h3>
            <pre>{r.body.slice(0, 280)}{r.body.length > 280 ? '…' : ''}</pre>
            <div className="proto-test-report-card__actions">
              <button type="button" className="proto-btn proto-btn--secondary" onClick={() => exportPdf(r.body, r.id)}>
                Export PDF
              </button>
              <button type="button" className="proto-btn proto-btn--ghost" onClick={() => exportDocx(r.body, r.id)}>
                Export DOCX
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
