import { PickupStatus, STATUS_LABEL } from '@/types/pickup';

const STYLES: Record<PickupStatus, string> = {
  active: 'text-[var(--status-active)] bg-[var(--status-active-bg)]',
  upcoming: 'text-[var(--status-upcoming)] bg-[var(--status-upcoming-bg)]',
  expired: 'text-[var(--status-expired)] bg-[var(--status-expired-bg)]',
  picked_up: 'text-[var(--status-picked)] bg-[var(--status-picked-bg)]',
};

export default function StatusBadge({ status }: { status: PickupStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
