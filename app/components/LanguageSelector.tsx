"use client";

import { useEffect, useState } from "react";

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
const P = (en:string, es:string, de:string, it:string, pt:string, nl:string, ar:string):Translation =>
  ({ en, es, de, it, pt, nl, ar });

// Persist the original French text for every DOM node while the language changes.
const originalTexts = new WeakMap<Text, string>();

const phrases: Record<string, Translation> = {
  "Connexion": P("Login","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),
  "Se connecter": P("Sign in","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),
  "Connexion...": P("Signing in...","Iniciando sesión...","Anmeldung...","Accesso in corso...","Entrando...","Bezig met inloggen...","جارٍ تسجيل الدخول..."),
  "Créer mon compte": P("Create my account","Crear mi cuenta","Mein Konto erstellen","Crea il mio account","Criar minha conta","Mijn account aanmaken","إنشاء حسابي"),
  "Créer un compte": P("Create an account","Crear una cuenta","Konto erstellen","Crea un account","Criar uma conta","Account aanmaken","إنشاء حساب"),
  "Création...": P("Creating...","Creando...","Wird erstellt...","Creazione...","Criando...","Wordt aangemaakt...","جارٍ الإنشاء..."),
  "Déconnexion": P("Log out","Cerrar sesión","Abmelden","Esci","Sair","Uitloggen","تسجيل الخروج"),
  "Tableau de bord": P("Dashboard","Panel","Dashboard","Dashboard","Painel","Dashboard","لوحة التحكم"),
  "Mon profil": P("My profile","Mi perfil","Mein Profil","Il mio profilo","Meu perfil","Mijn profiel","ملفي الشخصي"),
  "Administration": P("Administration","Administración","Verwaltung","Amministrazione","Administração","Beheer","الإدارة"),
  "Retour à AdPoints": P("Back to AdPoints","Volver a AdPoints","Zurück zu AdPoints","Torna ad AdPoints","Voltar ao AdPoints","Terug naar AdPoints","العودة إلى AdPoints"),
  "Retour à la connexion": P("Back to login","Volver al inicio de sesión","Zurück zur Anmeldung","Torna al login","Voltar ao login","Terug naar inloggen","العودة لتسجيل الدخول"),
  "Content de te revoir.": P("Good to see you again.","Me alegra verte de nuevo.","Schön, dich wiederzusehen.","Felice di rivederti.","Que bom ver você de novo.","Fijn je weer te zien.","سعيد برؤيتك مجددًا."),
  "Mot de passe": P("Password","Contraseña","Passwort","Password","Senha","Wachtwoord","كلمة المرور"),
  "Mot de passe oublié ?": P("Forgot password?","¿Olvidaste tu contraseña?","Passwort vergessen?","Password dimenticata?","Esqueceu a senha?","Wachtwoord vergeten?","هل نسيت كلمة المرور؟"),
  "Envoi du lien...": P("Sending link...","Enviando enlace...","Link wird gesendet...","Invio del link...","Enviando link...","Link wordt verzonden...","جارٍ إرسال الرابط..."),
  "Pas encore de compte ?": P("Don't have an account yet?","¿Aún no tienes cuenta?","Noch kein Konto?","Non hai ancora un account?","Ainda não tem uma conta?","Nog geen account?","ليس لديك حساب بعد؟"),
  "Déjà un compte ?": P("Already have an account?","¿Ya tienes una cuenta?","Bereits ein Konto?","Hai già un account?","Já tem uma conta?","Al een account?","لديك حساب بالفعل؟"),
  "Commence à gagner des AdPoints.": P("Start earning AdPoints.","Empieza a ganar AdPoints.","Beginne, AdPoints zu verdienen.","Inizia a guadagnare AdPoints.","Comece a ganhar AdPoints.","Begin met AdPoints verdienen.","ابدأ في كسب نقاط AdPoints."),
  "Pseudo": P("Username","Nombre de usuario","Benutzername","Nome utente","Nome de usuário","Gebruikersnaam","اسم المستخدم"),
  "Adresse e-mail": P("Email address","Correo electrónico","E-Mail-Adresse","Indirizzo e-mail","Endereço de e-mail","E-mailadres","البريد الإلكتروني"),
  "Mot de passe (6 caractères minimum)": P("Password (minimum 6 characters)","Contraseña (mínimo 6 caracteres)","Passwort (mindestens 6 Zeichen)","Password (minimo 6 caratteri)","Senha (mínimo 6 caracteres)","Wachtwoord (minimaal 6 tekens)","كلمة المرور (6 أحرف على الأقل)"),
  "BON RETOUR": P("WELCOME BACK","BIENVENIDO DE NUEVO","WILLKOMMEN ZURÜCK","BENTORNATO","BEM-VINDO DE VOLTA","WELKOM TERUG","مرحبًا بعودتك"),
  "Ton compte est connecté avec succès.": P("Your account is successfully connected.","Tu cuenta se ha conectado correctamente.","Dein Konto wurde erfolgreich verbunden.","Il tuo account è connesso correttamente.","Sua conta foi conectada com sucesso.","Je account is succesvol verbonden.","تم تسجيل دخول حسابك بنجاح."),
  "SOLDE": P("BALANCE","SALDO","GUTHABEN","SALDO","SALDO","SALDO","الرصيد"),
  "Choisis ton pseudo": P("Choose your username","Elige tu nombre de usuario","Wähle deinen Benutzernamen","Scegli il tuo nome utente","Escolha seu nome de usuário","Kies je gebruikersnaam","اختر اسم المستخدم"),
  "Il sera affiché à la place de ton adresse e-mail. Tu pourras le modifier plus tard depuis ton profil.": P("It will be displayed instead of your email address. You can change it later from your profile.","Se mostrará en lugar de tu correo electrónico. Podrás cambiarlo más tarde desde tu perfil.","Er wird statt deiner E-Mail-Adresse angezeigt. Du kannst ihn später in deinem Profil ändern.","Verrà visualizzato al posto del tuo indirizzo email. Potrai modificarlo più tardi dal tuo profilo.","Ele será exibido no lugar do seu endereço de e-mail. Você poderá alterá-lo mais tarde no seu perfil.","Het wordt weergegeven in plaats van je e-mailadres. Je kunt het later in je profiel wijzigen.","سيظهر بدلًا من عنوان بريدك الإلكتروني. يمكنك تغييره لاحقًا من ملفك الشخصي."),
  "Ton pseudo": P("Your username","Tu nombre de usuario","Dein Benutzername","Il tuo nome utente","Seu nome de usuário","Je gebruikersnaam","اسم المستخدم الخاص بك"),
  "Enregistrement...": P("Saving...","Guardando...","Speichern...","Salvataggio...","Salvando...","Opslaan...","جارٍ الحفظ..."),
  "Enregistrer le pseudo": P("Save username","Guardar nombre de usuario","Benutzernamen speichern","Salva nome utente","Salvar nome de usuário","Gebruikersnaam opslaan","حفظ اسم المستخدم"),
  "Activités disponibles": P("Available activities","Actividades disponibles","Verfügbare Aktivitäten","Attività disponibili","Atividades disponíveis","Beschikbare activiteiten","الأنشطة المتاحة"),
  "Aucune activité disponible pour le moment.": P("No activities available at the moment.","No hay actividades disponibles por el momento.","Derzeit sind keine Aktivitäten verfügbar.","Nessuna attività disponibile al momento.","Nenhuma atividade disponível no momento.","Er zijn momenteel geen activiteiten beschikbaar.","لا توجد أنشطة متاحة حاليًا."),
  "Voir l’activité": P("View activity","Ver actividad","Aktivität ansehen","Vedi attività","Ver atividade","Activiteit bekijken","عرض النشاط"),
  "Découvrir AdPoints": P("Discover AdPoints","Descubrir AdPoints","AdPoints entdecken","Scopri AdPoints","Descobrir AdPoints","Ontdek AdPoints","اكتشف AdPoints"),
  "Découvre le fonctionnement de la plateforme et gagne tes premiers points.": P("Discover how the platform works and earn your first points.","Descubre cómo funciona la plataforma y gana tus primeros puntos.","Entdecke, wie die Plattform funktioniert, und verdiene deine ersten Punkte.","Scopri come funziona la piattaforma e guadagna i tuoi primi punti.","Descubra como a plataforma funciona e ganhe seus primeiros pontos.","Ontdek hoe het platform werkt en verdien je eerste punten.","اكتشف كيف تعمل المنصة واربح نقاطك الأولى."),
  "Bonus quotidien": P("Daily bonus","Bono diario","Täglicher Bonus","Bonus giornaliero","Bônus diário","Dagelijkse bonus","المكافأة اليومية"),
  "Récupère ton bonus quotidien.": P("Claim your daily bonus.","Recoge tu bono diario.","Hol dir deinen täglichen Bonus.","Raccogli il tuo bonus giornaliero.","Resgate seu bônus diário.","Claim je dagelijkse bonus.","احصل على مكافأتك اليومية."),
  "Défi express": P("Express challenge","Desafío exprés","Express-Herausforderung","Sfida rapida","Desafio expresso","Snelle uitdaging","تحدٍ سريع"),
  "Une petite activité rapide pour gagner des points.": P("A quick little activity to earn points.","Una pequeña actividad rápida para ganar puntos.","Eine kleine schnelle Aktivität, um Punkte zu verdienen.","Una piccola attività veloce per guadagnare punti.","Uma pequena atividade rápida para ganhar pontos.","Een kleine snelle activiteit om punten te verdienen.","نشاط سريع صغير لكسب النقاط."),
  "MON COMPTE": P("MY ACCOUNT","MI CUENTA","MEIN KONTO","IL MIO ACCOUNT","MINHA CONTA","MIJN ACCOUNT","حسابي"),
  "Ton pseudo est celui qui sera affiché sur AdPoints.": P("Your username is what will be displayed on AdPoints.","Tu nombre de usuario será el que se muestre en AdPoints.","Dein Benutzername wird auf AdPoints angezeigt.","Il tuo nome utente sarà visualizzato su AdPoints.","Seu nome de usuário será exibido no AdPoints.","Je gebruikersnaam wordt op AdPoints weergegeven.","اسم المستخدم الخاص بك هو الذي سيظهر على AdPoints."),
  "Modifiable dans 7 jour(s)": P("Changeable in 7 day(s)","Modificable en 7 día(s)","Änderbar in 7 Tag(en)","Modificabile tra 7 giorno/i","Modificável em 7 dia(s)","Wijzigbaar over 7 dag(en)","يمكن تعديله خلال 7 يوم/أيام"),
  "Prochaine modification :": P("Next change:","Próximo cambio:","Nächste Änderung:","Prossima modifica:","Próxima alteração:","Volgende wijziging:","التعديل التالي:"),
  "Pseudo disponible": P("Username available","Nombre de usuario disponible","Benutzername verfügbar","Nome utente disponibile","Nome de usuário disponível","Gebruikersnaam beschikbaar","اسم المستخدم متاح"),
  "Enregistrer les modifications": P("Save changes","Guardar cambios","Änderungen speichern","Salva modifiche","Salvar alterações","Wijzigingen opslaan","حفظ التغييرات"),
  "Save changes": P("Save changes","Guardar cambios","Änderungen speichern","Salva modifiche","Salvar alterações","Wijzigingen opslaan","حفظ التغييرات"),
  "Solde actuel": P("Current balance","Saldo actual","Aktuelles Guthaben","Saldo attuale","Saldo atual","Huidig saldo","الرصيد الحالي"),
  "Voir le tableau de bord": P("View dashboard","Ver panel","Dashboard ansehen","Vedi dashboard","Ver painel","Dashboard bekijken","عرض لوحة التحكم"),
  "Ton pseudo est visible sur AdPoints. Ton e-mail reste privé.": P("Your username is visible on AdPoints. Your email remains private.","Tu nombre de usuario es visible en AdPoints. Tu correo sigue siendo privado.","Dein Benutzername ist auf AdPoints sichtbar. Deine E-Mail bleibt privat.","Il tuo nome utente è visibile su AdPoints. La tua e-mail rimane privata.","Seu nome de usuário é visível no AdPoints. Seu e-mail permanece privado.","Je gebruikersnaam is zichtbaar op AdPoints. Je e-mail blijft privé.","اسم المستخدم الخاص بك ظاهر على AdPoints. بريدك الإلكتروني يبقى خاصًا."),
  "ESPACE PRIVÉ": P("PRIVATE AREA","ÁREA PRIVADA","PRIVATER BEREICH","AREA PRIVATA","ÁREA PRIVADA","PRIVÉGEDEELTE","منطقة خاصة"),
  "Panel administrateur": P("Administrator panel","Panel de administración","Administrationsbereich","Pannello amministratore","Painel administrativo","Beheerpaneel","لوحة الإدارة"),
  "Gestion complète et sécurisée des comptes AdPoints.": P("Complete and secure management of AdPoints accounts.","Gestión completa y segura de las cuentas de AdPoints.","Vollständige und sichere Verwaltung der AdPoints-Konten.","Gestione completa e sicura degli account AdPoints.","Gerenciamento completo e seguro das contas AdPoints.","Volledig en veilig beheer van AdPoints-accounts.","إدارة كاملة وآمنة لحسابات AdPoints."),
  "Utilisateurs": P("Users","Usuarios","Benutzer","Utenti","Usuários","Gebruikers","المستخدمون"),
  "Comptes bannis": P("Banned accounts","Cuentas bloqueadas","Gesperrte Konten","Account bannati","Contas banidas","Geblokkeerde accounts","الحسابات المحظورة"),
  "AdPoints en circulation": P("AdPoints in circulation","AdPoints en circulación","AdPoints im Umlauf","AdPoints in circolazione","AdPoints em circulação","AdPoints in omloop","نقاط AdPoints المتداولة"),
  "Activités": P("Activities","Actividades","Aktivitäten","Attività","Atividades","Activiteiten","الأنشطة"),
  "Actualiser": P("Refresh","Actualizar","Aktualisieren","Aggiorna","Atualizar","Vernieuwen","تحديث"),
  "Bannis temporairement, débannis ou supprime définitivement un compte.": P("Temporarily ban, unban or permanently delete an account.","Bloquea temporalmente, desbloquea o elimina definitivamente una cuenta.","Sperre, entsperre oder lösche ein Konto dauerhaft.","Banna temporaneamente, rimuovi il ban o elimina definitivamente un account.","Bana temporariamente, desbane ou exclua uma conta definitivamente.","Ban tijdelijk, hef de ban op of verwijder een account definitief.","احظر الحساب مؤقتًا أو أزل الحظر أو احذفه نهائيًا."),
  "Banni": P("Banned","Bloqueado","Gesperrt","Bannato","Banido","Geblokkeerd","محظور"),
  "Actif": P("Active","Activo","Aktiv","Attivo","Ativo","Actief","نشط"),
  "Active": P("Active","Activo","Aktiv","Attiva","Ativa","Actief","نشطة"),
  "Inactive": P("Inactive","Inactivo","Inaktiv","Inattiva","Inativa","Inactief","غير نشطة"),
  "Débannir": P("Unban","Desbloquear","Entsperren","Rimuovi ban","Desbanir","Deblokkeren","إلغاء الحظر"),
  "Bannir 1h": P("Ban 1h","Bloquear 1 h","1 Std. sperren","Banna 1h","Banir 1h","1 uur bannen","حظر ساعة واحدة"),
  "24h": P("24h","24 h","24 Std.","24h","24h","24 uur","24 ساعة"),
  "7j": P("7d","7d","7T","7g","7d","7d","7 أيام"),
  "30j": P("30d","30d","30T","30g","30d","30d","30 يومًا"),
  "Durée perso": P("Custom duration","Duración personalizada","Eigene Dauer","Durata personalizzata","Duração personalizada","Eigen duur","مدة مخصصة"),
  "Supprimer": P("Delete","Eliminar","Löschen","Elimina","Excluir","Verwijderen","حذف"),
  "Active ou désactive les activités disponibles.": P("Enable or disable available activities.","Activa o desactiva las actividades disponibles.","Aktiviere oder deaktiviere verfügbare Aktivitäten.","Attiva o disattiva le attività disponibili.","Ative ou desative as atividades disponíveis.","Schakel beschikbare activiteiten in of uit.","فعّل أو عطّل الأنشطة المتاحة."),
  "Aucune description": P("No description","Sin descripción","Keine Beschreibung","Nessuna descrizione","Sem descrição","Geen beschrijving","لا يوجد وصف"),
  "Désactiver": P("Disable","Desactivar","Deaktivieren","Disattiva","Desativar","Uitschakelen","تعطيل"),
  "Activer": P("Enable","Activar","Aktivieren","Attiva","Ativar","Inschakelen","تفعيل"),
  "Nouveau mot de passe": P("New password","Nueva contraseña","Neues Passwort","Nuova password","Nova senha","Nieuw wachtwoord","كلمة مرور جديدة"),
  "Confirmer le mot de passe": P("Confirm password","Confirmar contraseña","Passwort bestätigen","Conferma password","Confirmar senha","Wachtwoord bevestigen","تأكيد كلمة المرور"),
  "Modifier le mot de passe": P("Change password","Cambiar contraseña","Passwort ändern","Modifica password","Alterar senha","Wachtwoord wijzigen","تغيير كلمة المرور"),
  "Modification...": P("Changing...","Cambiando...","Wird geändert...","Modifica in corso...","Alterando...","Wijzigen...","جارٍ التعديل..."),
  "Vérification du lien...": P("Checking link...","Verificando enlace...","Link wird geprüft...","Verifica del link...","Verificando link...","Link controleren...","جارٍ التحقق من الرابط..."),
  "Choisis un nouveau mot de passe pour ton compte.": P("Choose a new password for your account.","Elige una nueva contraseña para tu cuenta.","Wähle ein neues Passwort für dein Konto.","Scegli una nuova password per il tuo account.","Escolha uma nova senha para sua conta.","Kies een nieuw wachtwoord voor je account.","اختر كلمة مرور جديدة لحسابك."),
  "Vérification sécurisée de ton lien de réinitialisation...": P("Securely checking your reset link...","Verificando de forma segura tu enlace de restablecimiento...","Dein Zurücksetzungslink wird sicher geprüft...","Verifica sicura del link di reimpostazione...","Verificando com segurança seu link de redefinição...","Je resetlink wordt veilig gecontroleerd...","جارٍ التحقق بأمان من رابط إعادة التعيين..."),
  "Regarde.": P("Watch.","Mira.","Schau.","Guarda.","Assista.","Kijk.","شاهد."),
  "Gagne.": P("Earn.","Gana.","Verdiene.","Guadagna.","Ganhe.","Verdien.","اربح."),
  "Profite.": P("Enjoy.","Disfruta.","Genieße.","Goditi.","Aproveite.","Geniet.","استمتع."),
  "GAGNE DES RÉCOMPENSES": P("EARN REWARDS","GANA RECOMPENSAS","BELOHNUNGEN VERDIENEN","GUADAGNA RICOMPENSE","GANHE RECOMPENSAS","VERDIEN BELONINGEN","اكسب مكافآت"),
  "Transforme tes activités en AdPoints et échange-les contre des récompenses.": P("Turn your activities into AdPoints and exchange them for rewards.","Convierte tus actividades en AdPoints y cámbialos por recompensas.","Wandle deine Aktivitäten in AdPoints um und tausche sie gegen Belohnungen.","Trasforma le tue attività in AdPoints e scambiali con ricompense.","Transforme suas atividades em AdPoints e troque por recompensas.","Zet je activiteiten om in AdPoints en wissel ze in voor beloningen.","حوّل أنشطتك إلى نقاط AdPoints واستبدلها بمكافآت."),
  "Commencer gratuitement →": P("Start for free →","Empezar gratis →","Kostenlos starten →","Inizia gratis →","Começar grátis →","Gratis beginnen →","ابدأ مجانًا ←"),
  "Un e-mail de réinitialisation vient d’être envoyé. Vérifie ta boîte de réception.": P("A password reset email has just been sent. Check your inbox.","Se acaba de enviar un correo de restablecimiento. Revisa tu bandeja de entrada.","Eine E-Mail zum Zurücksetzen wurde gesendet. Prüfe deinen Posteingang.","È stata inviata un'email di reimpostazione. Controlla la tua posta.","Um e-mail de redefinição foi enviado. Verifique sua caixa de entrada.","Er is een e-mail voor wachtwoordherstel verzonden. Controleer je inbox.","تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور. تحقق من بريدك الوارد."),
  "Adresse e-mail ou mot de passe incorrect.": P("Incorrect email address or password.","Correo electrónico o contraseña incorrectos.","E-Mail-Adresse oder Passwort falsch.","Indirizzo email o password errati.","Endereço de e-mail ou senha incorretos.","E-mailadres of wachtwoord onjuist.","عنوان البريد الإلكتروني أو كلمة المرور غير صحيحة."),
  "Trop de tentatives. Réessaie dans quelques instants.": P("Too many attempts. Try again in a few moments.","Demasiados intentos. Inténtalo de nuevo en unos momentos.","Zu viele Versuche. Versuche es gleich noch einmal.","Troppi tentativi. Riprova tra poco.","Muitas tentativas. Tente novamente em instantes.","Te veel pogingen. Probeer het over een paar momenten opnieuw.","محاولات كثيرة جدًا. حاول مرة أخرى بعد قليل.")
};

const dynamicTranslate = (text:string, lang:Lang) => {
  if (lang === "fr") return text;
  const direct = phrases[text]?.[lang];
  if (direct) return direct;

  const rules: Array<[RegExp, Record<Lang,string>]> = [
    [/^Modifiable dans (\d+) jour\(s\)$/,{fr:"",en:"Changeable in $1 day(s)",es:"Modificable en $1 día(s)",de:"Änderbar in $1 Tag(en)",it:"Modificabile tra $1 giorno/i",pt:"Modificável em $1 dia(s)",nl:"Wijzigbaar over $1 dag(en)",ar:"يمكن تعديله خلال $1 يوم/أيام"}],
    [/^Prochaine modification : (.+)$/,{fr:"",en:"Next change: $1",es:"Próximo cambio: $1",de:"Nächste Änderung: $1",it:"Prossima modifica: $1",pt:"Próxima alteração: $1",nl:"Volgende wijziging: $1",ar:"التعديل التالي: $1"}],
    [/^Bannissement restant : (.+)$/,{fr:"",en:"Ban remaining: $1",es:"Bloqueo restante: $1",de:"Verbleibende Sperre: $1",it:"Ban rimanente: $1",pt:"Banimento restante: $1",nl:"Resterende ban: $1",ar:"الحظر المتبقي: $1"}]
  ];

  for (const [regex, translations] of rules) {
    if (regex.test(text)) return text.replace(regex, translations[lang]);
  }
  return text;
};

function detectLanguage():Lang {
  if (typeof navigator === "undefined") return "fr";
  const code = navigator.language.toLowerCase().split("-")[0];
  return (Object.keys(languages).includes(code) ? code : "fr") as Lang;
}

export default function LanguageSelector() {
  const [lang, setLang] = useState<Lang>("fr");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("adpoints-language") as Lang | null;
    setLang(saved && languages[saved] ? saved : detectLanguage());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("adpoints-language", lang);

    const translating = new WeakSet<Text>();

    const translateNode = (node:Text) => {
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-no-translate]")) return;
      if (translating.has(node)) return;

      const raw = originalTexts.get(node) ?? node.textContent ?? "";
      if (!originalTexts.has(node)) originalTexts.set(node, raw);

      const lead = raw.match(/^\s*/)?.[0] ?? "";
      const tail = raw.match(/\s*$/)?.[0] ?? "";
      const key = raw.trim();
      if (!key) return;

      const translated = dynamicTranslate(key, lang);
      const next = lead + translated + tail;

      if (node.textContent !== next) {
        translating.add(node);
        node.textContent = next;
        queueMicrotask(() => translating.delete(node));
      }
    };

    const translateTree = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes:Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach(translateNode);

      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[placeholder]").forEach(el => {
        if (el.closest("[data-no-translate]")) return;
        const original = el.dataset.originalPlaceholder ?? el.getAttribute("placeholder") ?? "";
        if (!el.dataset.originalPlaceholder) el.dataset.originalPlaceholder = original;
        el.setAttribute("placeholder", dynamicTranslate(original, lang));
      });

      document.querySelectorAll<HTMLElement>("[title],[aria-label]").forEach(el => {
        if (el.closest("[data-no-translate]")) return;
        ["title","aria-label"].forEach(attr => {
          const value = el.getAttribute(attr);
          if (!value) return;
          const dataKey = attr === "title" ? "originalTitle" : "originalAriaLabel";
          const original = el.dataset[dataKey] ?? value;
          if (!el.dataset[dataKey]) el.dataset[dataKey] = original;
          el.setAttribute(attr, dynamicTranslate(original, lang));
        });
      });
    };

    translateTree();
    const observer = new MutationObserver(() => translateTree());
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    return () => observer.disconnect();
  }, [lang]);

  return (
    <div className="languageWidget" data-no-translate>
      <button className="languageButton" onClick={() => setOpen(v => !v)} aria-label="Choose language">
        <span>{languages[lang].flag}</span>
        <span className="languageCode">{lang.toUpperCase()}</span>
        <span className="languageChevron">⌄</span>
      </button>

      {open && (
        <div className="languageMenu">
          {(Object.keys(languages) as Lang[]).map(code => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }}>
              <span>{languages[code].flag}</span>
              <span>{languages[code].name}</span>
              {lang === code && <b>✓</b>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
