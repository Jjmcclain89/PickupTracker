export type Profile = {
  id: string;
  username: string;
  display_name: string;
  must_change_password: boolean;
};

export type Pickup = {
  id: string;
  player_name: string;
  casino: string;
  amount: number;
  date_start: string; // ISO date, e.g. "2026-08-20"
  date_end: string;
  assigned_to: string | null;
  picked_up_at: string | null;
  picked_up_by: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PickupWithAssignee = Pickup & {
  assignee: Profile | null;
  picked_up_by_profile: Profile | null;
  shares: { profile: Profile }[];
};

// Everyone with visibility into a pickup beyond its owner: whoever it's
// assigned to, plus anyone the owner explicitly shared it with.
export function getSharedProfiles(pickup: Pick<PickupWithAssignee, 'shares'>): Profile[] {
  return pickup.shares.map((s) => s.profile);
}

export type PickupStatus = 'picked_up' | 'expired' | 'active' | 'upcoming';

export const STATUS_LABEL: Record<PickupStatus, string> = {
  picked_up: 'Picked up',
  expired: 'Expired',
  active: 'Active pickup',
  upcoming: 'Upcoming pickup',
};

// Status is derived, not stored directly:
// - picked_up_at set  -> always "picked_up", regardless of dates
// - otherwise compare today against [date_start, date_end]
export function getPickupStatus(pickup: Pick<Pickup, 'date_start' | 'date_end' | 'picked_up_at'>): PickupStatus {
  if (pickup.picked_up_at) return 'picked_up';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(pickup.date_start + 'T00:00:00');
  const end = new Date(pickup.date_end + 'T00:00:00');

  if (today < start) return 'upcoming';
  if (today > end) return 'expired';
  return 'active';
}
