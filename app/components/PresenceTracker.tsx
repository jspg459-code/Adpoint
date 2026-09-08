"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function PresenceTracker() {
  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const heartbeat = async () => {
      if (stopped || document.visibilityState === "hidden") return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || stopped) return;

      await supabase
        .from("user_presence")
        .upsert(
          { user_id: user.id, last_seen: new Date().toISOString() },
          { onConflict: "user_id" }
        );
    };

    const start = () => {
      void heartbeat();
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => void heartbeat(), 30000);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
