"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function BetaBadge() {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findHost = () =>
      setHost(document.querySelector<HTMLElement>(".cleanTopHeader, .modernHeader, nav"));
    findHost();
    const observer = new MutationObserver(findHost);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const badge = (
    <div className="betaHeaderBadge" data-no-translate aria-label="Version bêta">
      BÊTA TEST
    </div>
  );

  return host ? createPortal(badge, host) : badge;
}
