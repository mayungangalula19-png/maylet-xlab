import { supabase } from '../../../lib/supabase/client';

export interface AdminEntityListOptions {
  table: string;
  select?: string;
  page: number;
  pageSize: number;
  orderBy?: string;
  filters?: Record<string, string | number | boolean>;
}

export async function fetchAdminEntityPage<T extends { id: string }>({
  table,
  select = '*',
  page,
  pageSize,
  orderBy = 'created_at',
  filters,
}: AdminEntityListOptions) {
  const from = page * pageSize;
  let query = supabase.from(table).select(select, { count: 'exact' });

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }

  const { data, count, error } = await query
    .order(orderBy, { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;

  return {
    rows: (data || []) as unknown as T[],
    total: count || 0,
  };
}

export async function fetchAdminEntityById<T extends { id: string }>(
  table: string,
  id: string,
  select = '*'
) {
  const { data, error } = await supabase.from(table).select(select).eq('id', id).single();
  if (error) throw error;
  return data as unknown as T;
}
