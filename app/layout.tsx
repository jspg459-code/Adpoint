import "./globals.css";
import LanguageSelector from "./components/LanguageSelector";
import BetaBadge from "./components/BetaBadge";
import ActivityLogger from "./components/ActivityLogger";
import GlobalPointsBalance from "./components/GlobalPointsBalance";
import PresenceTracker from "./components/PresenceTracker";
import { PointsProvider } from "./components/PointsProvider";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <PointsProvider>
          {children}
          <PresenceTracker />
          <GlobalPointsBalance />
          <ActivityLogger />
          <BetaBadge />
          <LanguageSelector />
        </PointsProvider>
      </body>
    </html>
  );
}
