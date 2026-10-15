import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpsbqbmtmkgnldllagol.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ISLAolioW_2bkJrKbxjPZg_fW4GSyII';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
