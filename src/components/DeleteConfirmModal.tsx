'use client';

import { useState } from 'react';
import { PickupWithAssignee } from '@/types/pickup';

export default function DeleteConfirmModal({
  open,
  pickup,
  onConfirm,
  onClose,
}: {
  open: boolean;
  pickup: PickupWithAssignee | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  if (!open || !pickup) return null;

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="ticket lift-in w-full sm:max-w-sm rounded-b-none sm:rounded-b-[10px] p-5 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">Delete pickup?</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          {pickup.player_name} — {pickup.casino.name}. This can&apos;t be undone.
        </p>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-md border border-[var(--ink-soft)]/20 px-4 py-2.5 text-sm font-semibold hover:bg-black/5 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 rounded-md bg-red-700 text-white font-display font-medium tracking-wide py-2.5 hover:bg-red-800 transition-colors disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
