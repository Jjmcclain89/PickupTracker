import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CasinosView from '@/components/CasinosView';

export default async function CasinosPage() {
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

  const { data: casinos } = await supabase.from('casinos').select('*').order('name');

  return (
    <div className="flex flex-col flex-1">
      <Navbar displayName={profile?.display_name ?? 'there'} />
      <CasinosView initialCasinos={casinos ?? []} />
    </div>
  );
}
