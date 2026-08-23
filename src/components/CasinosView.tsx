'use client';

import { useState } from 'react';
import { Casino } from '@/types/pickup';
import CasinoFormModal from './CasinoFormModal';

export default function CasinosView({ initialCasinos }: { initialCasinos: Casino[] }) {
  const [casinos, setCasinos] = useState(initialCasinos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Casino | null>(null);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(c: Casino) {
    setEditing(c);
    setModalOpen(true);
  }

  async function handleSubmit(values: {
    name: string;
    location: string;
    player_rewards_club: string;
  }) {
    const payload = {
      name: values.name,
      location: values.location || null,
      player_rewards_club: values.player_rewards_club || null,
    };

    if (editing) {
      const res = await fetch(`/api/casinos/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { casino } = await res.json();
      setCasinos((prev) =>
        prev.map((c) => (c.id === casino.id ? casino : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      const res = await fetch('/api/casinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { casino } = await res.json();
      setCasinos((prev) => [...prev, casino].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full flex-1">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-semibold">Casinos</h1>
        <button
          onClick={openNew}
          className="rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-display font-medium tracking-wide px-4 py-2 text-sm hover:bg-[var(--brass-400)] transition-colors"
        >
          + New casino
        </button>
      </div>

      {casinos.length === 0 ? (
        <p className="text-xs text-[var(--ticket-cream)]/40 italic">No casinos yet.</p>
      ) : (
        <div className="flex flex-col gap-px bg-[var(--ticket-cream)]/10 rounded-md overflow-hidden">
          {casinos.map((c) => (
            <button
              key={c.id}
              onClick={() => openEdit(c)}
              className="bg-[var(--felt-900)] hover:bg-[var(--felt-800)] transition-colors text-left px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-display font-semibold truncate">{c.name}</p>
                {(c.location || c.player_rewards_club) && (
                  <p className="text-xs text-[var(--ticket-cream)]/50 truncate">
                    {[c.location, c.player_rewards_club].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--ticket-cream)]/40">
                Edit
              </span>
            </button>
          ))}
        </div>
      )}

      <CasinoFormModal
        key={`casino-${modalOpen ? editing?.id ?? 'new' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editing={editing}
      />
    </div>
  );
}
