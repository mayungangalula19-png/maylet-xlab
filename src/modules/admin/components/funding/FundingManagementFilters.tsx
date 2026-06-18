import { memo } from 'react';
import {
  FUNDING_INDUSTRY_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  FUNDING_STATUS_OPTIONS,
  type AdminFundingFilters,
} from '../../types/fundingAdmin.types';

interface FundingManagementFiltersProps {
  search: string;
  statusFilter: AdminFundingFilters['status'];
  stageFilter: AdminFundingFilters['stage'];
  industryFilter: string;
  dateFrom: string;
  dateTo: string;
  total: number;
  filteredTotal: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: AdminFundingFilters['status']) => void;
  onStageChange: (value: AdminFundingFilters['stage']) => void;
  onIndustryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

export const FundingManagementFilters = memo(function FundingManagementFilters({
  search,
  statusFilter,
  stageFilter,
  industryFilter,
  dateFrom,
  dateTo,
  total,
  filteredTotal,
  onSearchChange,
  onStatusChange,
  onStageChange,
  onIndustryChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: FundingManagementFiltersProps) {
  const hasFilters =
    search ||
    statusFilter !== 'all' ||
    stageFilter !== 'all' ||
    industryFilter !== 'All' ||
    dateFrom ||
    dateTo;

  return (
    <>
      <div className="admin-projects-filters admin-funding-filters">
        <div className="admin-search admin-projects-search">
          <span className="admin-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search pitches by title, industry…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search funding pitches"
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-funding-status">Status</label>
          <select
            id="admin-funding-status"
            className="admin-projects-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as AdminFundingFilters['status'])}
          >
            {FUNDING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-funding-stage">Stage</label>
          <select
            id="admin-funding-stage"
            className="admin-projects-select"
            value={stageFilter}
            onChange={(e) => onStageChange(e.target.value as AdminFundingFilters['stage'])}
          >
            {FUNDING_STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-funding-industry">Industry</label>
          <select
            id="admin-funding-industry"
            className="admin-projects-select"
            value={industryFilter}
            onChange={(e) => onIndustryChange(e.target.value)}
          >
            {FUNDING_INDUSTRY_OPTIONS.map((industry) => (
              <option key={industry} value={industry}>
                {industry === 'All' ? 'All industries' : industry}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-funding-from">From</label>
          <input
            id="admin-funding-from"
            type="date"
            className="admin-projects-select admin-funding-date-input"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-funding-to">To</label>
          <input
            id="admin-funding-to"
            type="date"
            className="admin-projects-select admin-funding-date-input"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-projects-results">
        <span>
          Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()} pitches
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
