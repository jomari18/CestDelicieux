import { supabase } from "../../lib/supabase";
import { networkFailure, unavailable } from "../../lib/api";
import type { ApiResult } from "../../domain/contracts";
const result = (error: { message: string } | null): ApiResult<null> =>
  error
    ? { ok: false, code: "AUTH_ERROR", message: error.message }
    : { ok: true, data: null };
export async function signIn(email: string, password: string) {
  if (!supabase) return unavailable<null>();
  try {
    return result(
      (await supabase.auth.signInWithPassword({ email, password })).error,
    );
  } catch {
    return networkFailure<null>();
  }
}
export async function register(name: string, email: string, password: string) {
  if (!supabase) return unavailable<null>();
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: location.origin + "/verify",
      },
    });
    return result(error);
  } catch {
    return networkFailure<null>();
  }
}
export async function verifyEmail(email: string, token: string) {
  if (!supabase) return unavailable<null>();
  try {
    return result(
      (await supabase.auth.verifyOtp({ email, token, type: "signup" })).error,
    );
  } catch {
    return networkFailure<null>();
  }
}
export async function resendEmail(email: string) {
  if (!supabase) return unavailable<null>();
  try {
    return result(
      (
        await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: location.origin + "/verify" },
        })
      ).error,
    );
  } catch {
    return networkFailure<null>();
  }
}
export async function signOut() {
  if (!supabase) return unavailable<null>();
  try {
    return result((await supabase.auth.signOut()).error);
  } catch {
    return networkFailure<null>();
  }
}
