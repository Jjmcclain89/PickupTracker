'use client';

import { useEffect, useRef, useState } from 'react';

type Option = { value: string; label: string };

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }

  const buttonLabel =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} (${selected.length})`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-[var(--ticket-cream)]/20 bg-[var(--felt-900)] text-[var(--ticket-cream)] px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[var(--brass-500)] hover:bg-white/5 transition-colors"
      >
        {buttonLabel}
        <span className="text-[var(--ticket-cream)]/40 text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 min-w-[11rem] max-h-56 overflow-y-auto rounded-md border border-[var(--ticket-cream)]/20 bg-[var(--felt-900)] py-1 shadow-lg">
          {options.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-[var(--ticket-cream)]/40 italic">No options</p>
          )}
          {options.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--ticket-cream)] hover:bg-white/10 cursor-pointer"
            >
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--ticket-cream)]/50 hover:text-[var(--ticket-cream)] border-t border-[var(--ticket-cream)]/10 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
