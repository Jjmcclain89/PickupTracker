'use client';

import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { Casino, Profile } from '@/types/pickup';
import { parseDateOnly } from '@/lib/formatDateRange';
import CasinoSelect, { CasinoSelectValue, isCasinoFilled } from './CasinoSelect';

type DayName = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const DAY_OPTIONS: { value: DayName; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

const DAY_INDEX: Record<DayName, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

type DayRange = { begin: DayName; end: DayName };

export type BulkPickupPayload = {
  player_name: string;
  casino_id: string;
  amount: number;
  date_start: string;
  date_end: string;
  assigned_to: string | null;
  notes: string | null;
};

export default function BulkImportModal({
  open,
  onClose,
  onSubmit,
  profiles,
  casinos,
  resolveCasinoId,
  onSwitchToSingle,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (pickups: BulkPickupPayload[]) => Promise<void>;
  profiles: Profile[];
  casinos: Casino[];
  resolveCasinoId: (casino: CasinoSelectValue) => Promise<string>;
  onSwitchToSingle?: () => void;
}) {
  const [playerName, setPlayerName] = useState('');
  const [casino, setCasino] = useState<CasinoSelectValue>({ mode: 'existing', casino_id: '' });
  const [amount, setAmount] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [dayRanges, setDayRanges] = useState<DayRange[]>([{ begin: 'mon', end: 'thu' }]);
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [numWeeks, setNumWeeks] = useState('4');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const weeksInt = Number(numWeeks);
  const baseMonday = startDate ? startOfWeek(parseDateOnly(startDate), { weekStartsOn: 1 }) : null;

  const preview = useMemo(() => {
    if (!baseMonday || !weeksInt || weeksInt < 1) return [];
    const rows: { start: Date; end: Date }[] = [];
    for (let w = 0; w < weeksInt; w++) {
      const weekMonday = addDays(baseMonday, w * 7);
      for (const range of dayRanges) {
        const beginIdx = DAY_INDEX[range.begin];
        let endIdx = DAY_INDEX[range.end];
        if (endIdx < beginIdx) endIdx += 7;
        rows.push({ start: addDays(weekMonday, beginIdx), end: addDays(weekMonday, endIdx) });
      }
    }
    return rows;
  }, [baseMonday, weeksInt, dayRanges]);

  if (!open) return null;

  function updateDayRange(index: number, field: 'begin' | 'end', value: DayName) {
    setDayRanges((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addDayRange() {
    setDayRanges((prev) => [...prev, { begin: 'mon', end: 'thu' }]);
  }

  function removeDayRange(index: number) {
    setDayRanges((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!playerName || !isCasinoFilled(casino) || !amount) {
      setError('Fill in whose pickup, casino, and amount.');
      return;
    }
    if (!baseMonday) {
      setError('Pick a start date.');
      return;
    }
    if (!weeksInt || weeksInt < 1) {
      setError('Number of weeks must be at least 1.');
      return;
    }
    if (preview.length === 0) {
      setError('Nothing to create with these settings.');
      return;
    }

    setSaving(true);
    try {
      const casino_id = await resolveCasinoId(casino);
      const payloads: BulkPickupPayload[] = preview.map(({ start, end }) => ({
        player_name: playerName,
        casino_id,
        amount: Number(amount),
        date_start: format(start, 'yyyy-MM-dd'),
        date_end: format(end, 'yyyy-MM-dd'),
        assigned_to: assignedTo || null,
        notes: notes || null,
      }));
      await onSubmit(payloads);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong creating those. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="ticket lift-in w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-b-none sm:rounded-b-[10px]">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Add multiple pickups</h2>
            {onSwitchToSingle && (
              <button
                type="button"
                onClick={onSwitchToSingle}
                className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors mt-0.5"
              >
                Add a single pickup instead
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-soft)] text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3">
          <p className="text-xs text-[var(--ink-soft)] -mt-1">
            Creates one pickup per day range, per week, for a recurring weekly schedule.
          </p>

          <Field label="Whose pickup">
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Josh"
              className={inputClass}
            />
          </Field>

          <Field label="Casino">
            <CasinoSelect casinos={casinos} value={casino} onChange={setCasino} className={inputClass} />
          </Field>

          <div className="flex gap-3">
            <Field label="Amount (each)" className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                className={inputClass}
              />
            </Field>
            <Field label="Assigned to" className="flex-1">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
              Weekly day ranges
            </label>
            <div className="flex flex-col gap-2">
              {dayRanges.map((range, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={range.begin}
                    onChange={(e) => updateDayRange(i, 'begin', e.target.value as DayName)}
                    className={inputClass}
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[var(--ink-soft)] text-sm shrink-0">to</span>
                  <select
                    value={range.end}
                    onChange={(e) => updateDayRange(i, 'end', e.target.value as DayName)}
                    className={inputClass}
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  {dayRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDayRange(i)}
                      className="shrink-0 text-[var(--ink-soft)] hover:text-red-700 px-1 text-lg leading-none transition-colors"
                      aria-label="Remove day range"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDayRange}
                className="self-start text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
              >
                + Add day range
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Field label="Start week" className="flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
              {baseMonday && (
                <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                  Week of {format(baseMonday, 'MMM d')} – {format(addDays(baseMonday, 6), 'MMM d, yyyy')}
                </p>
              )}
            </Field>
            <Field label="# Weeks" className="w-28">
              <input
                type="number"
                min="1"
                max="52"
                value={numWeeks}
                onChange={(e) => setNumWeeks(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>

          {preview.length > 0 && (
            <div className="rounded-md border border-[var(--ink-soft)]/15 bg-black/[0.03] px-3 py-2 max-h-36 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] font-semibold mb-1">
                Will create {preview.length} pickup{preview.length === 1 ? '' : 's'}
              </p>
              <ul className="text-xs font-mono text-[var(--ink-soft)] flex flex-col gap-0.5">
                {preview.map((row, i) => (
                  <li key={i}>
                    {format(row.start, 'MMM d')} – {format(row.end, 'MMM d, yyyy')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-700 bg-red-100 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-md bg-[var(--felt-900)] text-[var(--ticket-cream)] font-display font-medium tracking-wide py-2.5 hover:bg-[var(--felt-800)] transition-colors disabled:opacity-60"
          >
            {saving
              ? 'Creating…'
              : `Create ${preview.length || ''} pickup${preview.length === 1 ? '' : 's'}`}
          </button>
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
