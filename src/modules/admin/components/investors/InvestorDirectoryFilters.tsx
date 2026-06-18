import { memo } from 'react';
import {
  INVESTOR_DIRECTORY_INDUSTRY_OPTIONS,
  INVESTOR_DIRECTORY_TYPES,
  type AdminInvestorDirectoryFilters,
} from '../../types/investorsAdmin.types';

interface InvestorDirectoryFiltersProps {
  search: string;
  typeFilter: AdminInvestorDirectoryFilters['type'];
  activeFilter: AdminInvestorDirectoryFilters['active'];
  industryFilter: string;
  total: number;
  filteredTotal: number;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: AdminInvestorDirectoryFilters['type']) => void;
  onActiveChange: (value: AdminInvestorDirectoryFilters['active']) => void;
  onIndustryChange: (value: string) => void;
  onClear: () => void;
}

export const InvestorDirectoryFilters = memo(function InvestorDirectoryFilters({
  search,
  typeFilter,
  activeFilter,
  industryFilter,
  total,
  filteredTotal,
  onSearchChange,
  onTypeChange,
  onActiveChange,
  onIndustryChange,
  onClear,
}: InvestorDirectoryFiltersProps) {
  const hasFilters =
    search || typeFilter !== 'all' || activeFilter !== 'all' || industryFilter !== 'All';

  return (
    <>
      <div className="admin-projects-filters admin-investors-filters">
        <div className="admin-search admin-projects-search">
          <span className="admin-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search directory by name, email…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search investor directory"
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-directory-type">Type</label>
          <select
            id="admin-directory-type"
            className="admin-projects-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value as AdminInvestorDirectoryFilters['type'])}
          >
            <option value="all">All types</option>
            {INVESTOR_DIRECTORY_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-directory-active">Visibility</label>
          <select
            id="admin-directory-active"
            className="admin-projects-select"
            value={activeFilter}
            onChange={(e) => onActiveChange(e.target.value as AdminInvestorDirectoryFilters['active'])}
          >
            <option value="all">All</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-directory-industry">Industry focus</label>
          <select
            id="admin-directory-industry"
            className="admin-projects-select"
            value={industryFilter}
            onChange={(e) => onIndustryChange(e.target.value)}
          >
            {INVESTOR_DIRECTORY_INDUSTRY_OPTIONS.map((industry) => (
              <option key={industry} value={industry}>
                {industry === 'All' ? 'All industries' : industry}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-projects-results">
        <span>
          Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()} listings
        </span>
        {hasFilters ? (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClear}>
            Clear filters
          </button>
        ) : null}
      </div>
    </>
  );
});
