"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  active?: boolean;
};

export default function MessagesNavLink({ active = false }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUnread() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      const { count: unreadCount } = await supabase
        .from("private_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null);

      if (mounted) setCount(unreadCount || 0);
    }

    void loadUnread();
    const timer = window.setInterval(() => void loadUnread(), 5000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
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
