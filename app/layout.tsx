import "./globals.css";
import LanguageSelector from "./components/LanguageSelector";
import BetaBadge from "./components/BetaBadge";
import ActivityLogger from "./components/ActivityLogger";
import GlobalPointsBalance from "./components/GlobalPointsBalance";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <GlobalPointsBalance />
        <ActivityLogger />
        <BetaBadge />
        <LanguageSelector />
      </body>
    </html>
  );
}