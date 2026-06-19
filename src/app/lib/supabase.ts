import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This function creates a Supabase client that dynamically attaches the secure Clerk JWT token
export const getSupabaseClient = (clerkToken?: string | null) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: clerkToken
        ? { Authorization: `Bearer ${clerkToken}` }
        : {},
    },
  });
};

// Fallback anon client (for static files or initial loads)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);