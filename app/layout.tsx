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
        {children}

        {/* Dedicated viewport overlay: this is outside all scrolling page content. */}
        <div className="siteViewportOverlay" aria-hidden="false">
          <div className="globalBetaBadge" aria-label="Version bêta">
            BÊTA TEST
          </div>
          <LanguageSelector />
        </div>
      </body>
    </html>
  );
}