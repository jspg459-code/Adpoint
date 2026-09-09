"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Lang = "fr" | "en" | "es" | "de" | "it" | "pt" | "nl" | "ar";

const languages: Record<Lang, { flag: string; name: string }> = {
  fr: { flag: "🇫🇷", name: "Français" }, en: { flag: "🇬🇧", name: "English" }, es: { flag: "🇪🇸", name: "Español" },
  de: { flag: "🇩🇪", name: "Deutsch" }, it: { flag: "🇮🇹", name: "Italiano" }, pt: { flag: "🇵🇹", name: "Português" },
  nl: { flag: "🇳🇱", name: "Nederlands" }, ar: { flag: "🇸🇦", name: "العربية" }
};

type Translation = Partial<Record<Lang, string>>;
const P = (en:string, es:string, de:string, it:string, pt:string, nl:string, ar:string):Translation => ({ en, es, de, it, pt, nl, ar });

const originalTexts = new WeakMap<Text, string>();

const phrases: Record<string, Translation> = {
  "Connexion": P("Login","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),
  "Se connecter": P("Sign in","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),
  "Créer mon compte": P("Create my account","Crear mi cuenta","Mein Konto erstellen","Crea il mio account","Criar minha conta","Mijn account aanmaken","إنشاء حسابي"),
  "Créer un compte": P("Create an account","Crear una cuenta","Konto erstellen","Crea un account","Criar uma conta","Account aanmaken","إنشاء حساب"),
  "Déconnexion": P("Log out","Cerrar sesión","Abmelden","Esci","Sair","Uitloggen","تسجيل الخروج"),
  "Tableau de bord": P("Dashboard","Panel","Dashboard","Dashboard","Painel","Dashboard","لوحة التحكم"),
  "Mon profil": P("My profile","Mi perfil","Mein Profil","Il mio profilo","Meu perfil","Mijn profiel","ملفي الشخصي"),
  "Administration": P("Administration","Administración","Verwaltung","Amministrazione","Administração","Beheer","الإدارة"),
  "Retour à AdPoints": P("Back to AdPoints","Volver a AdPoints","Zurück zu AdPoints","Torna ad AdPoints","Voltar ao AdPoints","Terug naar AdPoints","العودة إلى AdPoints"),
  "Retour à la connexion": P("Back to login","Volver al inicio de sesión","Zurück zur Anmeldung","Torna al login","Voltar ao login","Terug naar inloggen","العودة لتسجيل الدخول"),
  "Content de te revoir.": P("Good to see you again.","Me alegra verte de nuevo.","Schön, dich wiederzusehen.","Felice di rivederti.","Que bom ver você de novo.","Fijn je weer te zien.","سعيد برؤيتك مجددًا."),
  "Mot de passe": P("Password","Contraseña","Passwort","Password","Senha","Wachtwoord","كلمة المرور"),
  "Mot de passe oublié ?": P("Forgot password?","¿Olvidaste tu contraseña?","Passwort vergessen?","Password dimenticata?","Esqueceu a senha?","Wachtwoord vergeten?","هل نسيت كلمة المرور؟"),
  "Pas encore de compte ?": P("Don't have an account yet?","¿Aún no tienes cuenta?","Noch kein Konto?","Non hai ancora un account?","Ainda não tem uma conta?","Nog geen account?","ليس لديك حساب بعد؟"),
  "Déjà un compte ?": P("Already have an account?","¿Ya tienes una cuenta?","Bereits ein Konto?","Hai già un account?","Já tem uma conta?","Al een account?","لديك حساب بالفعل؟"),
  "Commence à gagner des AdPoints.": P("Start earning AdPoints.","Empieza a ganar AdPoints.","Beginne, AdPoints zu verdienen.","Inizia a guadagnare AdPoints.","Comece a ganhar AdPoints.","Begin met AdPoints verdienen.","ابدأ في كسب نقاط AdPoints."),
  "Pseudo": P("Username","Nombre de usuario","Benutzername","Nome utente","Nome de usuário","Gebruikersnaam","اسم المستخدم"),
  "Adresse e-mail": P("Email address","Correo electrónico","E-Mail-Adresse","Indirizzo e-mail","Endereço de e-mail","E-mailadres","البريد الإلكتروني"),
  "Enregistrement...": P("Saving...","Guardando...","Speichern...","Salvataggio...","Salvando...","Opslaan...","جارٍ الحفظ..."),
  "Enregistrer le pseudo": P("Save username","Guardar nombre de usuario","Benutzernamen speichern","Salva nome utente","Salvar nome de usuário","Gebruikersnaam opslaan","حفظ اسم المستخدم"),
  "Activités disponibles": P("Available activities","Actividades disponibles","Verfügbare Aktivitäten","Attività disponibili","Atividades disponíveis","Beschikbare activiteiten","الأنشطة المتاحة"),
  "Aucune activité disponible pour le moment.": P("No activities available at the moment.","No hay actividades disponibles por el momento.","Derzeit sind keine Aktivitäten verfügbar.","Nessuna attività disponibile al momento.","Nenhuma atividade disponível no momento.","Er zijn momenteel geen activiteiten beschikbaar.","لا توجد أنشطة متاحة حاليًا."),
  "Voir l’activité": P("View activity","Ver actividad","Aktivität ansehen","Vedi attività","Ver atividade","Activiteit bekijken","عرض النشاط"),
  "Découvrir AdPoints": P("Discover AdPoints","Descubrir AdPoints","AdPoints entdecken","Scopri AdPoints","Descobrir AdPoints","Ontdek AdPoints","اكتشف AdPoints"),
  "Bonus quotidien": P("Daily bonus","Bono diario","Täglicher Bonus","Bonus giornaliero","Bônus diário","Dagelijkse bonus","المكافأة اليومية"),
  "Récupère ton bonus quotidien.": P("Claim your daily bonus.","Recoge tu bono diario.","Hol dir deinen täglichen Bonus.","Raccogli il tuo bonus giornaliero.","Resgate seu bônus diário.","Claim je dagelijkse bonus.","احصل على مكافأتك اليومية."),
  "Défi express": P("Express challenge","Desafío exprés","Express-Herausforderung","Sfida rapida","Desafio expresso","Snelle uitdaging","تحدٍ سريع"),
  "Une petite activité rapide pour gagner des points.": P("A quick little activity to earn points.","Una pequeña actividad rápida para ganar puntos.","Eine kleine schnelle Aktivität, um Punkte zu verdienen.","Una piccola attività veloce per guadagnare punti.","Uma pequena atividade rápida para ganhar pontos.","Een kleine snelle activiteit om punten te verdienen.","نشاط سريع صغير لكسب النقاط."),
  "MON COMPTE": P("MY ACCOUNT","MI CUENTA","MEIN KONTO","IL MIO ACCOUNT","MINHA CONTA","MIJN ACCOUNT","حسابي"),
  "ESPACE PRIVÉ": P("PRIVATE AREA","ÁREA PRIVADA","PRIVATER BEREICH","AREA PRIVATA","ÁREA PRIVADA","PRIVÉGEBIED","منطقة خاصة"),
  "Solde actuel": P("Current balance","Saldo actual","Aktuelles Guthaben","Saldo attuale","Saldo atual","Huidig saldo","الرصيد الحالي"),
  "Voir le tableau de bord": P("View dashboard","Ver panel","Dashboard ansehen","Vedi dashboard","Ver painel","Dashboard bekijken","عرض لوحة التحكم"),
  "BÊTA TEST": P("BETA TEST","PRUEBA BETA","BETATEST","TEST BETA","TESTE BETA","BÈTATEST","اختبار تجريبي")
};

function getTranslation(text: string, lang: Lang) {
  if (lang === "fr") return text;
  return phrases[text]?.[lang] ?? text;
}

function translateDocument(lang: Lang) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const textNode of nodes) {
    const parent = textNode.parentElement;
    if (!parent || parent.closest("[data-no-translate='true']")) continue;
    if (!textNode.nodeValue?.trim()) continue;
    if (!originalTexts.has(textNode)) originalTexts.set(textNode, textNode.nodeValue);
    const original = originalTexts.get(textNode) ?? textNode.nodeValue;
    textNode.nodeValue = getTranslation(original, lang);
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("adpoints-language") as Lang | null) ?? "fr";
    if (languages[saved]) setLang(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    translateDocument(lang);
    localStorage.setItem("adpoints-language", lang);
  }, [lang, mounted]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".languageWidget")) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (!mounted) return null;

  const content = (
    <div className="languageWidget" data-no-translate="true">
      <button className="languageButton" aria-label="Choose language" onClick={() => setOpen(v => !v)}>
        <span>{languages[lang].flag}</span><span className="languageCode">{lang.toUpperCase()}</span><span className="languageChevron">⌄</span>
      </button>
      {open && (
        <div className="languageMenu" role="menu">
          {(Object.keys(languages) as Lang[]).map(code => (
            <button key={code} className={`languageOption ${code === lang ? "active" : ""}`} onClick={() => { setLang(code); setOpen(false); }} role="menuitem">
              <span>{languages[code].flag}</span><span>{languages[code].name}</span><span className="languageOptionCode">{code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
