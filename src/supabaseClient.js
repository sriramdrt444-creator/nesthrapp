import { createClient } from '@supabase/supabase-js'

// These will be replaced by environment variables later.
// Vite uses VITE_ prefixes, but support NEXT_PUBLIC_* names too if available.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
