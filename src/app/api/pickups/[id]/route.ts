import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SELECT =
  '*, assignee:assigned_to(id, username, display_name), picked_up_by_profile:picked_up_by(id, username, display_name), shares:pickup_shares(profile:profiles(id, username, display_name))';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed = [
    'player_name',
    'casino',
    'amount',
    'date_start',
    'date_end',
    'assigned_to',
    'notes',
    'picked_up_at',
    'picked_up_by',
  ] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from('pickups').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (Array.isArray(body.shared_user_ids)) {
    const desiredIds = new Set(
      (body.shared_user_ids as unknown[]).filter(
        (uid): uid is string => typeof uid === 'string' && uid.length > 0
      )
    );

    const { data: current, error: currentError } = await supabase
      .from('pickup_shares')
      .select('user_id')
      .eq('pickup_id', id);
    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 403 });

    const currentIds = new Set((current ?? []).map((r) => r.user_id));
    const toAdd = [...desiredIds].filter((uid) => !currentIds.has(uid));
    const toRemove = [...currentIds].filter((uid) => !desiredIds.has(uid));

    if (toAdd.length > 0) {
      const { error: addError } = await supabase
        .from('pickup_shares')
        .upsert(
          toAdd.map((user_id) => ({ pickup_id: id, user_id })),
          { onConflict: 'pickup_id,user_id', ignoreDuplicates: true }
        );
      if (addError) return NextResponse.json({ error: addError.message }, { status: 403 });
    }

    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('pickup_shares')
        .delete()
        .eq('pickup_id', id)
        .in('user_id', toRemove);
      if (removeError) return NextResponse.json({ error: removeError.message }, { status: 403 });
    }
  }

  const { data, error } = await supabase.from('pickups').select(SELECT).eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickup: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('pickups').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
