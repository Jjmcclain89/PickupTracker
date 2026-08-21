'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { parseDateOnly } from '@/lib/formatDateRange';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() =>
    startOfMonth(startDate ? parseDateOnly(startDate) : new Date())
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const start = startDate ? parseDateOnly(startDate) : null;
  const confirmedEnd = endDate ? parseDateOnly(endDate) : null;
  const previewEnd = confirmedEnd ?? (start && hoverDate && hoverDate > start ? hoverDate : null);

  const gridStart = startOfWeek(startOfMonth(monthCursor));
  const gridEnd = endOfWeek(endOfMonth(monthCursor));
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  function handleDayClick(day: Date) {
    if (!start || confirmedEnd) {
      onChange(toISODate(day), '');
      return;
    }
    if (day < start) {
      onChange(toISODate(day), '');
      return;
    }
    onChange(toISODate(start), toISODate(day));
    setOpen(false);
  }

  const label = !start
    ? 'Select dates'
    : !confirmedEnd
      ? `${format(start, 'MMM d, yyyy')} – Select end date`
      : isSameDay(start, confirmedEnd)
        ? format(start, 'MMM d, yyyy')
        : `${format(start, 'MMM d')} – ${format(confirmedEnd, 'MMM d, yyyy')}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-[var(--ink-soft)]/30 bg-white/60 px-3 py-2 text-left text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brass-500)]"
      >
        {label}
      </button>

      {open && (
        <div className="relative mt-2 rounded-md border border-[var(--ink-soft)]/20 bg-white/80 p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMonthCursor((m) => subMonths(m, 1))}
              className="rounded px-2 py-1 text-sm text-[var(--ink-soft)] hover:bg-black/5 transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="text-sm font-display font-semibold">{format(monthCursor, 'MMMM yyyy')}</p>
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, 1))}
              className="rounded px-2 py-1 text-sm text-[var(--ink-soft)] hover:bg-black/5 transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]/60 mb-1">
            {WEEKDAY_LABELS.map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const isStart = start && isSameDay(day, start);
              const isEnd = previewEnd && isSameDay(day, previewEnd);
              const inRange = start && previewEnd && day > start && day < previewEnd;
              const isConfirmed = !!confirmedEnd;
              const isEndpoint = isStart || isEnd;

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`relative h-8 text-xs font-mono transition-colors ${
                    isSameMonth(day, monthCursor) ? '' : 'opacity-30'
                  }`}
                >
                  {(inRange || isEndpoint) && (
                    <span
                      className={`absolute inset-y-0.5 ${isStart ? 'left-1/2' : 'left-0'} ${
                        isEnd ? 'right-1/2' : 'right-0'
                      } ${isConfirmed ? 'bg-[var(--brass-500)]/25' : 'bg-[var(--brass-500)]/10'} ${
                        isStart && isEnd ? 'hidden' : ''
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      isEndpoint
                        ? 'bg-[var(--brass-500)] text-[var(--ink)] font-semibold'
                        : isToday(day)
                          ? 'ring-1 ring-[var(--brass-500)] text-[var(--ink)]'
                          : 'text-[var(--ink)]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--ink-soft)]/15">
            <button
              type="button"
              onClick={() => onChange('', '')}
              className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
            >
              Clear dates
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
