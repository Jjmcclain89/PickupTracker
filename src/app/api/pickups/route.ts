import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SELECT =
  '*, casino:casino_id(id, name, location, player_rewards_club), assignee:assigned_to(id, username, display_name), picked_up_by_profile:picked_up_by(id, username, display_name), shares:pickup_shares(profile:profiles(id, username, display_name))';

export async function GET() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('pickups')
    .select(SELECT)
    .order('date_start', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickups: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    player_name,
    casino_id,
    amount,
    date_start,
    date_end,
    assigned_to,
    notes,
    shared_user_ids,
  } = body;

  if (!player_name || !casino_id || !amount || !date_start || !date_end) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pickups')
    .insert({
      player_name,
      casino_id,
      amount,
      date_start,
      date_end,
      assigned_to: assigned_to || null,
      notes: notes || null,
      created_by: user.user.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(shared_user_ids) && shared_user_ids.length > 0) {
    const rows = shared_user_ids
      .filter((uid: unknown): uid is string => typeof uid === 'string' && uid.length > 0)
      .map((user_id: string) => ({ pickup_id: data.id, user_id }));
    if (rows.length > 0) {
      const { error: shareError } = await supabase
        .from('pickup_shares')
        .upsert(rows, { onConflict: 'pickup_id,user_id', ignoreDuplicates: true });
      if (shareError) return NextResponse.json({ error: shareError.message }, { status: 403 });
    }
  }

  const { data: full, error: fetchError } = await supabase
    .from('pickups')
    .select(SELECT)
    .eq('id', data.id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ pickup: full }, { status: 201 });
}
