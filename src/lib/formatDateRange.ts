import { format } from 'date-fns';

export function parseDateOnly(date: string): Date {
  return new Date(date + 'T00:00:00');
}

export function formatDateRange(start: string, end: string): string {
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (start === end) return format(s, 'MMM d, yyyy');
  return sameMonth
    ? `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`
    : `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}
