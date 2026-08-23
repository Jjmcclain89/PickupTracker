'use client';

import { useState } from 'react';
import { Casino } from '@/types/pickup';

type FormState = {
  name: string;
  location: string;
  player_rewards_club: string;
};

const EMPTY: FormState = { name: '', location: '', player_rewards_club: '' };

function toFormState(c: Casino): FormState {
  return {
    name: c.name,
    location: c.location ?? '',
    player_rewards_club: c.player_rewards_club ?? '',
  };
}

export default function CasinoFormModal({
  open,
  onClose,
  onSubmit,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => Promise<void>;
  editing: Casino | null;
}) {
  const [form, setForm] = useState<FormState>(() => (editing ? toFormState(editing) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setError('Something went wrong saving that. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="ticket lift-in w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-b-none sm:rounded-b-[10px]">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {editing ? 'Edit casino' : 'New casino'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--ink-soft)] text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Black Hawk"
              className={inputClass}
            />
          </Field>

          <Field label="Location (optional)">
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Black Hawk, CO"
              className={inputClass}
            />
          </Field>

          <Field label="Player rewards club (optional)">
            <input
              value={form.player_rewards_club}
              onChange={(e) => setForm((f) => ({ ...f, player_rewards_club: e.target.value }))}
              placeholder="M Life Rewards"
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="text-sm text-red-700 bg-red-100 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-md bg-[var(--felt-900)] text-[var(--ticket-cream)] font-display font-medium tracking-wide py-2.5 hover:bg-[var(--felt-800)] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add casino'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-[var(--ink-soft)]/30 bg-white/60 px-3 py-2 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brass-500)]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
