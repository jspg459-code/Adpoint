import "./globals.css";
import Script from "next/script";
import LanguageSelector from "./components/LanguageSelector";
import BetaBadge from "./components/BetaBadge";
import ActivityLogger from "./components/ActivityLogger";
import GlobalPointsBalance from "./components/GlobalPointsBalance";
import PresenceTracker from "./components/PresenceTracker";
import { PointsProvider } from "./components/PointsProvider";
import GlobalMessagesButton from "./components/GlobalMessagesButton";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8585188868825763"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <PointsProvider>
          {children}
          <PresenceTracker />
          <GlobalPointsBalance />
          <ActivityLogger />
          <BetaBadge />
          <LanguageSelector />
          <GlobalMessagesButton />
        </PointsProvider>
      </body>
    </html>
  );
}
