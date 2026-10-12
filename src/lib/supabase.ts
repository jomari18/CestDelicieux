import { createClient } from "@supabase/supabase-js";
import { readPublicConfig } from "./config";
export const publicConfig = readPublicConfig(import.meta.env);
export function createRecoveryClient() {
  return publicConfig.ok
    ? createClient(publicConfig.data.url, publicConfig.data.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: "cestdelicieux-password-recovery",
        },
      })
    : null;
}
export const supabase = publicConfig.ok
  ? createClient(publicConfig.data.url, publicConfig.data.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
