import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('casinos').select('*').order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ casinos: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, location, player_rewards_club } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Casino name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('casinos')
    .insert({
      name: name.trim(),
      location: location || null,
      player_rewards_club: player_rewards_club || null,
    })
    .select('*')
    .single();

  if (error) {
    // Someone typed a name that already exists (case-insensitively, via the
    // "+ New casino" picker) — resolve to the existing row instead of erroring.
    if (error.code === '23505') {
      const { data: existing, error: fetchError } = await supabase
        .from('casinos')
        .select('*')
        .ilike('name', name.trim())
        .single();
      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
      return NextResponse.json({ casino: existing });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ casino: data }, { status: 201 });
}
