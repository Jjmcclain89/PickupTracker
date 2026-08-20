// One-time setup script: creates Josh, Igor, Dave, and Test with the shared
// temp password. Each will be forced to change it on first login.
//
// Usage:
//   1. In your Supabase project, grab: Project Settings > API
//        - Project URL
//        - service_role secret key  (NOT the anon key — keep this private)
//   2. Run:
//        SUPABASE_URL=https://xxxx.supabase.co \
//        SUPABASE_SERVICE_ROLE_KEY=xxxx \
//        node scripts/seed-users.mjs
//
// Safe to re-run — it skips any user that already exists.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEMP_PASSWORD = '123123123';

const USERS = [
  { username: 'josh', display_name: 'Josh', email: 'josh@pickup-tracker.local' },
  { username: 'igor', display_name: 'Igor', email: 'igor@pickup-tracker.local' },
  { username: 'dave', display_name: 'Dave', email: 'dave@pickup-tracker.local' },
  { username: 'test', display_name: 'Test', email: 'test@pickup-tracker.local' },
];

for (const user of USERS) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const already = existing?.users?.find((u) => u.email === user.email);

  if (already) {
    console.log(`Skipping ${user.username} — already exists.`);
    continue;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: user.username,
      display_name: user.display_name,
      must_change_password: true,
    },
  });

  if (error) {
    console.error(`Failed to create ${user.username}:`, error.message);
  } else {
    console.log(`Created ${user.username} (${data.user.id})`);
  }
}

console.log('\nDone. Everyone logs in with their username + "123123123" and will be prompted to set a new password.');
