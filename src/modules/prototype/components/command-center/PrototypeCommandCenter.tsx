import { ActivityFeed, CollaborationHub } from './ActivityFeed';
import { AIInnovationInsights } from './AIInnovationInsights';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CommercializationCenter } from './CommercializationCenter';
import { ExecutiveHeader } from './ExecutiveHeader';
import { ExperimentOperationsCenter } from './ExperimentOperationsCenter';
import { FundingReadinessCenter } from './FundingReadinessCenter';
import { GlobalKPIs } from './GlobalKPIs';
import { InnovationPipeline } from './InnovationPipeline';
import { PrototypePortfolio } from './PrototypePortfolio';
import { ResearchIntegrationPanel } from './ResearchIntegrationPanel';
import { ValidationIntelligenceCenter } from './ValidationIntelligenceCenter';
import type { usePrototypeCommandCenter } from '../../hooks/usePrototypeCommandCenter';

type CommandCenterState = ReturnType<typeof usePrototypeCommandCenter>;

interface Props extends CommandCenterState {
  newHref: string;
  projectId?: string;
  researchId?: string;
  gateBanner?: React.ReactNode;
  onExport: () => void;
  onArchive?: (id: string) => void;
}

export function PrototypeCommandCenter({
  kpis,
  pipeline,
  portfolio,
  filtered,
  filter,
  patchFilter,
  applyPreset,
  viewMode,
  setViewMode,
  live,
  setLive,
  industries,
  categories,
  activityFeed,
  experimentOps,
  validationIntel,
  fundingCenter,
  commercialCenter,
  researchLinks,
  stalled,
  highPotential,
  moveToStage,
  currentQuarter,
  newHref,
  projectId,
  researchId,
  gateBanner,
  onExport,
  onArchive,
}: Props) {
  return (
    <div className="proto-cc">
      <ExecutiveHeader
        innovationHealth={kpis.innovationHealth}
        currentQuarter={currentQuarter}
        live={live}
        onToggleLive={() => setLive((v) => !v)}
        newHref={newHref}
        projectId={projectId}
      />

      {gateBanner}

      <GlobalKPIs kpis={kpis} />

      <div className="proto-cc-layout">
        <main className="proto-cc-main">
          <InnovationPipeline pipeline={pipeline} portfolio={portfolio} onMove={moveToStage} />

          <AnalyticsDashboard kpis={kpis} pipeline={pipeline} portfolio={portfolio} onExport={onExport} />

          <div className="proto-cc-centers">
            <ValidationIntelligenceCenter
              pending={validationIntel.pending}
              failed={validationIntel.failed}
              successRate={validationIntel.successRate}
              queue={validationIntel.queue}
            />
            <ExperimentOperationsCenter
              running={experimentOps.running}
              completed={experimentOps.completed}
              failedAssumptions={experimentOps.failedAssumptions}
              total={experimentOps.total}
            />
            <FundingReadinessCenter
              ready={fundingCenter.ready}
              avgInvestor={fundingCenter.avgInvestor}
              avgMarket={fundingCenter.avgMarket}
              count={fundingCenter.count}
            />
            <CommercializationCenter
              launch={commercialCenter.launch}
              adoption={commercialCenter.adoption}
              pipeline={commercialCenter.pipeline}
            />
          </div>

          <PrototypePortfolio
            items={filtered}
            filter={filter}
            viewMode={viewMode}
            industries={industries}
            categories={categories}
            projectId={projectId}
            researchId={researchId}
            onFilterChange={patchFilter}
            onPreset={applyPreset}
            onViewMode={setViewMode}
            onArchive={onArchive}
          />

          <ResearchIntegrationPanel items={researchLinks} />
          <ActivityFeed activities={activityFeed} />
        </main>

        <aside className="proto-cc-aside">
          <AIInnovationInsights highPotential={highPotential} stalled={stalled} portfolio={portfolio} />
          <CollaborationHub activities={activityFeed} />
        </aside>
      </div>
    </div>
  );
}
