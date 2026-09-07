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
        <LanguageSelector />
      </body>
    </html>
  );
}