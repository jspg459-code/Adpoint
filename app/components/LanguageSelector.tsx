"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Lang = "fr" | "en" | "es" | "de" | "it" | "pt" | "nl" | "ar";

const languages: Record<Lang, { flag: string; name: string }> = {
  fr: { flag: "🇫🇷", name: "Français" },
  en: { flag: "🇬🇧", name: "English" },
  es: { flag: "🇪🇸", name: "Español" },
  de: { flag: "🇩🇪", name: "Deutsch" },
  it: { flag: "🇮🇹", name: "Italiano" },
  pt: { flag: "🇵🇹", name: "Português" },
  nl: { flag: "🇳🇱", name: "Nederlands" },
  ar: { flag: "🇸🇦", name: "العربية" }
};

type Translation = Partial<Record<Lang, string>>;
const P = (en:string, es:string, de:string, it:string, pt:string, nl:string, ar:string): Translation => ({en,es,de,it,pt,nl,ar});

const phrases: Record<string, Translation> = {
  "Connexion": P("Login","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),
  "Se connecter": P("Sign in","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),
  "Créer mon compte": P("Create my account","Crear mi cuenta","Mein Konto erstellen","Crea il mio account","Criar minha conta","Mijn account aanmaken","إنشاء حسابي"),
  "Créer un compte": P("Create an account","Crear una cuenta","Konto erstellen","Crea un account","Criar uma conta","Account aanmaken","إنشاء حساب"),
  "Déconnexion": P("Log out","Cerrar sesión","Abmelden","Esci","Sair","Uitloggen","تسجيل الخروج"),
  "Tableau de bord": P("Dashboard","Panel","Dashboard","Dashboard","Painel","Dashboard","لوحة التحكم"),
  "Classement": P("Ranking","Clasificación","Rangliste","Classifica","Classificação","Ranglijst","التصنيف"),
  "Mon profil": P("My profile","Mi perfil","Mein Profil","Il mio profilo","Meu perfil","Mijn profiel","ملفي الشخصي"),
  "Administration": P("Administration","Administración","Verwaltung","Amministrazione","Administração","Beheer","الإدارة"),
  "Mot de passe": P("Password","Contraseña","Passwort","Password","Senha","Wachtwoord","كلمة المرور"),
  "Mot de passe oublié ?": P("Forgot password?","¿Olvidaste tu contraseña?","Passwort vergessen?","Password dimenticata?","Esqueceu a senha?","Wachtwoord vergeten?","هل نسيت كلمة المرور؟"),
  "Adresse e-mail": P("Email address","Correo electrónico","E-Mail-Adresse","Indirizzo e-mail","Endereço de e-mail","E-mailadres","البريد الإلكتروني"),
  "Pseudo": P("Username","Nombre de usuario","Benutzername","Nome utente","Nome de usuário","Gebruikersnaam","اسم المستخدم"),
  "Activités disponibles": P("Available activities","Actividades disponibles","Verfügbare Aktivitäten","Attività disponibili","Atividades disponíveis","Beschikbare activiteiten","الأنشطة المتاحة"),
  "Aucune activité disponible pour le moment.": P("No activities available at the moment.","No hay actividades disponibles por el momento.","Derzeit sind keine actividades disponibles.","Nessuna attività disponibile al momento.","Nenhuma atividade disponível no momento.","Er zijn momenteel geen activiteiten beschikbaar.","لا توجد أنشطة متاحة حاليًا."),
  "Voir l’activité": P("View activity","Ver actividad","Aktivität ansehen","Vedi attività","Ver atividade","Activiteit bekijken","عرض النشاط"),
  "Découvrir AdPoints": P("Discover AdPoints","Descubrir AdPoints","AdPoints entdecken","Scopri AdPoints","Descobrir AdPoints","Ontdek AdPoints","اكتشف AdPoints"),
  "Bonus quotidien": P("Daily bonus","Bono diario","Täglicher Bonus","Bonus giornaliero","Bônus diário","Dagelijkse bonus","المكافأة اليومية"),
  "Récupère ton bonus quotidien.": P("Claim your daily bonus.","Recoge tu bono diario.","Hol dir deinen täglichen Bonus.","Raccogli il tuo bonus giornaliero.","Resgate seu bônus diário.","Claim je dagelijkse bonus.","احصل على مكافأتك اليومية."),
  "Défi express": P("Express challenge","Desafío exprés","Express-Herausforderung","Sfida rapida","Desafio expresso","Snelle uitdaging","تحدٍ سريع"),
  "MON COMPTE": P("MY ACCOUNT","MI CUENTA","MEIN KONTO","IL MIO ACCOUNT","MINHA CONTA","MIJN ACCOUNT","حسابي"),
  "ESPACE PRIVÉ": P("PRIVATE AREA","ÁREA PRIVADA","PRIVATER BEREICH","AREA PRIVATA","ÁREA PRIVADA","PRIVÉGEDEELTE","منطقة خاصة"),
  "Solde actuel": P("Current balance","Saldo actual","Aktuelles Guthaben","Saldo attuale","Saldo atual","Huidig saldo","الرصيد الحالي"),
  "BÊTA TEST": P("BETA TEST","PRUEBA BETA","BETATEST","TEST BETA","TESTE BETA","BÈTATEST","اختبار تجريبي"),

  "CLASSEMENT": P("RANKING","CLASIFICACIÓN","RANGLISTE","CLASSIFICA","CLASSIFICAÇÃO","RANGLIJST","التصنيف"),
  "Les meilleurs": P("The best","Los mejores","Die besten","I migliori","Os melhores","De besten","أفضل"),
  "joueurs": P("players","jugadores","Spieler","giocatori","jogadores","spelers","اللاعبين"),
  "Le classement évolue automatiquement selon le nombre d'AdPoints de chaque joueur.": P("The ranking updates automatically according to each player's number of AdPoints.","La clasificación evoluciona automáticamente según el número de AdPoints de cada jugador.","Die Rangliste aktualisiert sich automatisch entsprechend der Anzahl der AdPoints jedes Spielers.","La classifica si aggiorna automaticamente in base al numero di AdPoints di ogni giocatore.","A classificação é atualizada automaticamente de acordo com o número de AdPoints de cada jogador.","De ranglijst wordt automatisch bijgewerkt op basis van het aantal AdPoints van elke speler.","يتم تحديث الترتيب تلقائيًا وفقًا لعدد نقاط AdPoints الخاصة بكل لاعب."),
  "1er": P("1st","1.º","1.","1°","1º","1e","الأول"),
  "2e": P("2nd","2.º","2.","2°","2º","2e","الثاني"),
  "3e": P("3rd","3.º","3.","3°","3º","3e","الثالث"),
  "🎁 Les récompenses sont distribuées automatiquement chaque lundi.": P("🎁 Rewards are distributed automatically every Monday.","🎁 Las recompensas se distribuyen automáticamente cada lunes.","🎁 Die Belohnungen werden jeden Montag automatisch verteilt.","🎁 Le ricompense vengono distribuite automaticamente ogni lunedì.","🎁 As recompensas são distribuídas automaticamente todas as segundas-feiras.","🎁 Beloningen worden elke maandag automatisch uitgedeeld.","🎁 يتم توزيع المكافآت تلقائيًا كل يوم اثنين."),
  "↻ Actualiser le classement": P("↻ Refresh ranking","↻ Actualizar clasificación","↻ Rangliste aktualisieren","↻ Aggiorna classifica","↻ Atualizar classificação","↻ Ranglijst vernieuwen","↻ تحديث الترتيب"),
  "Actualisation...": P("Refreshing...","Actualizando...","Aktualisierung...","Aggiornamento...","Atualizando...","Vernieuwen...","جارٍ التحديث..."),
  "Position": P("Position","Posición","Position","Posizione","Posição","Positie","المركز"),
  "Joueur": P("Player","Jugador","Spieler","Giocatore","Jogador","Speler","اللاعب"),
  "Chargement du classement...": P("Loading ranking...","Cargando clasificación...","Rangliste wird geladen...","Caricamento classifica...","Carregando classificação...","Ranglijst laden...","جارٍ تحميل الترتيب..."),
  "Réessayer": P("Try again","Intentar de nuevo","Erneut versuchen","Riprova","Tentar novamente","Opnieuw proberen","حاول مرة أخرى"),

  "Retour à AdPoints": P("Back to AdPoints","Volver a AdPoints","Zurück zu AdPoints","Torna ad AdPoints","Voltar ao AdPoints","Terug naar AdPoints","العودة إلى AdPoints"),
  "Retour à la connexion": P("Back to login","Volver al inicio de sesión","Zurück zur Anmeldung","Torna al login","Voltar ao login","Terug naar inloggen","العودة لتسجيل الدخول"),
  "Content de te revoir.": P("Good to see you again.","Me alegra verte de nuevo.","Schön, dich wiederzusehen.","Felice di rivederti.","Que bom ver você de novo.","Fijn je weer te zien.","سعيد برؤيتك مجددًا."),
  "Pas encore de compte ?": P("Don't have an account yet?","¿Aún no tienes cuenta?","Noch kein Konto?","Non hai ancora un account?","Ainda não tem uma conta?","Nog geen account?","ليس لديك حساب بعد؟"),
  "Déjà un compte ?": P("Already have an account?","¿Ya tienes una cuenta?","Bereits ein Konto?","Hai già un account?","Já tem uma conta?","Al een account?","لديك حساب بالفعل؟"),
  "Enregistrer le pseudo": P("Save username","Guardar nombre de usuario","Benutzernamen speichern","Salva nome utente","Salvar nome de usuário","Gebruikersnaam opslaan","حفظ اسم المستخدم"),
  "Enregistrer les modifications": P("Save changes","Guardar cambios","Änderungen speichern","Salva modifiche","Salvar alterações","Wijzigingen opslaan","حفظ التغييرات"),
  "Voir le tableau de bord": P("View dashboard","Ver panel","Dashboard ansehen","Vedi dashboard","Ver painel","Dashboard bekijken","عرض لوحة التحكم")
};

function translateValue(value: string, lang: Lang) {
  if (lang === "fr") return value;
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const lead = match?.[1] ?? "";
  const core = match?.[2] ?? value;
  const tail = match?.[3] ?? "";
  return lead + (phrases[core]?.[lang] ?? core) + tail;
}

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");
  const [mounted, setMounted] = useState(false);
  const originals = useRef(new WeakMap<Text, string>());
  const observer = useRef<MutationObserver | null>(null);

  const translateNode = (node: Text, activeLang: Lang) => {
    const parent = node.parentElement;
    if (!parent || parent.closest("[data-no-translate='true']")) return;
    const value = node.nodeValue;
    if (!value || !value.trim()) return;
    if (!originals.current.has(node)) originals.current.set(node, value);
    const original = originals.current.get(node) ?? value;
    const next = translateValue(original, activeLang);
    if (node.nodeValue !== next) node.nodeValue = next;
  };

  const translateAll = (activeLang: Lang) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) translateNode(node as Text, activeLang);
    document.documentElement.lang = activeLang;
    document.documentElement.dir = activeLang === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("adpoints-language") as Lang | null;
    setLang(saved && languages[saved] ? saved : "fr");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    observer.current?.disconnect();
    translateAll(lang);
    localStorage.setItem("adpoints-language", lang);

    observer.current = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((added) => {
          if (added.nodeType === Node.TEXT_NODE) translateNode(added as Text, lang);
          else if (added.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
            let child: Node | null;
            while ((child = walker.nextNode())) translateNode(child as Text, lang);
          }
        });
      }
    });
    observer.current.observe(document.body, { childList: true, subtree: true });
    return () => observer.current?.disconnect();
  }, [lang, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="languageWidget" data-no-translate="true">
      <button className="languageButton" aria-label="Choose language" onClick={() => setOpen(v => !v)}>
        <span>{languages[lang].flag}</span>
        <span className="languageCode">{lang.toUpperCase()}</span>
        <span className="languageChevron">⌄</span>
      </button>
      {open && (
        <div className="languageMenu" role="menu">
          {(Object.keys(languages) as Lang[]).map((code) => (
            <button
              key={code}
              className={"languageOption " + (code === lang ? "active" : "")}
              onClick={() => { setLang(code); setOpen(false); }}
              role="menuitem"
            >
              <span>{languages[code].flag}</span>
              <span>{languages[code].name}</span>
              <span className="languageOptionCode">{code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
