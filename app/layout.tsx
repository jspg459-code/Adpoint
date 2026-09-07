import "./globals.css";
import LanguageSelector from "./components/LanguageSelector";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="globalBetaBadge" aria-label="Version bêta">
          BÊTA TEST
        </div>

        {children}
        <LanguageSelector />
      </body>
    </html>
  );
}
