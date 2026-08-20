import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('pickups')
    .select('*, assignee:assigned_to(id, username, display_name)')
    .order('date_start', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickups: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { player_name, casino, amount, date_start, date_end, assigned_to, notes } = body;

  if (!player_name || !casino || !amount || !date_start || !date_end) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pickups')
    .insert({
      player_name,
      casino,
      amount,
      date_start,
      date_end,
      assigned_to: assigned_to || null,
      notes: notes || null,
      created_by: user.user.id,
    })
    .select('*, assignee:assigned_to(id, username, display_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickup: data }, { status: 201 });
}
