"use client";

import { useEffect } from "react";

/**
 * Promotes the persistent BETA badge and language selector into the browser's
 * native Top Layer. This makes them viewport-bound even if the app uses a
 * transformed/animated scrolling container.
 */
export default function ViewportControlsTopLayer() {
  useEffect(() => {
    const promote = (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;

      // Manual popovers stay open and multiple manual popovers can coexist.
      el.setAttribute("popover", "manual");

      if (typeof el.showPopover === "function") {
        try {
          if (!el.matches(":popover-open")) el.showPopover();
        } catch {
          // The CSS fixed fallback remains available on older browsers.
        }
      }
    };

    // Run after all client controls have mounted.
    const frame = requestAnimationFrame(() => {
      promote(".globalBetaBadge");
      promote(".languageWidget");
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
