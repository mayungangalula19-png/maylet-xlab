import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { getPageRange, getTotalPages } from '../utils/adminPage.utils';

export interface UseAdminListOptions<T> {
  table: string;
  select: string;
  pageSize?: number;
  orderBy?: { column: string; ascending?: boolean };
  /** Applied as .eq(key, value) */
  filters?: Record<string, string | number | boolean>;
  /** Client-side search across these fields after fetch (for simple lists) */
  searchFields?: readonly (keyof T & string)[];
  enabled?: boolean;
}

export function useAdminList<T extends { id: string }>({
  table,
  select,
  pageSize = 25,
  orderBy = { column: 'created_at', ascending: false },
  filters,
  searchFields,
  enabled = true,
}: UseAdminListOptions<T>) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = filters ? JSON.stringify(filters) : '';
  const searchFieldsKey = searchFields?.join('\0') ?? '';
  const orderByKey = `${orderBy.column}:${orderBy.ascending ?? false}`;

  const fetchPage = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select, { count: 'exact' });

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }
      }

      if (search.trim() && searchFields?.length) {
        const term = `%${search.trim()}%`;
        const orClause = searchFields.map((field) => `${field}.ilike.${term}`).join(',');
        query = query.or(orClause);
      }

      const from = page * pageSize;
      const { data, count, error: queryError } = await query
        .order(orderBy.column, { ascending: orderBy.ascending ?? false })
        .range(from, from + pageSize - 1);

      if (queryError) throw queryError;

      setRows((data as unknown as T[]) || []);
      setTotal(count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load records';
      setError(message);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [enabled, table, select, filters, filtersKey, search, searchFields, searchFieldsKey, page, pageSize, orderBy.column, orderBy.ascending, orderByKey]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = getTotalPages(total, pageSize);
  const range = getPageRange(page, pageSize, total);

  const pagination = useMemo(
    () => ({
      page,
      pageSize,
      total,
      totalPages,
      range,
      canPrev: page > 0,
      canNext: page + 1 < totalPages,
      goPrev: () => setPage((p) => Math.max(0, p - 1)),
      goNext: () => setPage((p) => (p + 1 < totalPages ? p + 1 : p)),
      reset: () => setPage(0),
    }),
    [page, pageSize, total, totalPages, range]
  );

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  return {
    rows,
    loading,
    error,
    search,
    onSearchChange,
    refresh: fetchPage,
    pagination,
  };
}
