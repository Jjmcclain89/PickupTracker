'use client';

import { useState } from 'react';
import { Profile, PickupWithAssignee } from '@/types/pickup';

export default function MarkPickedUpModal({
  open,
  pickup,
  profiles,
  currentUserId,
  onConfirm,
  onClose,
}: {
  open: boolean;
  pickup: PickupWithAssignee | null;
  profiles: Profile[];
  currentUserId: string;
  onConfirm: (userId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [pickedUpBy, setPickedUpBy] = useState(currentUserId);
  const [saving, setSaving] = useState(false);

  if (!open || !pickup) return null;

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(pickedUpBy);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="ticket lift-in w-full sm:max-w-sm rounded-b-none sm:rounded-b-[10px] p-5 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">Mark picked up</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          {pickup.player_name} — {pickup.casino.name}
        </p>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
            Who picked it up?
          </label>
          <select
            value={pickedUpBy}
            onChange={(e) => setPickedUpBy(e.target.value)}
            className="w-full rounded-md border border-[var(--ink-soft)]/30 bg-white/60 px-3 py-2 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brass-500)]"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === currentUserId ? `${p.display_name} (you)` : p.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--ink-soft)]/20 px-4 py-2.5 text-sm font-semibold hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 rounded-md bg-[var(--felt-900)] text-[var(--ticket-cream)] font-display font-medium tracking-wide py-2.5 hover:bg-[var(--felt-800)] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
