'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
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
import { PickupWithAssignee, Profile, getPickupStatus } from '@/types/pickup';
import { parseDateOnly } from '@/lib/formatDateRange';
import { formatAmount } from '@/lib/formatAmount';
import { getAssigneeColorClass } from '@/lib/assigneeColors';
import MultiSelectFilter from './MultiSelectFilter';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LANE_HEIGHT = 30;
const DATE_ROW_HEIGHT = 34;
const CURRENT_WEEK_LANE_HEIGHT = 40;
const CURRENT_WEEK_DATE_ROW_HEIGHT = 46;

function subscribeNoop() {
  return () => {};
}

// True once hydrated on the client, false during SSR and the first client
// render — lets us defer anything date-dependent to the browser's clock.
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

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
  currentUserId,
  onEdit,
  onTogglePickedUp,
}: {
  pickups: PickupWithAssignee[];
  profiles: Profile[];
  currentUserId: string;
  onEdit: (pickup: PickupWithAssignee) => void;
  onTogglePickedUp: (pickup: PickupWithAssignee) => void;
}) {
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(new Date()));
  const [filterPlayers, setFilterPlayers] = useState<string[]>([]);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string[]>([]);
  const [filterCasinos, setFilterCasinos] = useState<string[]>([]);

  // "Today" depends on the viewer's local clock/timezone. This is a client
  // component, but Next.js still server-renders its first paint — on the
  // server that's the deploy's clock (UTC on Vercel), which can land on a
  // different calendar day than the visitor's. Hold off rendering until
  // after mount so every date below is computed from the browser's clock.
  const mounted = useMounted();

  const playerOptions = useMemo(
    () => Array.from(new Set(pickups.map((p) => p.player_name))).sort(),
    [pickups]
  );
  const casinoOptions = useMemo(() => {
    const byId = new Map<string, string>();
    pickups.forEach((p) => byId.set(p.casino_id, p.casino.name));
    return Array.from(byId, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [pickups]);
  const assigneeOptions = useMemo(
    () => [
      { value: 'unassigned', label: 'Unassigned' },
      ...profiles.map((p) => ({ value: p.id, label: p.display_name })),
    ],
    [profiles]
  );

  const filteredPickups = useMemo(() => {
    return pickups.filter((p) => {
      if (filterCasinos.length > 0 && !filterCasinos.includes(p.casino_id)) return false;
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

  if (!mounted) return null;

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
        <button
          type="button"
          onClick={() =>
            setFilterAssignedTo((prev) =>
              prev.length === 1 && prev[0] === currentUserId ? [] : [currentUserId]
            )
          }
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            filterAssignedTo.length === 1 && filterAssignedTo[0] === currentUserId
              ? 'bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)]'
              : 'border-[var(--ticket-cream)]/20 text-[var(--ticket-cream)]/70 hover:bg-white/10'
          }`}
        >
          Assigned to me
        </button>
        <MultiSelectFilter
          label="Casinos"
          options={casinoOptions}
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
                isCurrentWeek ? 'bg-[var(--felt-800)]' : 'bg-[var(--felt-900)]'
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
                const isPickedUp = status === 'picked_up';
                const amount = Number(item.pickup.amount);
                const amountLabel = amount.toLocaleString(undefined, { minimumFractionDigits: 0 });
                const assigneeLabel = isPickedUp
                  ? `Picked up by ${item.pickup.picked_up_by_profile?.display_name ?? 'someone'}`
                  : (item.pickup.assignee?.display_name ?? 'Unassigned');
                const colorClass = isPickedUp
                  ? 'bg-[var(--ink-soft)]/25 text-[var(--ticket-cream)]/60'
                  : getAssigneeColorClass(profiles, item.pickup.assigned_to);
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
                    title={`${item.pickup.player_name} — ${item.pickup.casino.name} — $${amountLabel} — ${assigneeLabel}`}
                    className={`relative z-10 mt-px flex items-center overflow-hidden px-1.5 cursor-pointer hover:brightness-110 transition-[filter] ${
                      isPickedUp ? 'text-[9px] py-0 opacity-80' : isCurrentWeek ? 'text-xs py-0.5' : 'text-[11px]'
                    } ${colorClass} ${
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
                        · {item.pickup.casino.name} · {assigneeLabel}
                      </span>
                      {item.continuesAfter ? ' ▸' : ''}
                    </span>
                    <span className="shrink-0 font-semibold ml-1">${formatAmount(amount)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePickedUp(item.pickup);
                      }}
                      title={isPickedUp ? 'Undo pickup' : 'Mark picked up'}
                      className={`ml-1 shrink-0 rounded-full flex items-center justify-center leading-none border-2 border-[var(--brass-500)] bg-black/15 hover:bg-black/25 text-current transition-colors ${
                        isPickedUp ? 'w-4 h-4 text-[9px]' : 'w-6 h-6 text-sm'
                      }`}
                    >
                      {isPickedUp ? '↺' : '✓'}
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
