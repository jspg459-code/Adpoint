"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type PointsContextValue = {
  points: number | null;
  refreshPoints: () => Promise<void>;
};

const PointsContext = createContext<PointsContextValue>({
  points: null,
  refreshPoints: async () => {}
});

function publishPoints(value: number | null) {
  if (typeof window === "undefined") return;
  (window as any).__ADPOINTS_POINTS__ = value;
  window.dispatchEvent(new CustomEvent("adpoints:points-changed", { detail: value }));
}

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const [points, setPoints] = useState<number | null>(null);

  const refreshPoints = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPoints(null);
      publishPoints(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("points_balance")
      .eq("id", user.id)
      .single();

    if (error) return;

    const next = Number(data?.points_balance ?? 0);
    setPoints(next);
    publishPoints(next);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setPoints(null);
        publishPoints(null);
        return;
      }

      await refreshPoints();
      if (cancelled) return;

      channel = supabase
        .channel("adpoints-shared-balance-" + user.id)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: "id=eq." + user.id },
          (payload) => {
            const row = payload.new as { points_balance?: number };
            if (typeof row?.points_balance !== "undefined") {
              const next = Number(row.points_balance ?? 0);
              setPoints(next);
              publishPoints(next);
            }
          }
        )
        .subscribe();
    }

    void start();

    const onFocus = () => void refreshPoints();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshPoints();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setPoints(null);
        publishPoints(null);
      } else {
        void refreshPoints();
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      authListener.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refreshPoints]);

  return (
    <PointsContext.Provider value={{ points, refreshPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePointsBalance() {
  return useContext(PointsContext);
}
