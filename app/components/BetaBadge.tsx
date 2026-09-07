"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function BetaBadge() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const badge = (
    <div className="betaHeaderBadge" data-no-translate aria-label="Version bêta">
      BÊTA TEST
    </div>
  );

  if (!mounted) return badge;
  return createPortal(badge, document.body);
}
