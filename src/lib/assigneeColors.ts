import { Profile } from '@/types/pickup';

// Each entry is a bg + legible-text Tailwind class pair for that color.
const PALETTE = [
  'bg-[var(--assignee-1)] text-[var(--ink)]',
  'bg-[var(--assignee-2)] text-[var(--ticket-cream)]',
  'bg-[var(--assignee-3)] text-[var(--ticket-cream)]',
  'bg-[var(--assignee-4)] text-[var(--ticket-cream)]',
  'bg-[var(--assignee-5)] text-[var(--ticket-cream)]',
  'bg-[var(--assignee-6)] text-[var(--ticket-cream)]',
];

const UNASSIGNED_CLASS = 'bg-[var(--unassigned)] text-[var(--ticket-cream)]';

// Stable per-assignee color: indexed by the assignee's position in the
// (alphabetically ordered) profiles list, so it doesn't shift as pickups
// come and go — only if the set of users itself changes.
export function getAssigneeColorClass(profiles: Profile[], assignedTo: string | null): string {
  if (!assignedTo) return UNASSIGNED_CLASS;
  const index = profiles.findIndex((p) => p.id === assignedTo);
  if (index === -1) return UNASSIGNED_CLASS;
  return PALETTE[index % PALETTE.length];
}
