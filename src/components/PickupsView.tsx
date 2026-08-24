'use client';

import { useState } from 'react';
import { Casino, PickupWithAssignee, Profile } from '@/types/pickup';
import CalendarView from './CalendarView';
import PickupFormModal from './PickupFormModal';
import BulkImportModal, { BulkPickupPayload } from './BulkImportModal';
import MarkPickedUpModal from './MarkPickedUpModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { CasinoSelectValue } from './CasinoSelect';

export default function PickupsView({
  initialPickups,
  profiles,
  casinos: initialCasinos,
  currentUserId,
}: {
  initialPickups: PickupWithAssignee[];
  profiles: Profile[];
  casinos: Casino[];
  currentUserId: string;
}) {
  const [pickups, setPickups] = useState(initialPickups);
  const [casinos, setCasinos] = useState(initialCasinos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PickupWithAssignee | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [pickingUpFor, setPickingUpFor] = useState<PickupWithAssignee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PickupWithAssignee | null>(null);

  // Resolves a CasinoSelect value to a casino_id, creating the casino first
  // if the user typed a new name instead of picking an existing one.
  async function resolveCasinoId(casino: CasinoSelectValue): Promise<string> {
    if (casino.mode === 'existing') return casino.casino_id;

    const res = await fetch('/api/casinos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: casino.name }),
    });
    const body = await res.json();
    if (!res.ok || !body.casino) {
      throw new Error(body.error ?? 'Could not create that casino.');
    }
    setCasinos((prev) =>
      prev.some((c) => c.id === body.casino.id)
        ? prev
        : [...prev, body.casino].sort((a, b) => a.name.localeCompare(b.name))
    );
    return body.casino.id as string;
  }

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
    casino: CasinoSelectValue;
    amount: string;
    date_start: string;
    date_end: string;
    assigned_to: string;
    notes: string;
    shared_user_ids: string[];
  }) {
    const casino_id = await resolveCasinoId(values.casino);
    const payload = {
      player_name: values.player_name,
      casino_id,
      amount: Number(values.amount),
      date_start: values.date_start,
      date_end: values.date_end,
      assigned_to: values.assigned_to || null,
      notes: values.notes || null,
      shared_user_ids: values.shared_user_ids,
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

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/pickups/${deleteTarget.id}`, { method: 'DELETE' });
    setPickups((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setModalOpen(false);
  }

  async function handleBulkSubmit(payloads: BulkPickupPayload[]) {
    const results = await Promise.all(
      payloads.map(async (payload) => {
        const res = await fetch('/api/pickups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok || !body.pickup) {
          return { ok: false as const, error: body.error ?? `Request failed (${res.status})` };
        }
        return { ok: true as const, pickup: body.pickup as PickupWithAssignee };
      })
    );

    const created = results.filter((r) => r.ok).map((r) => r.pickup);
    if (created.length > 0) {
      setPickups((prev) => [...prev, ...created]);
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      throw new Error(
        `${failed.length} of ${payloads.length} pickups failed to create: ${failed[0].error}`
      );
    }
  }

  async function applyPickedUp(p: PickupWithAssignee, pickedUpBy: string | null) {
    const picked_up_at = pickedUpBy ? new Date().toISOString() : null;
    const res = await fetch(`/api/pickups/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picked_up_at, picked_up_by: pickedUpBy }),
    });
    const { pickup } = await res.json();
    setPickups((prev) => prev.map((x) => (x.id === pickup.id ? pickup : x)));
    setEditing((prev) => (prev && prev.id === pickup.id ? pickup : prev));
  }

  function requestTogglePickedUp(p: PickupWithAssignee) {
    if (p.picked_up_at) {
      void applyPickedUp(p, null);
    } else {
      setPickingUpFor(p);
    }
  }

  async function handleConfirmPickedUp(userId: string) {
    if (!pickingUpFor) return;
    await applyPickedUp(pickingUpFor, userId);
    setPickingUpFor(null);
    setModalOpen(false);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full flex-1">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-semibold">Pickups</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="rounded-md border border-[var(--ticket-cream)]/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Add multiple pickups
          </button>
          <button
            onClick={openNew}
            className="rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-display font-medium tracking-wide px-4 py-2 text-sm hover:bg-[var(--brass-400)] transition-colors"
          >
            + New pickup
          </button>
        </div>
      </div>

      <CalendarView
        pickups={pickups}
        profiles={profiles}
        currentUserId={currentUserId}
        onEdit={openEdit}
        onTogglePickedUp={requestTogglePickedUp}
      />

      <PickupFormModal
        key={`edit-${modalOpen ? editing?.id ?? 'new' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editing ? () => setDeleteTarget(editing) : undefined}
        onTogglePickedUp={editing ? async () => requestTogglePickedUp(editing) : undefined}
        profiles={profiles}
        casinos={casinos}
        editing={editing}
        currentUserId={currentUserId}
      />

      <BulkImportModal
        key={`bulk-${bulkModalOpen ? 'open' : 'closed'}`}
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSubmit={handleBulkSubmit}
        profiles={profiles}
        casinos={casinos}
        resolveCasinoId={resolveCasinoId}
      />

      <MarkPickedUpModal
        key={`pickup-${pickingUpFor ? pickingUpFor.id : 'closed'}`}
        open={!!pickingUpFor}
        pickup={pickingUpFor}
        profiles={profiles}
        currentUserId={currentUserId}
        onConfirm={handleConfirmPickedUp}
        onClose={() => setPickingUpFor(null)}
      />

      <DeleteConfirmModal
        key={`delete-${deleteTarget ? deleteTarget.id : 'closed'}`}
        open={!!deleteTarget}
        pickup={deleteTarget}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
