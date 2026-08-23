import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed = ['name', 'location', 'player_rewards_club'] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if ('name' in update && (!update.name || typeof update.name !== 'string' || !update.name.trim())) {
    return NextResponse.json({ error: 'Casino name is required' }, { status: 400 });
  }
  if (typeof update.name === 'string') update.name = update.name.trim();

  const { data, error } = await supabase
    .from('casinos')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ casino: data });
}
