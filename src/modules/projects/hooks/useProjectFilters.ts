import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  CollaborationScopeFilter,
  DateRangeFilter,
  PriorityFilter,
  ProjectFilters,
  SortField,
  SortOrder,
} from '../types';
import { scopeFromQueryParam, statusFromQueryParam } from '../utils/projectFilters';

const DEFAULT_PAGE_SIZE = 6;

export function useProjectFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ProjectFilters = useMemo(() => {
    const sortBy = (searchParams.get('sort') as SortField) || 'updated_at';
    const sortOrder = (searchParams.get('order') as SortOrder) || 'desc';
    const dateRange = (searchParams.get('date') as DateRangeFilter) || 'all';
    const priorityFilter = (searchParams.get('priority') as PriorityFilter) || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

    const collaborationScope = scopeFromQueryParam(searchParams.get('scope'));

    return {
      search: searchParams.get('q') ?? '',
      statusFilter: statusFromQueryParam(searchParams.get('status')),
      priorityFilter,
      dateRange,
      collaborationScope: (['all', 'owned', 'shared'] as CollaborationScopeFilter[]).includes(
        collaborationScope
      )
        ? collaborationScope
        : 'all',
      sortBy: ['updated_at', 'created_at', 'name', 'progress'].includes(sortBy)
        ? sortBy
        : 'updated_at',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }, [searchParams]);

  const setFilter = useCallback(
    (patch: Partial<ProjectFilters>, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (patch.search !== undefined) {
          if (patch.search) next.set('q', patch.search);
          else next.delete('q');
        }
        if (patch.statusFilter !== undefined) {
          if (patch.statusFilter === 'all') next.delete('status');
          else next.set('status', patch.statusFilter);
        }
        if (patch.priorityFilter !== undefined) {
          if (patch.priorityFilter === 'all') next.delete('priority');
          else next.set('priority', patch.priorityFilter);
        }
        if (patch.dateRange !== undefined) {
          if (patch.dateRange === 'all') next.delete('date');
          else next.set('date', patch.dateRange);
        }
        if (patch.collaborationScope !== undefined) {
          if (patch.collaborationScope === 'all') next.delete('scope');
          else next.set('scope', patch.collaborationScope);
        }
        if (patch.sortBy !== undefined) next.set('sort', patch.sortBy);
        if (patch.sortOrder !== undefined) next.set('order', patch.sortOrder);
        if (patch.page !== undefined) {
          if (patch.page <= 1) next.delete('page');
          else next.set('page', String(patch.page));
        }
        if (resetPage && patch.page === undefined) next.delete('page');
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  return { filters, setFilter };
}
