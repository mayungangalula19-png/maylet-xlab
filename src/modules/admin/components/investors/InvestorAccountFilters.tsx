import { memo } from 'react';
import { INVESTOR_ACCOUNT_STATUS_OPTIONS } from '../../types/investorsAdmin.types';
import { ADMIN_USER_PLANS } from '../../types/userAdmin.types';

interface InvestorAccountFiltersProps {
  search: string;
  statusFilter: string;
  planFilter: string;
  dateFrom: string;
  dateTo: string;
  total: number;
  filteredTotal: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPlanChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

export const InvestorAccountFilters = memo(function InvestorAccountFilters({
  search,
  statusFilter,
  planFilter,
  dateFrom,
  dateTo,
  total,
  filteredTotal,
  onSearchChange,
  onStatusChange,
  onPlanChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: InvestorAccountFiltersProps) {
  const hasFilters =
    search || statusFilter !== 'all' || planFilter !== 'all' || dateFrom || dateTo;

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
            placeholder="Search investor accounts…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search investor accounts"
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-investor-status">Status</label>
          <select
            id="admin-investor-status"
            className="admin-projects-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {INVESTOR_ACCOUNT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-investor-plan">Plan</label>
          <select
            id="admin-investor-plan"
            className="admin-projects-select"
            value={planFilter}
            onChange={(e) => onPlanChange(e.target.value)}
          >
            <option value="all">All plans</option>
            {ADMIN_USER_PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-investor-from">From</label>
          <input
            id="admin-investor-from"
            type="date"
            className="admin-projects-select admin-investors-date-input"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-investor-to">To</label>
          <input
            id="admin-investor-to"
            type="date"
            className="admin-projects-select admin-investors-date-input"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-projects-results">
        <span>
          Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()} accounts
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
