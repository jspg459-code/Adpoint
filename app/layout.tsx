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
        <div
          aria-label="Version bêta"
          style={{
            position: "fixed",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            pointerEvents: "none",
            padding: "7px 16px",
            borderRadius: "999px",
            background: "rgba(45, 190, 120, 0.16)",
            border: "1px solid rgba(92, 229, 154, 0.55)",
            color: "#8de0b1",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)"
          }}
        >
          BÊTA TEST
        </div>

        {children}
        <LanguageSelector />
      </body>
    </html>
  );
}
