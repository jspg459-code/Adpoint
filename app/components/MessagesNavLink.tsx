"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ConversationClear = {
  other_user_id: string;
  cleared_at: string;
};

type PrivateMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
};

type Props = {
  active?: boolean;
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

export default function MessagesNavLink({ active = false }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUnread() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !mounted) {
        if (mounted) setCount(0);
        return;
      }

      // On charge les messages non lus, puis on applique exactement la même
      // logique de conversations supprimées que la page Messages.
      const [messagesResult, clearsResult] = await Promise.all([
        supabase
          .from("private_messages")
          .select("id,sender_id,recipient_id,created_at,read_at")
          .eq("recipient_id", user.id)
          .is("read_at", null),
        supabase
          .from("private_conversation_clears")
          .select("other_user_id,cleared_at")
          .eq("user_id", user.id)
      ]);

      if (messagesResult.error || !mounted) return;

      const databaseClears = clearsResult.error
        ? []
        : ((clearsResult.data || []) as ConversationClear[]);
      const browserClears = readLocalClears(user.id);

      // On garde la date de suppression la plus récente pour chaque conversation.
      const clearMap = new Map<string, number>();
      [...databaseClears, ...browserClears].forEach((item) => {
        const timestamp = new Date(item.cleared_at).getTime();
        const previous = clearMap.get(item.other_user_id);
        if (!previous || timestamp > previous) {
          clearMap.set(item.other_user_id, timestamp);
        }
      });

      const visibleUnread = ((messagesResult.data || []) as PrivateMessage[]).filter((message) => {
        const clearedAt = clearMap.get(message.sender_id);
        return !clearedAt || new Date(message.created_at).getTime() > clearedAt;
      });

      if (mounted) setCount(visibleUnread.length);
    }

    void loadUnread();
    const timer = window.setInterval(() => void loadUnread(), 5000);

    // Mise à jour immédiate quand une conversation est supprimée/ouverte
    // dans un autre composant de la même page.
    const onMessagesChanged = () => void loadUnread();
    window.addEventListener("adpoints-messages-changed", onMessagesChanged);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("adpoints-messages-changed", onMessagesChanged);
    };
  }, []);

  return (
    <Link href="/messages" className={active ? "active" : ""}>
      Messages
      {count > 0 && (
        <span className="globalUnreadNavBadge">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
