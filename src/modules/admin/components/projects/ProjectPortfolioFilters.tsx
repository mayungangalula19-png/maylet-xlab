import { ADMIN_PROJECT_SECTORS } from '../../types/projectAdmin.types';

interface ProjectPortfolioFiltersProps {
  search: string;
  statusFilter: string;
  sectorFilter: string;
  total: number;
  filteredTotal: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onClear: () => void;
}

export function ProjectPortfolioFilters({
  search,
  statusFilter,
  sectorFilter,
  total,
  filteredTotal,
  onSearchChange,
  onStatusChange,
  onSectorChange,
  onClear,
}: ProjectPortfolioFiltersProps) {
  const hasFilters = search || statusFilter !== 'all' || sectorFilter !== 'All';

  return (
    <>
      <div className="admin-projects-filters">
        <div className="admin-search admin-projects-search">
          <span className="admin-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search projects by name, description, sector…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-project-status">Status</label>
          <select
            id="admin-project-status"
            className="admin-projects-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="Idea">Idea</option>
            <option value="Experiment">Experiment</option>
            <option value="Prototype">Prototype</option>
            <option value="Launched">Launched</option>
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-project-sector">Sector</label>
          <select
            id="admin-project-sector"
            className="admin-projects-select"
            value={sectorFilter}
            onChange={(e) => onSectorChange(e.target.value)}
          >
            {ADMIN_PROJECT_SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-projects-results">
        <span>
          Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()} projects
        </span>
        {hasFilters ? (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClear}>
            Clear filters
          </button>
        ) : null}
      </div>
    </>
  );
}
