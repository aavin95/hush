import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://fhfoqgesllyrsydnknwf.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "default_supabase_key";
export const supabase = createClient(supabaseUrl, supabaseKey);
