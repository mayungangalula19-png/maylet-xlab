import type {
  CollaborationScopeFilter,
  DateRangeFilter,
  PriorityFilter,
  ProjectFilters,
  ProjectViewModel,
  SortField,
  SortOrder,
  StatusFilter,
} from '../types';

function matchesDateRange(updatedAt: string, range: DateRangeFilter): boolean {
  if (range === 'all') return true;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(updatedAt).getTime() >= cutoff;
}

function matchesStatus(project: ProjectViewModel, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') {
    return project.status === 'Experiment' || project.status === 'Prototype';
  }
  if (filter === 'completed') {
    return project.status === 'Launched' || project.progress === 100;
  }
  if (filter === 'hold') return project.status === 'Idea';
  if (filter === 'archived') return project.status === 'Archived';
  return true;
}

function matchesPriority(project: ProjectViewModel, filter: PriorityFilter): boolean {
  if (filter === 'all') return true;
  return project.priority === filter;
}

function matchesCollaborationScope(
  project: ProjectViewModel,
  scope: CollaborationScopeFilter
): boolean {
  if (scope === 'all') return true;
  if (scope === 'owned') return project.is_owned;
  return !project.is_owned;
}

function matchesSearch(project: ProjectViewModel, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    project.name.toLowerCase().includes(q) ||
    project.description.toLowerCase().includes(q) ||
    project.sector.toLowerCase().includes(q)
  );
}

function compareProjects(
  a: ProjectViewModel,
  b: ProjectViewModel,
  sortBy: SortField,
  sortOrder: SortOrder
): number {
  let cmp = 0;
  switch (sortBy) {
    case 'name':
      cmp = a.name.localeCompare(b.name);
      break;
    case 'progress':
      cmp = a.progress - b.progress;
      break;
    case 'created_at':
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      break;
    case 'updated_at':
    default:
      cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      break;
  }
  return sortOrder === 'asc' ? cmp : -cmp;
}

export function filterAndSortProjects(
  projects: ProjectViewModel[],
  filters: Pick<
    ProjectFilters,
    | 'search'
    | 'statusFilter'
    | 'priorityFilter'
    | 'dateRange'
    | 'collaborationScope'
    | 'sortBy'
    | 'sortOrder'
  >
): ProjectViewModel[] {
  return [...projects]
    .filter(
      (p) =>
        matchesSearch(p, filters.search) &&
        matchesStatus(p, filters.statusFilter) &&
        matchesPriority(p, filters.priorityFilter) &&
        matchesDateRange(p.updated_at, filters.dateRange) &&
        matchesCollaborationScope(p, filters.collaborationScope)
    )
    .sort((a, b) => compareProjects(a, b, filters.sortBy, filters.sortOrder));
}

export function paginateProjects<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
  };
}

/** Map URL query ?scope= to internal CollaborationScopeFilter */
export function scopeFromQueryParam(value: string | null): CollaborationScopeFilter {
  if (value === 'owned') return 'owned';
  if (value === 'shared') return 'shared';
  return 'all';
}

/** Map URL query ?status= to internal StatusFilter */
export function statusFromQueryParam(value: string | null): StatusFilter {
  if (value === 'active') return 'active';
  if (value === 'completed') return 'completed';
  if (value === 'hold') return 'hold';
  if (value === 'archived') return 'archived';
  return 'all';
}
