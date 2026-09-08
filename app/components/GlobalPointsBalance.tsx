"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function GlobalPointsBalance() {
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    async function loadBalance() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (active) setPoints(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("points_balance")
        .eq("id", user.id)
        .single();

      if (active) setPoints(Number(data?.points_balance ?? 0));

      channel = supabase
        .channel("global-points-balance-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: "id=eq." + user.id
          },
          (payload) => {
            const next = payload.new as { points_balance?: number };
            setPoints(Number(next.points_balance ?? 0));
          }
        )
        .subscribe();
    }

    void loadBalance();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) setPoints(null);
      else void loadBalance();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  if (points === null) return null;

  return (
    <div className="globalPointsBalance" aria-label={"Solde : " + points + " AdPoints"}>
      <span className="globalPointsLabel">Solde</span>
      <strong>{points.toLocaleString("fr-FR")}</strong>
      <span className="globalPointsUnit">AdPoints</span>
    </div>
  );
}
