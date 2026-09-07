"use client";

import { supabase } from "./supabase";

export async function logAudit(
  action: string,
  details: Record<string, unknown> = {},
  page?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      page: page || (typeof window !== "undefined" ? window.location.pathname : null),
      details
    });
  } catch {
    // Le suivi ne doit jamais bloquer l'utilisation du site.
  }
}
