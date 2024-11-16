import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Client
 *
 * Initializes and exports the Supabase client instance for interacting with the Supabase backend.
 *
 * Exported as a singleton to ensure a single instance is used throughout the app.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Supabase instance URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Supabase public (anon) key

export const supabase = createClient(supabaseUrl, supabaseKey); // Initialize the Supabase client
