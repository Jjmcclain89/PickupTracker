'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Navbar({ displayName }: { displayName: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  }

  return (
    <header className="border-b border-[var(--brass-500)]/20 px-4 sm:px-6 py-4 flex items-center justify-between">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.3em] text-[var(--brass-400)]">
          Pickup Tracker
        </p>
        <p className="text-sm text-[var(--ticket-cream)]/70">Hey, {displayName}</p>
      </div>
      <button
        onClick={handleSignOut}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--ticket-cream)]/60 hover:text-[var(--ticket-cream)] transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
