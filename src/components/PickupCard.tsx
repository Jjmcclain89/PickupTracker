'use client';

import { format } from 'date-fns';
import { PickupWithAssignee, getPickupStatus } from '@/types/pickup';
import StatusBadge from './StatusBadge';

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (start === end) return format(s, 'MMM d, yyyy');
  return sameMonth
    ? `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`
    : `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}

export default function PickupCard({
  pickup,
  onEdit,
  onTogglePickedUp,
}: {
  pickup: PickupWithAssignee;
  onEdit: () => void;
  onTogglePickedUp: () => void;
}) {
  const status = getPickupStatus(pickup);

  return (
    <div className="ticket lift-in overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-semibold leading-tight">{pickup.player_name}</p>
          <p className="text-sm text-[var(--ink-soft)]">{pickup.casino}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="ticket-stub mx-4" />

      <div className="px-4 py-3 flex items-end justify-between gap-2">
        <div>
          <p className="font-mono text-2xl font-semibold tracking-tight">
            ${Number(pickup.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            {formatDateRange(pickup.date_start, pickup.date_end)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">Assigned to</p>
          <p className="text-sm font-medium">
            {pickup.assignee?.display_name ?? 'Unassigned'}
          </p>
        </div>
      </div>

      {pickup.notes && (
        <p className="px-4 pb-3 text-xs text-[var(--ink-soft)] italic">{pickup.notes}</p>
      )}

      <div className="flex border-t border-[var(--ink-soft)]/15">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] hover:bg-black/5 transition-colors"
        >
          Edit
        </button>
        <div className="w-px bg-[var(--ink-soft)]/15" />
        <button
          onClick={onTogglePickedUp}
          className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-black/5 transition-colors"
          style={{ color: status === 'picked_up' ? 'var(--ink-soft)' : 'var(--status-picked)' }}
        >
          {status === 'picked_up' ? 'Undo pickup' : 'Mark picked up'}
        </button>
      </div>
    </div>
  );
}
