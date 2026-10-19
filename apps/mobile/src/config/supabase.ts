import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://phxybimufcrsnxfepiuz.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OKwNl5c5VD_IKZHi7rL_AQ_rciWCKSp';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('invalid') &&
  supabaseAnonKey !== 'unconfigured-key'
);

if (!isSupabaseConfigured) {
  console.warn(
    '[ChaseHorse Mobile] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured. Mobile authentication will fail closed.',
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
