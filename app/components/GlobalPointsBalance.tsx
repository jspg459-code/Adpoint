"use client";

import { usePathname } from "next/navigation";
import { usePointsBalance } from "./PointsProvider";

export default function GlobalPointsBalance() {
  const pathname = usePathname();
  const { points } = usePointsBalance();
  const publicRoute = pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/reset-password";

  if (publicRoute || points === null) return null;

  return (
    <div className="globalPointsBalance" aria-label={"Solde : " + points + " AdPoints"}>
      <span className="globalPointsLabel">Solde</span>
      <strong>{points.toLocaleString("fr-FR")}</strong>
      <span className="globalPointsUnit">AdPoints</span>
    </div>
  );
}
