"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ConversationClear = {
  other_user_id: string;
  cleared_at: string;
};

type PrivateMessage = {
  sender_id: string;
  created_at: string;
};

function localClearKey(userId: string) {
  return `adpoints_conversation_clears_${userId}`;
}

function readLocalClears(userId: string): ConversationClear[] {
  try {
    const raw = window.localStorage.getItem(localClearKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function GlobalMessagesButton() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  // L’enveloppe doit être visible immédiatement après la redirection vers une page privée.\n  // L’état de connexion et le compteur se mettent ensuite à jour en arrière-plan.\n  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUnread() {
      const { data: { session } } = await supabase.auth.getSession();\n      const user = session?.user ?? null;

      if (!user) {
        if (mounted) {
          setVisible(false);
          setCount(0);
        }
        return;
      }

      if (mounted) setVisible(true);

      const [messagesResult, clearsResult] = await Promise.all([
        supabase
          .from("private_messages")
          .select("sender_id,created_at")
          .eq("recipient_id", user.id)
          .is("read_at", null),
        supabase
          .from("private_conversation_clears")
          .select("other_user_id,cleared_at")
          .eq("user_id", user.id)
      ]);

      if (!mounted || messagesResult.error) return;

      const clearMap = new Map<string, number>();
      const clears = [
        ...((clearsResult.error ? [] : clearsResult.data || []) as ConversationClear[]),
        ...readLocalClears(user.id)
      ];

      clears.forEach((item) => {
        const timestamp = new Date(item.cleared_at).getTime();
        const previous = clearMap.get(item.other_user_id);
        if (!previous || timestamp > previous) clearMap.set(item.other_user_id, timestamp);
      });

      const unread = ((messagesResult.data || []) as PrivateMessage[]).filter((message) => {
        const clearedAt = clearMap.get(message.sender_id);
        return !clearedAt || new Date(message.created_at).getTime() > clearedAt;
      });

      if (mounted) setCount(unread.length);
    }

    void loadUnread();
    const timer = window.setInterval(() => void loadUnread(), 4000);
    const onChanged = () => void loadUnread();
    window.addEventListener("adpoints-messages-changed", onChanged);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("adpoints-messages-changed", onChanged);
    };
  }, []);

  // L'enveloppe est réservée aux pages internes de l'application.
  // Elle ne doit jamais apparaître sur l'accueil ni sur les pages publiques/authentification.
  const hiddenPaths = new Set([
    "/",
    "/login",
    "/signup",
    "/reset-password"
  ]);

  if (hiddenPaths.has(pathname) || !visible) return null;

  return (
    <Link href="/messages" className="globalMessagesButton" aria-label="Ouvrir les messages">
      <span className="globalEnvelopeIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v11A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-11Z" />
          <path d="m4.5 6 6.3 5.1a1.9 1.9 0 0 0 2.4 0L19.5 6" />
        </svg>
      </span>
      {count > 0 && (
        <span className="globalMessagesCount">{count > 99 ? "99+" : count}</span>
      )}
    </Link>
  );
}
