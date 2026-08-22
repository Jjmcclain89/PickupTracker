'use client';

import { useMemo } from 'react';
import { PickupWithAssignee, getPickupStatus } from '@/types/pickup';
import { formatDateRange } from '@/lib/formatDateRange';
import StatusBadge from './StatusBadge';

export default function TableView({
  pickups,
  onEdit,
  onTogglePickedUp,
}: {
  pickups: PickupWithAssignee[];
  onEdit: (pickup: PickupWithAssignee) => void;
  onTogglePickedUp: (pickup: PickupWithAssignee) => void;
}) {
  const sorted = useMemo(
    () => [...pickups].sort((a, b) => a.date_start.localeCompare(b.date_start)),
    [pickups]
  );

  if (sorted.length === 0) {
    return <p className="text-xs text-[var(--ticket-cream)]/40 italic">No pickups yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--ticket-cream)]/10">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--ticket-cream)]/50 border-b border-[var(--ticket-cream)]/10">
            <th className="px-3 py-2 font-semibold">Player</th>
            <th className="px-3 py-2 font-semibold">Casino</th>
            <th className="px-3 py-2 font-semibold">Dates</th>
            <th className="px-3 py-2 font-semibold text-right">Amount</th>
            <th className="px-3 py-2 font-semibold">Assigned to</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const status = getPickupStatus(p);
            return (
              <tr
                key={p.id}
                className="border-b border-[var(--ticket-cream)]/5 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <td className="px-3 py-2 font-medium">{p.player_name}</td>
                <td className="px-3 py-2 text-[var(--ticket-cream)]/70">{p.casino}</td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--ticket-cream)]/70 whitespace-nowrap">
                  {formatDateRange(p.date_start, p.date_end)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-2">{p.assignee?.display_name ?? 'Unassigned'}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={status} />
                  {status === 'picked_up' && p.picked_up_by_profile && (
                    <p className="text-[10px] text-[var(--ticket-cream)]/50 mt-0.5">
                      by {p.picked_up_by_profile.display_name}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-xs font-semibold uppercase tracking-wide text-[var(--ticket-cream)]/60 hover:text-[var(--ticket-cream)] px-2 py-1 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onTogglePickedUp(p)}
                    className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 transition-colors ${
                      status === 'picked_up'
                        ? 'text-[var(--ticket-cream)]/60 hover:text-[var(--ticket-cream)]'
                        : ''
                    }`}
                    style={status === 'picked_up' ? undefined : { color: 'var(--status-picked)' }}
                  >
                    {status === 'picked_up' ? 'Undo' : 'Mark picked up'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
