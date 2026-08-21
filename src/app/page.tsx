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

  const { data: pickups } = await supabase
    .from('pickups')
    .select('*, assignee:assigned_to(id, username, display_name)')
    .order('date_start', { ascending: true });

  return (
    <div className="flex flex-col flex-1">
      <Navbar displayName={profile?.display_name ?? 'there'} />
      <PickupsView initialPickups={pickups ?? []} profiles={profiles ?? []} />
    </div>
  );
}
