/** Empty-state labels for production dashboard — no invented values */
export const EMPTY = {
  NOT_AVAILABLE: 'Not Available Yet',
  NO_DATA: 'No Data Yet',
  COMPLETE_SETUP: 'Complete Setup',
  ACTION_REQUIRED: 'Action Required',
} as const;

export function formatCount(value: number, emptyLabel = EMPTY.NO_DATA): string {
  return value > 0 ? String(value) : emptyLabel;
}

export function hasData(value: number): boolean {
  return value > 0;
}
