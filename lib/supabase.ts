import { createClient } from "@supabase/supabase-js";

// Keep static generation safe when local builds have no .env file.
// Runtime deployments must provide the real public Supabase values.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Client for browser/client-component use.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
