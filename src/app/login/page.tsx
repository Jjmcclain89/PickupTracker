'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const email = `${username.trim().toLowerCase()}@pickup-tracker.local`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('Wrong username or password.');
      return;
    }

    router.refresh();
    router.push('/');
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm lift-in">
        <div className="mb-8 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-[var(--brass-400)]">
            Comp Run
          </p>
          <h1 className="font-display text-3xl font-semibold mt-1">
            Sign in
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="ticket p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-[var(--ink-soft)]/30 bg-white/60 px-3 py-2 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brass-500)]"
              placeholder="josh"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--ink-soft)]/30 bg-white/60 px-3 py-2 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brass-500)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-100 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-[var(--felt-900)] text-[var(--ticket-cream)] font-display font-medium tracking-wide py-2.5 hover:bg-[var(--felt-800)] transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="ticket-stub pt-3 text-center text-[11px] text-[var(--ink-soft)]">
            First time in? Use the temp password you were given — you&apos;ll set your own next.
          </p>
        </form>
      </div>
    </main>
  );
}
