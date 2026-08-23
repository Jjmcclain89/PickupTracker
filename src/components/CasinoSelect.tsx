'use client';

import { Casino } from '@/types/pickup';

export type CasinoSelectValue =
  | { mode: 'existing'; casino_id: string }
  | { mode: 'new'; name: string };

const NEW_OPTION = '__new__';

export function isCasinoFilled(casino: CasinoSelectValue): boolean {
  return casino.mode === 'existing' ? !!casino.casino_id : !!casino.name.trim();
}

export default function CasinoSelect({
  casinos,
  value,
  onChange,
  className,
}: {
  casinos: Casino[];
  value: CasinoSelectValue;
  onChange: (value: CasinoSelectValue) => void;
  className: string;
}) {
  if (value.mode === 'new') {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={value.name}
          onChange={(e) => onChange({ mode: 'new', name: e.target.value })}
          placeholder="New casino name"
          className={className}
        />
        <button
          type="button"
          onClick={() => onChange({ mode: 'existing', casino_id: '' })}
          className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink)] px-1 text-lg leading-none transition-colors"
          aria-label="Cancel new casino"
          title="Choose an existing casino instead"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <select
      value={value.casino_id}
      onChange={(e) => {
        if (e.target.value === NEW_OPTION) {
          onChange({ mode: 'new', name: '' });
        } else {
          onChange({ mode: 'existing', casino_id: e.target.value });
        }
      }}
      className={className}
    >
      <option value="">Select a casino…</option>
      {casinos.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
      <option value={NEW_OPTION}>+ New casino</option>
    </select>
  );
}
