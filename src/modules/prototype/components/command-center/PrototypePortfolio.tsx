import type { FilterState, PortfolioItem, PortfolioViewMode } from '../../types/commandCenter.types';
import { FILTER_PRESETS, INNOVATION_STAGES } from '../../types/commandCenter.types';
import { PortfolioCard } from './PortfolioCard';
import { PrototypeEmptyState } from '../PrototypeEmptyState';

interface Props {
  items: PortfolioItem[];
  filter: FilterState;
  viewMode: PortfolioViewMode;
  industries: string[];
  categories: string[];
  projectId?: string;
  researchId?: string;
  onFilterChange: (patch: Partial<FilterState>) => void;
  onPreset: (id: string) => void;
  onViewMode: (mode: PortfolioViewMode) => void;
  onArchive?: (id: string) => void;
}

const VIEW_MODES: PortfolioViewMode[] = ['grid', 'list', 'table', 'kanban', 'timeline'];

export function PrototypePortfolio({
  items,
  filter,
  viewMode,
  industries,
  categories,
  projectId,
  researchId,
  onFilterChange,
  onPreset,
  onViewMode,
  onArchive,
}: Props) {
  return (
    <section className="proto-cc-portfolio" aria-label="Prototype portfolio">
      <header className="proto-cc-section-head">
        <div>
          <h2>Prototype portfolio</h2>
          <p>{items.length} prototype{items.length === 1 ? '' : 's'} in view</p>
        </div>
        <div className="proto-cc-view-toggle">
          {VIEW_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={viewMode === m ? 'proto-cc-view-toggle__btn--active' : ''}
              onClick={() => onViewMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      <div className="proto-cc-filters">
        <input
          placeholder="Search portfolio…"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        <select value={filter.stage} onChange={(e) => onFilterChange({ stage: e.target.value })}>
          <option value="all">All stages</option>
          {INNOVATION_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={filter.industry} onChange={(e) => onFilterChange({ industry: e.target.value })}>
          <option value="all">All industries</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select value={filter.category} onChange={(e) => onFilterChange({ category: e.target.value })}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filter.validationStatus}
          onChange={(e) => onFilterChange({ validationStatus: e.target.value })}
        >
          <option value="all">Validation: all</option>
          <option value="validated">Validated</option>
          <option value="at-risk">At risk</option>
        </select>
        <select value={filter.fundingStatus} onChange={(e) => onFilterChange({ fundingStatus: e.target.value })}>
          <option value="all">Funding: all</option>
          <option value="ready">Funding ready</option>
        </select>
      </div>

      <div className="proto-cc-presets">
        {FILTER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={filter.preset === p.id ? 'proto-cc-presets__btn--active' : ''}
            onClick={() => onPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <PrototypeEmptyState projectId={projectId} researchId={researchId} />
      ) : viewMode === 'grid' ? (
        <div className="proto-cc-grid">
          {items.map((item) => (
            <PortfolioCard key={item.prototype.id} item={item} onArchive={onArchive} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <ul className="proto-cc-list">
          {items.map((item) => (
            <li key={item.prototype.id}>
              <PortfolioCard item={item} onArchive={onArchive} />
            </li>
          ))}
        </ul>
      ) : viewMode === 'table' ? (
        <table className="proto-cc-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stage</th>
              <th>Category</th>
              <th>Completion</th>
              <th>Validation</th>
              <th>Funding</th>
              <th>Readiness</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.prototype.id}>
                <td>
                  <a href={`/prototypes/${item.prototype.id}/workspace`}>{item.prototype.name}</a>
                </td>
                <td>{item.stage}</td>
                <td>{item.meta.category}</td>
                <td>{item.completion}%</td>
                <td>{item.validationScore}</td>
                <td>{item.fundingScore}</td>
                <td>{item.readinessIndex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : viewMode === 'kanban' ? (
        <div className="proto-cc-kanban">
          {INNOVATION_STAGES.map((stage) => (
            <div key={stage.id} className="proto-cc-kanban__col">
              <h3>
                {stage.label}{' '}
                <span>{items.filter((i) => i.stage === stage.id).length}</span>
              </h3>
              {items
                .filter((i) => i.stage === stage.id)
                .map((item) => (
                  <PortfolioCard key={item.prototype.id} item={item} onArchive={onArchive} />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <ol className="proto-cc-timeline">
          {[...items]
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
            .map((item) => (
              <li key={item.prototype.id}>
                <time>{new Date(item.lastActivity).toLocaleDateString()}</time>
                <PortfolioCard item={item} onArchive={onArchive} />
              </li>
            ))}
        </ol>
      )}
    </section>
  );
}
