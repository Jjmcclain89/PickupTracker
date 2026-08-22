'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Profile, PickupWithAssignee, getSharedProfiles } from '@/types/pickup';
import { parseDateOnly } from '@/lib/formatDateRange';
import DateRangePicker from './DateRangePicker';

type FormState = {
  player_name: string;
  casino: string;
  amount: string;
  date_start: string;
  date_end: string;
  assigned_to: string;
  notes: string;
  shared_user_ids: string[];
};

const EMPTY: FormState = {
  player_name: '',
  casino: '',
  amount: '',
  date_start: '',
  date_end: '',
  assigned_to: '',
  notes: '',
  shared_user_ids: [],
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
    shared_user_ids: getSharedProfiles(p).map((s) => s.id),
  };
}

export default function PickupFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  onTogglePickedUp,
  profiles,
  editing,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => Promise<void>;
  onDelete?: () => Promise<void>;
  onTogglePickedUp?: () => Promise<void>;
  profiles: Profile[];
  editing: PickupWithAssignee | null;
  currentUserId: string;
}) {
  const [form, setForm] = useState<FormState>(() => (editing ? toFormState(editing) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [togglingPickedUp, setTogglingPickedUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !editing || editing.created_by === currentUserId;

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

  async function handleTogglePickedUp() {
    if (!onTogglePickedUp) return;
    setTogglingPickedUp(true);
    try {
      await onTogglePickedUp();
    } finally {
      setTogglingPickedUp(false);
    }
  }

  const dayRangeLabel =
    form.date_start && form.date_end
      ? (() => {
          const startDay = format(parseDateOnly(form.date_start), 'EEE');
          const endDay = format(parseDateOnly(form.date_end), 'EEE');
          return form.date_start === form.date_end ? startDay : `${startDay}-${endDay}`;
        })()
      : null;

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
            {dayRangeLabel && (
              <p className="text-xs text-[var(--ink-soft)] mt-1">{dayRangeLabel}</p>
            )}
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

          {isOwner ? (
            <Field label="Shared with">
              <div className="flex flex-col gap-1.5">
                {profiles
                  .filter((p) => p.id !== currentUserId && p.id !== form.assigned_to)
                  .map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                      <input
                        type="checkbox"
                        checked={form.shared_user_ids.includes(p.id)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            shared_user_ids: e.target.checked
                              ? [...f.shared_user_ids, p.id]
                              : f.shared_user_ids.filter((id) => id !== p.id),
                          }))
                        }
                      />
                      {p.display_name}
                    </label>
                  ))}
              </div>
              {form.assigned_to && (
                <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                  {profiles.find((p) => p.id === form.assigned_to)?.display_name ?? 'The assignee'}{' '}
                  also has access automatically, since they&apos;re assigned.
                </p>
              )}
            </Field>
          ) : (
            editing &&
            getSharedProfiles(editing).length > 0 && (
              <Field label="Shared with">
                <p className="text-sm text-[var(--ink)]">
                  {getSharedProfiles(editing)
                    .map((p) => p.display_name)
                    .join(', ')}
                </p>
              </Field>
            )
          )}

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

          {editing && onTogglePickedUp && (
            <div>
              <button
                type="button"
                onClick={handleTogglePickedUp}
                disabled={togglingPickedUp}
                className="w-full rounded-md border border-[var(--ink-soft)]/20 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-black/5 transition-colors disabled:opacity-60"
                style={{ color: editing.picked_up_at ? 'var(--ink-soft)' : 'var(--status-picked)' }}
              >
                {togglingPickedUp ? 'Updating…' : editing.picked_up_at ? 'Undo pickup' : 'Mark picked up'}
              </button>
              {editing.picked_up_at && editing.picked_up_by_profile && (
                <p className="text-[11px] text-[var(--ink-soft)] mt-1 text-center">
                  Picked up by {editing.picked_up_by_profile.display_name}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            {editing && onDelete && isOwner && (
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
