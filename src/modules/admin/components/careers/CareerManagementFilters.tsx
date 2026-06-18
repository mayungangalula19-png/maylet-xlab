import { memo } from 'react';
import {
  CAREER_DEPARTMENTS,
  CAREER_STATUS_OPTIONS,
  CAREER_TYPE_OPTIONS,
  type AdminCareerFilters,
} from '../../types/careersAdmin.types';

interface CareerManagementFiltersProps {
  search: string;
  statusFilter: AdminCareerFilters['status'];
  typeFilter: AdminCareerFilters['type'];
  departmentFilter: string;
  locationFilter: string;
  remoteFilter: AdminCareerFilters['remote'];
  dateFrom: string;
  dateTo: string;
  total: number;
  filteredTotal: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: AdminCareerFilters['status']) => void;
  onTypeChange: (value: AdminCareerFilters['type']) => void;
  onDepartmentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onRemoteChange: (value: AdminCareerFilters['remote']) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

export const CareerManagementFilters = memo(function CareerManagementFilters({
  search,
  statusFilter,
  typeFilter,
  departmentFilter,
  locationFilter,
  remoteFilter,
  dateFrom,
  dateTo,
  total,
  filteredTotal,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onDepartmentChange,
  onLocationChange,
  onRemoteChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: CareerManagementFiltersProps) {
  const hasFilters =
    search ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    departmentFilter !== 'All' ||
    locationFilter ||
    remoteFilter !== 'all' ||
    dateFrom ||
    dateTo;

  return (
    <>
      <div className="admin-projects-filters admin-careers-filters">
        <div className="admin-search admin-projects-search">
          <span className="admin-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search careers by title, department, location…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search careers"
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-status">Status</label>
          <select
            id="admin-career-status"
            className="admin-projects-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as AdminCareerFilters['status'])}
          >
            {CAREER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-type">Type</label>
          <select
            id="admin-career-type"
            className="admin-projects-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value as AdminCareerFilters['type'])}
          >
            <option value="all">All types</option>
            {CAREER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-department">Department</label>
          <select
            id="admin-career-department"
            className="admin-projects-select"
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            {CAREER_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All departments' : dept}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-location">Location</label>
          <input
            id="admin-career-location"
            type="text"
            className="admin-projects-select admin-careers-text-input"
            placeholder="City or region"
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-remote">Remote</label>
          <select
            id="admin-career-remote"
            className="admin-projects-select"
            value={remoteFilter}
            onChange={(e) => onRemoteChange(e.target.value as AdminCareerFilters['remote'])}
          >
            <option value="all">All</option>
            <option value="remote">Remote only</option>
            <option value="onsite">On-site only</option>
          </select>
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-from">From</label>
          <input
            id="admin-career-from"
            type="date"
            className="admin-projects-select admin-careers-date-input"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        <div className="admin-projects-filter-group">
          <label htmlFor="admin-career-to">To</label>
          <input
            id="admin-career-to"
            type="date"
            className="admin-projects-select admin-careers-date-input"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-projects-results">
        <span>
          Showing {filteredTotal.toLocaleString()} of {total.toLocaleString()} careers
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
