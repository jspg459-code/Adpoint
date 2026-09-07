"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logAudit } from "../lib/audit";

export default function ActivityLogger() {
  const pathname = usePathname();
  const lastClick = useRef("");

  useEffect(() => {
    logAudit("page_view", { path: pathname }, pathname);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const raw = event.target as HTMLElement | null;
      const element = raw?.closest("button, a, [data-log-action]") as HTMLElement | null;
      if (!element) return;

      const action = element.getAttribute("data-log-action") || "click";
      const label = (
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.textContent ||
        ""
      ).replace(/\s+/g, " ").trim().slice(0, 120);

      const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") : null;
      const signature = action + "|" + label + "|" + (href || "") + "|" + pathname;
      const now = Date.now();

      if (lastClick.current === signature + ":" + Math.floor(now / 400)) return;
      lastClick.current = signature + ":" + Math.floor(now / 400);

      logAudit(action, { label, href }, pathname);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  return null;
}
