'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isToday,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { PickupWithAssignee, PickupStatus, Profile, getPickupStatus } from '@/types/pickup';
import { parseDateOnly } from '@/lib/formatDateRange';
import MultiSelectFilter from './MultiSelectFilter';

const STATUS_BAR_CLASS: Record<PickupStatus, string> = {
  active: 'bg-[var(--status-active)] text-[var(--ink)]',
  upcoming: 'bg-[var(--status-upcoming)] text-[var(--ticket-cream)]',
  expired: 'bg-[var(--status-expired)] text-[var(--ticket-cream)]',
  picked_up: 'bg-[var(--status-picked)] text-[var(--ink)]',
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LANE_HEIGHT = 30;
const DATE_ROW_HEIGHT = 34;
const CURRENT_WEEK_LANE_HEIGHT = 40;
const CURRENT_WEEK_DATE_ROW_HEIGHT = 46;

type LaneItem = {
  pickup: PickupWithAssignee;
  start: Date;
  end: Date;
  lane: number;
};

function assignLanes(items: { pickup: PickupWithAssignee; start: Date; end: Date }[]): LaneItem[] {
  const sorted = [...items].sort((a, b) => {
    const byStart = a.start.getTime() - b.start.getTime();
    if (byStart !== 0) return byStart;
    return b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime());
  });

  const laneEnds: number[] = [];
  const result: LaneItem[] = [];

  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end < item.start.getTime());
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end.getTime());
    } else {
      laneEnds[lane] = item.end.getTime();
    }
    result.push({ ...item, lane });
  }

  return result;
}

export default function CalendarView({
  pickups,
  profiles,
  onEdit,
  onTogglePickedUp,
}: {
  pickups: PickupWithAssignee[];
  profiles: Profile[];
  onEdit: (pickup: PickupWithAssignee) => void;
  onTogglePickedUp: (pickup: PickupWithAssignee) => void;
}) {
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(new Date()));
  const [filterPlayers, setFilterPlayers] = useState<string[]>([]);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string[]>([]);
  const [filterCasinos, setFilterCasinos] = useState<string[]>([]);

  const playerOptions = useMemo(
    () => Array.from(new Set(pickups.map((p) => p.player_name))).sort(),
    [pickups]
  );
  const casinoOptions = useMemo(
    () => Array.from(new Set(pickups.map((p) => p.casino))).sort(),
    [pickups]
  );
  const assigneeOptions = useMemo(
    () => [
      { value: 'unassigned', label: 'Unassigned' },
      ...profiles.map((p) => ({ value: p.id, label: p.display_name })),
    ],
    [profiles]
  );

  const filteredPickups = useMemo(() => {
    return pickups.filter((p) => {
      if (filterCasinos.length > 0 && !filterCasinos.includes(p.casino)) return false;
      if (filterPlayers.length > 0 && !filterPlayers.includes(p.player_name)) return false;
      if (filterAssignedTo.length > 0) {
        const key = p.assigned_to ?? 'unassigned';
        if (!filterAssignedTo.includes(key)) return false;
      }
      return true;
    });
  }, [pickups, filterCasinos, filterPlayers, filterAssignedTo]);

  const hasActiveFilters =
    filterPlayers.length > 0 || filterAssignedTo.length > 0 || filterCasinos.length > 0;

  const gridStart = startOfWeek(weekCursor);
  const gridEnd = addDays(gridStart, 20); // 3 weeks total
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const laneItems = useMemo(() => {
    const items = filteredPickups
      .map((p) => ({ pickup: p, start: parseDateOnly(p.date_start), end: parseDateOnly(p.date_end) }))
      .filter((item) => item.end >= gridStart && item.start <= gridEnd);
    return assignLanes(items);
  }, [filteredPickups, gridStart, gridEnd]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekCursor((w) => subWeeks(w, 1))}
            className="rounded-md px-2.5 py-1.5 text-sm hover:bg-white/10 transition-colors"
            aria-label="Previous week"
          >
            ‹
          </button>
          <h2 className="font-display text-lg font-semibold text-center whitespace-nowrap">
            {format(gridStart, 'MMM d')} – {format(gridEnd, 'MMM d, yyyy')}
          </h2>
          <button
            onClick={() => setWeekCursor((w) => addWeeks(w, 1))}
            className="rounded-md px-2.5 py-1.5 text-sm hover:bg-white/10 transition-colors"
            aria-label="Next week"
          >
            ›
          </button>
        </div>
        <button
          onClick={() => setWeekCursor(startOfWeek(new Date()))}
          className="rounded-md border border-[var(--ticket-cream)]/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-white/10 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <MultiSelectFilter
          label="Casinos"
          options={casinoOptions.map((c) => ({ value: c, label: c }))}
          selected={filterCasinos}
          onChange={setFilterCasinos}
        />
        <MultiSelectFilter
          label="Identities"
          options={playerOptions.map((name) => ({ value: name, label: name }))}
          selected={filterPlayers}
          onChange={setFilterPlayers}
        />
        <MultiSelectFilter
          label="Assignees"
          options={assigneeOptions}
          selected={filterAssignedTo}
          onChange={setFilterAssignedTo}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setFilterPlayers([]);
              setFilterAssignedTo([]);
              setFilterCasinos([]);
            }}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--ticket-cream)]/50 hover:text-[var(--ticket-cream)] transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--ticket-cream)]/50 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-px bg-[var(--ticket-cream)]/10 rounded-md overflow-hidden">
        {weeks.map((week, weekIdx) => {
          const weekStart = week[0];
          const weekEnd = week[6];

          const weekItems = laneItems
            .filter((item) => item.end >= weekStart && item.start <= weekEnd)
            .map((item) => {
              const segStart = item.start < weekStart ? weekStart : item.start;
              const segEnd = item.end > weekEnd ? weekEnd : item.end;
              const startCol = differenceInCalendarDays(segStart, weekStart);
              const endCol = differenceInCalendarDays(segEnd, weekStart);
              return {
                ...item,
                startCol,
                span: endCol - startCol + 1,
                continuesBefore: item.start < weekStart,
                continuesAfter: item.end > weekEnd,
              };
            });

          const laneRows = weekItems.reduce((max, i) => Math.max(max, i.lane + 1), 0);
          const isCurrentWeek = week.some((day) => isToday(day));
          const dateRowHeight = isCurrentWeek ? CURRENT_WEEK_DATE_ROW_HEIGHT : DATE_ROW_HEIGHT;
          const laneHeight = isCurrentWeek ? CURRENT_WEEK_LANE_HEIGHT : LANE_HEIGHT;

          return (
            <div
              key={weekIdx}
              className={`grid grid-cols-7 relative ${
                isCurrentWeek ? 'bg-[var(--felt-800)] ring-1 ring-inset ring-[var(--brass-500)]/50' : 'bg-[var(--felt-900)]'
              }`}
              style={{
                gridTemplateRows: `${dateRowHeight}px repeat(${Math.max(laneRows, 1)}, ${laneHeight}px)`,
              }}
            >
              {week.map((day, i) => (
                <div
                  key={day.toISOString()}
                  className={`border-b border-[var(--ticket-cream)]/10 px-1.5 pt-1.5 ${
                    i < 6 ? 'border-r' : ''
                  } ${isToday(day) ? 'relative z-10 ring-2 ring-inset ring-[var(--brass-500)]' : ''}`}
                  style={{ gridColumn: i + 1, gridRow: `1 / span ${Math.max(laneRows, 1) + 1}` }}
                >
                  <span
                    className={
                      isToday(day)
                        ? `inline-flex items-center justify-center rounded-full bg-[var(--brass-500)] text-[var(--ink)] font-mono font-semibold ${
                            isCurrentWeek ? 'w-7 h-7 text-sm' : 'w-5 h-5 text-xs'
                          }`
                        : `font-mono text-[var(--ticket-cream)]/60 ${isCurrentWeek ? 'text-sm' : 'text-xs'}`
                    }
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              ))}

              {weekItems.map((item) => {
                const status = getPickupStatus(item.pickup);
                const amountLabel = Number(item.pickup.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                });
                const assigneeLabel =
                  status === 'picked_up'
                    ? `Picked up by ${item.pickup.picked_up_by_profile?.display_name ?? 'someone'}`
                    : (item.pickup.assignee?.display_name ?? 'Unassigned');
                return (
                  <div
                    key={item.pickup.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onEdit(item.pickup)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEdit(item.pickup);
                      }
                    }}
                    title={`${item.pickup.player_name} — ${item.pickup.casino} — $${amountLabel} — ${assigneeLabel}`}
                    className={`relative z-10 mt-px flex items-center overflow-hidden px-1.5 cursor-pointer hover:brightness-110 transition-[filter] ${
                      isCurrentWeek ? 'text-xs py-0.5' : 'text-[11px]'
                    } ${STATUS_BAR_CLASS[status]} ${
                      item.continuesBefore ? 'rounded-l-none ml-0' : 'rounded-l-sm ml-0.5'
                    } ${item.continuesAfter ? 'rounded-r-none mr-0' : 'rounded-r-sm mr-0.5'}`}
                    style={{
                      gridColumn: `${item.startCol + 1} / span ${item.span}`,
                      gridRow: item.lane + 2,
                    }}
                  >
                    <span className="truncate min-w-0 flex-1">
                      {item.continuesBefore ? '◂ ' : ''}
                      <span className="font-semibold">{item.pickup.player_name}</span>
                      <span className="font-normal opacity-80">
                        {' '}
                        · {item.pickup.casino} · ${amountLabel} · {assigneeLabel}
                      </span>
                      {item.continuesAfter ? ' ▸' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePickedUp(item.pickup);
                      }}
                      title={status === 'picked_up' ? 'Undo pickup' : 'Mark picked up'}
                      className="ml-1 shrink-0 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none bg-black/15 hover:bg-black/25 text-current transition-colors"
                    >
                      {status === 'picked_up' ? '↺' : '✓'}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {filteredPickups.length === 0 && (
        <p className="text-xs text-[var(--ticket-cream)]/40 italic mt-4">
          {pickups.length === 0 ? 'No pickups yet.' : 'No pickups match these filters.'}
        </p>
      )}
    </div>
  );
}
