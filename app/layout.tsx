import "./globals.css";
import LanguageSelector from "./components/LanguageSelector";
import ViewportControlsTopLayer from "./components/ViewportControlsTopLayer";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}

        <div className="globalBetaBadge" aria-label="Version bêta" data-no-translate>
          BÊTA TEST
        </div>

        <LanguageSelector />

        {/* Promotes both controls into the browser Top Layer. */}
        <ViewportControlsTopLayer />
      </body>
    </html>
  );
}
