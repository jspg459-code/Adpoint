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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser();

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
        if (!previous || timestamp > previous) {
          clearMap.set(item.other_user_id, timestamp);
        }
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

  // L'enveloppe ne doit jamais apparaître sur les pages d'authentification.
  const authPages = ["/login", "/signup", "/reset-password"];
  if (authPages.includes(pathname) || !visible) return null;

  return (
    <>
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

      <style jsx>{`
        .globalMessagesButton {
          position: fixed;
          /* Sous la barre d'état, dans la zone entourée à gauche. */
          top: max(118px, calc(env(safe-area-inset-top) + 86px));
          left: 18px;
          z-index: 10000;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }

        .globalEnvelopeIcon {
          width: 58px;
          height: 58px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 19px;
          background: linear-gradient(145deg, #42d887, #1fa860);
          border: 1px solid rgba(171, 255, 215, .65);
          box-shadow: 0 12px 30px rgba(38, 192, 108, .34), inset 0 1px 0 rgba(255,255,255,.28);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .globalEnvelopeIcon svg {
          width: 31px;
          height: 31px;
          stroke: #fff;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .globalMessagesButton:hover .globalEnvelopeIcon,
        .globalMessagesButton:active .globalEnvelopeIcon {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 16px 34px rgba(38, 192, 108, .46), inset 0 1px 0 rgba(255,255,255,.28);
        }

        .globalMessagesCount {
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #e94f5d;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          box-shadow: 0 4px 14px rgba(233,79,93,.38);
          border: 2px solid rgba(255,255,255,.14);
        }

        @media (max-width: 700px) {
          .globalMessagesButton {
            top: max(112px, calc(env(safe-area-inset-top) + 82px));
            left: 14px;
          }

          .globalEnvelopeIcon {
            width: 54px;
            height: 54px;
            border-radius: 18px;
          }

          .globalEnvelopeIcon svg {
            width: 29px;
            height: 29px;
          }

          .globalMessagesCount {
            min-width: 25px;
            height: 25px;
            padding: 0 7px;
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
}
