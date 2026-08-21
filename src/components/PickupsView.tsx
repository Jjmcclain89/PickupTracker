'use client';

import { useState } from 'react';
import { PickupWithAssignee, Profile } from '@/types/pickup';
import CalendarView from './CalendarView';
import TableView from './TableView';
import PickupFormModal from './PickupFormModal';

type ViewMode = 'calendar' | 'table';

export default function PickupsView({
  initialPickups,
  profiles,
}: {
  initialPickups: PickupWithAssignee[];
  profiles: Profile[];
}) {
  const [pickups, setPickups] = useState(initialPickups);
  const [view, setView] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PickupWithAssignee | null>(null);

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
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-semibold">Pickups</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-[var(--ticket-cream)]/20 overflow-hidden text-xs font-semibold uppercase tracking-wide">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 transition-colors ${
                view === 'calendar' ? 'bg-[var(--brass-500)] text-[var(--ink)]' : 'hover:bg-white/10'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 transition-colors ${
                view === 'table' ? 'bg-[var(--brass-500)] text-[var(--ink)]' : 'hover:bg-white/10'
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={openNew}
            className="rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-display font-medium tracking-wide px-4 py-2 text-sm hover:bg-[var(--brass-400)] transition-colors"
          >
            + New pickup
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView pickups={pickups} onEdit={openEdit} />
      ) : (
        <TableView pickups={pickups} onEdit={openEdit} onTogglePickedUp={togglePickedUp} />
      )}

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
