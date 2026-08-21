// One-off recovery script: resets a single user's password via the Supabase
// admin API. Useful when someone forgets their password and there's no
// "forgot password" email flow (usernames map to fake @pickup-tracker.local
// addresses, so Supabase's built-in reset email has nowhere real to go).
//
// Usage:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=xxxx \
//   node scripts/reset-password.mjs <username> <new-password>

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [username, newPassword] = process.argv.slice(2);

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}
if (!username || !newPassword) {
  console.error('Usage: node scripts/reset-password.mjs <username> <new-password>');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `${username.trim().toLowerCase()}@pickup-tracker.local`;

const { data: existing } = await supabase.auth.admin.listUsers();
const user = existing?.users?.find((u) => u.email === email);

if (!user) {
  console.error(`No user found for ${email}.`);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password: newPassword,
});

if (error) {
  console.error(`Failed to reset password for ${username}:`, error.message);
  process.exit(1);
}

console.log(`Password for ${username} reset. They can log in with it now.`);
