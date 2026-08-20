'use client';

import { useMemo, useState } from 'react';
import {
  PickupWithAssignee,
  Profile,
  PickupStatus,
  STATUS_LABEL,
  getPickupStatus,
} from '@/types/pickup';
import PickupCard from './PickupCard';
import PickupFormModal from './PickupFormModal';

const COLUMN_ORDER: PickupStatus[] = ['active', 'upcoming', 'picked_up', 'expired'];

export default function Board({
  initialPickups,
  profiles,
}: {
  initialPickups: PickupWithAssignee[];
  profiles: Profile[];
}) {
  const [pickups, setPickups] = useState(initialPickups);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PickupWithAssignee | null>(null);

  const grouped = useMemo(() => {
    const map: Record<PickupStatus, PickupWithAssignee[]> = {
      active: [],
      upcoming: [],
      picked_up: [],
      expired: [],
    };
    for (const p of pickups) {
      map[getPickupStatus(p)].push(p);
    }
    return map;
  }, [pickups]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: PickupWithAssignee) {
    setEditing(p);
    setModalOpen(true);
  }

  async function handleSubmit(values: {
    player_name: string;
    casino: string;
    amount: string;
    date_start: string;
    date_end: string;
    assigned_to: string;
    notes: string;
  }) {
    const payload = {
      player_name: values.player_name,
      casino: values.casino,
      amount: Number(values.amount),
      date_start: values.date_start,
      date_end: values.date_end,
      assigned_to: values.assigned_to || null,
      notes: values.notes || null,
    };

    if (editing) {
      const res = await fetch(`/api/pickups/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { pickup } = await res.json();
      setPickups((prev) => prev.map((p) => (p.id === pickup.id ? pickup : p)));
    } else {
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { pickup } = await res.json();
      setPickups((prev) => [...prev, pickup]);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    await fetch(`/api/pickups/${editing.id}`, { method: 'DELETE' });
    setPickups((prev) => prev.filter((p) => p.id !== editing.id));
    setModalOpen(false);
  }

  async function togglePickedUp(p: PickupWithAssignee) {
    const picked_up_at = p.picked_up_at ? null : new Date().toISOString();
    const res = await fetch(`/api/pickups/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picked_up_at }),
    });
    const { pickup } = await res.json();
    setPickups((prev) => prev.map((x) => (x.id === pickup.id ? pickup : x)));
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full flex-1">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Pickups</h1>
        <button
          onClick={openNew}
          className="rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-display font-medium tracking-wide px-4 py-2 text-sm hover:bg-[var(--brass-400)] transition-colors"
        >
          + New pickup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {COLUMN_ORDER.map((status) => (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-sm uppercase tracking-wide text-[var(--ticket-cream)]/80">
                {STATUS_LABEL[status]}
              </h2>
              <span className="text-xs text-[var(--ticket-cream)]/40 font-mono">
                {grouped[status].length}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {grouped[status].length === 0 && (
                <p className="text-xs text-[var(--ticket-cream)]/40 italic">Nothing here.</p>
              )}
              {grouped[status].map((p) => (
                <PickupCard
                  key={p.id}
                  pickup={p}
                  onEdit={() => openEdit(p)}
                  onTogglePickedUp={() => togglePickedUp(p)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <PickupFormModal
        key={modalOpen ? editing?.id ?? 'new' : 'closed'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
        profiles={profiles}
        editing={editing}
      />
    </div>
  );
}
