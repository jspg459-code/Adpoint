import "./globals.css";
import LanguageSelector from "./components/LanguageSelector";
import BetaBadge from "./components/BetaBadge";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <BetaBadge />
        <LanguageSelector />
      </body>
    </html>
  );
}