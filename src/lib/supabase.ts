import { createClient } from "@supabase/supabase-js";
import { readPublicConfig } from "./config";
export const publicConfig = readPublicConfig(import.meta.env);
export const supabase = publicConfig.ok
  ? createClient(publicConfig.data.url, publicConfig.data.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
