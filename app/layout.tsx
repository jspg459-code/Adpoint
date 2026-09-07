import "./globals.css";
import LanguageSelector from "./components/LanguageSelector";

export const metadata = {
  title: "AdPoints",
  description: "Regarde. Gagne. Profite."
};

const fixedBetaStyle = {
  position: "fixed" as const,
  top: "calc(env(safe-area-inset-top, 0px) + 8px)",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 2147483647,
  pointerEvents: "none" as const
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="globalBetaBadge" style={fixedBetaStyle} aria-label="Version bêta">
          BÊTA TEST
        </div>
        {children}
        <LanguageSelector />
      </body>
    </html>
  );
}
