'use client';

import { useState } from 'react';
import { Profile, PickupWithAssignee } from '@/types/pickup';
import DateRangePicker from './DateRangePicker';

type FormState = {
  player_name: string;
  casino: string;
  amount: string;
  date_start: string;
  date_end: string;
  assigned_to: string;
  notes: string;
};

const EMPTY: FormState = {
  player_name: '',
  casino: '',
  amount: '',
  date_start: '',
  date_end: '',
  assigned_to: '',
  notes: '',
};

function toFormState(p: PickupWithAssignee): FormState {
  return {
    player_name: p.player_name,
    casino: p.casino,
    amount: String(p.amount),
    date_start: p.date_start,
    date_end: p.date_end,
    assigned_to: p.assigned_to ?? '',
    notes: p.notes ?? '',
  };
}

export default function PickupFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  profiles,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => Promise<void>;
  onDelete?: () => Promise<void>;
  profiles: Profile[];
  editing: PickupWithAssignee | null;
}) {
  const [form, setForm] = useState<FormState>(() => (editing ? toFormState(editing) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.player_name || !form.casino || !form.amount || !form.date_start || !form.date_end) {
      setError('Fill in every field except notes.');
      return;
    }
    if (form.date_end < form.date_start) {
      setError('End date is before the start date.');
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
            {editing ? 'Edit pickup' : 'New pickup'}
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
          <Field label="Whose pickup">
            <input
              value={form.player_name}
              onChange={(e) => setForm((f) => ({ ...f, player_name: e.target.value }))}
              placeholder="Josh"
              className={inputClass}
            />
          </Field>

          <Field label="Casino">
            <input
              value={form.casino}
              onChange={(e) => setForm((f) => ({ ...f, casino: e.target.value }))}
              placeholder="Black Hawk"
              className={inputClass}
            />
          </Field>

          <Field label="Amount">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="50"
              className={inputClass}
            />
          </Field>

          <Field label="Dates">
            <DateRangePicker
              startDate={form.date_start}
              endDate={form.date_end}
              onChange={(date_start, date_end) => setForm((f) => ({ ...f, date_start, date_end }))}
            />
          </Field>

          <Field label="Assigned to">
            <select
              value={form.assigned_to}
              onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="text-sm text-red-700 bg-red-100 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 mt-2">
            {editing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md border border-red-700/30 text-red-700 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-[var(--felt-900)] text-[var(--ticket-cream)] font-display font-medium tracking-wide py-2.5 hover:bg-[var(--felt-800)] transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-[var(--ink-soft)]/30 bg-white/60 px-3 py-2 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brass-500)]';

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
