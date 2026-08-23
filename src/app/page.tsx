import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PickupsView from '@/components/PickupsView';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name');

  const { data: casinos } = await supabase.from('casinos').select('*').order('name');

  const { data: pickups } = await supabase
    .from('pickups')
    .select(
      '*, casino:casino_id(id, name, location, player_rewards_club), assignee:assigned_to(id, username, display_name), picked_up_by_profile:picked_up_by(id, username, display_name), shares:pickup_shares(profile:profiles(id, username, display_name))'
    )
    .order('date_start', { ascending: true });

  return (
    <div className="flex flex-col flex-1">
      <Navbar displayName={profile?.display_name ?? 'there'} />
      <PickupsView
        initialPickups={pickups ?? []}
        profiles={profiles ?? []}
        casinos={casinos ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
