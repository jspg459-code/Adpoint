"use client";

import { useEffect, useState } from "react";

type Lang = "fr"|"en"|"es"|"de"|"it"|"pt"|"nl"|"ar";

const languages: Record<Lang,{flag:string;name:string}> = {
  fr:{flag:"🇫🇷",name:"Français"},
  en:{flag:"🇬🇧",name:"English"},
  es:{flag:"🇪🇸",name:"Español"},
  de:{flag:"🇩🇪",name:"Deutsch"},
  it:{flag:"🇮🇹",name:"Italiano"},
  pt:{flag:"🇵🇹",name:"Português"},
  nl:{flag:"🇳🇱",name:"Nederlands"},
  ar:{flag:"🇸🇦",name:"العربية"}
};

const phrases: Record<string,Partial<Record<Lang,string>>> = {
  "Connexion":{en:"Login",es:"Iniciar sesión",de:"Anmelden",it:"Accedi",pt:"Entrar",nl:"Inloggen",ar:"تسجيل الدخول"},
  "Se connecter":{en:"Sign in",es:"Iniciar sesión",de:"Anmelden",it:"Accedi",pt:"Entrar",nl:"Inloggen",ar:"تسجيل الدخول"},
  "Créer mon compte":{en:"Create my account",es:"Crear mi cuenta",de:"Mein Konto erstellen",it:"Crea il mio account",pt:"Criar minha conta",nl:"Mijn account aanmaken",ar:"إنشاء حسابي"},
  "Créer un compte":{en:"Create an account",es:"Crear una cuenta",de:"Konto erstellen",it:"Crea un account",pt:"Criar uma conta",nl:"Account aanmaken",ar:"إنشاء حساب"},
  "Déconnexion":{en:"Log out",es:"Cerrar sesión",de:"Abmelden",it:"Disconnetti",pt:"Sair",nl:"Uitloggen",ar:"تسجيل الخروج"},
  "Tableau de bord":{en:"Dashboard",es:"Panel",de:"Dashboard",it:"Dashboard",pt:"Painel",nl:"Dashboard",ar:"لوحة التحكم"},
  "Administration":{en:"Administration",es:"Administración",de:"Verwaltung",it:"Amministrazione",pt:"Administração",nl:"Beheer",ar:"الإدارة"},
  "Retour à AdPoints":{en:"Back to AdPoints",es:"Volver a AdPoints",de:"Zurück zu AdPoints",it:"Torna ad AdPoints",pt:"Voltar ao AdPoints",nl:"Terug naar AdPoints",ar:"العودة إلى AdPoints"},
  "Retour à la connexion":{en:"Back to login",es:"Volver al inicio de sesión",de:"Zurück zur Anmeldung",it:"Torna all'accesso",pt:"Voltar ao login",nl:"Terug naar inloggen",ar:"العودة لتسجيل الدخول"},
  "Content de te revoir.":{en:"Good to see you again.",es:"Me alegra verte de nuevo.",de:"Schön, dich wiederzusehen.",it:"Felice di rivederti.",pt:"Que bom ver você de novo.",nl:"Fijn je weer te zien.",ar:"سعيد برؤيتك مجددًا."},
  "Mot de passe":{en:"Password",es:"Contraseña",de:"Passwort",it:"Password",pt:"Senha",nl:"Wachtwoord",ar:"كلمة المرور"},
  "Mot de passe oublié ?":{en:"Forgot password?",es:"¿Olvidaste tu contraseña?",de:"Passwort vergessen?",it:"Password dimenticata?",pt:"Esqueceu a senha?",nl:"Wachtwoord vergeten?",ar:"هل نسيت كلمة المرور؟"},
  "Pas encore de compte ?":{en:"Don't have an account yet?",es:"¿Aún no tienes cuenta?",de:"Noch kein Konto?",it:"Non hai ancora un account?",pt:"Ainda não tem uma conta?",nl:"Nog geen account?",ar:"ليس لديك حساب بعد؟"},
  "Commence à gagner des AdPoints.":{en:"Start earning AdPoints.",es:"Empieza a ganar AdPoints.",de:"Beginne, AdPoints zu verdienen.",it:"Inizia a guadagnare AdPoints.",pt:"Comece a ganhar AdPoints.",nl:"Begin met AdPoints verdienen.",ar:"ابدأ في كسب نقاط AdPoints."},
  "Pseudo":{en:"Username",es:"Nombre de usuario",de:"Benutzername",it:"Nome utente",pt:"Nome de usuário",nl:"Gebruikersnaam",ar:"اسم المستخدم"},
  "Déjà un compte ?":{en:"Already have an account?",es:"¿Ya tienes una cuenta?",de:"Bereits ein Konto?",it:"Hai già un account?",pt:"Já tem uma conta?",nl:"Al een account?",ar:"لديك حساب بالفعل؟"},
  "Bonjour":{en:"Hello",es:"Hola",de:"Hallo",it:"Ciao",pt:"Olá",nl:"Hallo",ar:"مرحبًا"},
  "BON RETOUR":{en:"WELCOME BACK",es:"BIENVENIDO DE NUEVO",de:"WILLKOMMEN ZURÜCK",it:"BENTORNATO",pt:"BEM-VINDO DE VOLTA",nl:"WELKOM TERUG",ar:"مرحبًا بعودتك"},
  "Ton compte est connecté avec succès.":{en:"Your account is successfully connected.",es:"Tu cuenta se ha conectado correctamente.",de:"Dein Konto wurde erfolgreich verbunden.",it:"Il tuo account è connesso correttamente.",pt:"Sua conta foi conectada com sucesso.",nl:"Je account is succesvol verbonden.",ar:"تم تسجيل دخول حسابك بنجاح."},
  "SOLDE":{en:"BALANCE",es:"SALDO",de:"GUTHABEN",it:"SALDO",pt:"SALDO",nl:"SALDO",ar:"الرصيد"},
  "Activités disponibles":{en:"Available activities",es:"Actividades disponibles",de:"Verfügbare Aktivitäten",it:"Attività disponibili",pt:"Atividades disponíveis",nl:"Beschikbare activiteiten",ar:"الأنشطة المتاحة"},
  "Aucune activité disponible pour le moment.":{en:"No activities available at the moment.",es:"No hay actividades disponibles por el momento.",de:"Derzeit sind keine Aktivitäten verfügbar.",it:"Nessuna attività disponibile al momento.",pt:"Nenhuma atividade disponível no momento.",nl:"Er zijn momenteel geen activiteiten beschikbaar.",ar:"لا توجد أنشطة متاحة حاليًا."},
  "Voir l’activité":{en:"View activity",es:"Ver actividad",de:"Aktivität ansehen",it:"Vedi attività",pt:"Ver atividade",nl:"Activiteit bekijken",ar:"عرض النشاط"},
  "MON COMPTE":{en:"MY ACCOUNT",es:"MI CUENTA",de:"MEIN KONTO",it:"IL MIO ACCOUNT",pt:"MINHA CONTA",nl:"MIJN ACCOUNT",ar:"حسابي"},
  "Mon profil":{en:"My profile",es:"Mi perfil",de:"Mein Profil",it:"Il mio profilo",pt:"Meu perfil",nl:"Mijn profiel",ar:"ملفي الشخصي"},
  "Ton pseudo est celui qui sera affiché sur AdPoints.":{en:"Your username is what will be displayed on AdPoints.",es:"Tu nombre de usuario será el que se muestre en AdPoints.",de:"Dein Benutzername wird auf AdPoints angezeigt.",it:"Il tuo nome utente sarà visualizzato su AdPoints.",pt:"Seu nome de usuário será exibido no AdPoints.",nl:"Je gebruikersnaam wordt op AdPoints weergegeven.",ar:"اسم المستخدم الخاص بك هو الذي سيظهر على AdPoints."},
  "Pseudo disponible":{en:"Username available",es:"Nombre de usuario disponible",de:"Benutzername verfügbar",it:"Nome utente disponibile",pt:"Nome de usuário disponível",nl:"Gebruikersnaam beschikbaar",ar:"اسم المستخدم متاح"},
  "Enregistrer les modifications":{en:"Save changes",es:"Guardar cambios",de:"Änderungen speichern",it:"Salva modifiche",pt:"Salvar alterações",nl:"Wijzigingen opslaan",ar:"حفظ التغييرات"},
  "Adresse e-mail":{en:"Email address",es:"Correo electrónico",de:"E-Mail-Adresse",it:"Indirizzo e-mail",pt:"Endereço de e-mail",nl:"E-mailadres",ar:"البريد الإلكتروني"},
  "Solde actuel":{en:"Current balance",es:"Saldo actual",de:"Aktuelles Guthaben",it:"Saldo attuale",pt:"Saldo atual",nl:"Huidig saldo",ar:"الرصيد الحالي"},
  "Voir le tableau de bord":{en:"View dashboard",es:"Ver panel",de:"Dashboard ansehen",it:"Vedi dashboard",pt:"Ver painel",nl:"Dashboard bekijken",ar:"عرض لوحة التحكم"},
  "Ton pseudo est visible sur AdPoints. Ton e-mail reste privé.":{en:"Your username is visible on AdPoints. Your email remains private.",es:"Tu nombre de usuario es visible en AdPoints. Tu correo sigue siendo privado.",de:"Dein Benutzername ist auf AdPoints sichtbar. Deine E-Mail bleibt privat.",it:"Il tuo nome utente è visibile su AdPoints. La tua e-mail rimane privata.",pt:"Seu nome de usuário é visível no AdPoints. Seu e-mail permanece privado.",nl:"Je gebruikersnaam is zichtbaar op AdPoints. Je e-mail blijft privé.",ar:"اسم المستخدم الخاص بك ظاهر على AdPoints. بريدك الإلكتروني يبقى خاصًا."},
  "ESPACE PRIVÉ":{en:"PRIVATE AREA",es:"ÁREA PRIVADA",de:"PRIVATER BEREICH",it:"AREA PRIVATA",pt:"ÁREA PRIVADA",nl:"PRIVÉGEDEELTE",ar:"منطقة خاصة"},
  "Panel administrateur":{en:"Administrator panel",es:"Panel de administración",de:"Administrationsbereich",it:"Pannello amministratore",pt:"Painel administrativo",nl:"Beheerpaneel",ar:"لوحة الإدارة"},
  "Gestion complète et sécurisée des comptes AdPoints.":{en:"Complete and secure management of AdPoints accounts.",es:"Gestión completa y segura de las cuentas de AdPoints.",de:"Vollständige und sichere Verwaltung der AdPoints-Konten.",it:"Gestione completa e sicura degli account AdPoints.",pt:"Gerenciamento completo e seguro das contas AdPoints.",nl:"Volledig en veilig beheer van AdPoints-accounts.",ar:"إدارة كاملة وآمنة لحسابات AdPoints."},
  "Utilisateurs":{en:"Users",es:"Usuarios",de:"Benutzer",it:"Utenti",pt:"Usuários",nl:"Gebruikers",ar:"المستخدمون"},
  "Comptes bannis":{en:"Banned accounts",es:"Cuentas bloqueadas",de:"Gesperrte Konten",it:"Account bannati",pt:"Contas banidas",nl:"Geblokkeerde accounts",ar:"الحسابات المحظورة"},
  "Activités":{en:"Activities",es:"Actividades",de:"Aktivitäten",it:"Attività",pt:"Atividades",nl:"Activiteiten",ar:"الأنشطة"},
  "Actualiser":{en:"Refresh",es:"Actualizar",de:"Aktualisieren",it:"Aggiorna",pt:"Atualizar",nl:"Vernieuwen",ar:"تحديث"},
  "Banni":{en:"Banned",es:"Bloqueado",de:"Gesperrt",it:"Bannato",pt:"Banido",nl:"Geblokkeerd",ar:"محظور"},
  "Actif":{en:"Active",es:"Activo",de:"Aktiv",it:"Attivo",pt:"Ativo",nl:"Actief",ar:"نشط"},
  "Débannir":{en:"Unban",es:"Desbloquear",de:"Entsperren",it:"Rimuovi ban",pt:"Desbanir",nl:"Deblokkeren",ar:"إلغاء الحظر"},
  "Supprimer":{en:"Delete",es:"Eliminar",de:"Löschen",it:"Elimina",pt:"Excluir",nl:"Verwijderen",ar:"حذف"},
  "Désactiver":{en:"Disable",es:"Desactivar",de:"Deaktivieren",it:"Disattiva",pt:"Desativar",nl:"Uitschakelen",ar:"تعطيل"},
  "Activer":{en:"Enable",es:"Activar",de:"Aktivieren",it:"Attiva",pt:"Ativar",nl:"Inschakelen",ar:"تفعيل"},
  "Nouveau mot de passe":{en:"New password",es:"Nueva contraseña",de:"Neues Passwort",it:"Nuova password",pt:"Nova senha",nl:"Nieuw wachtwoord",ar:"كلمة مرور جديدة"},
  "Confirmer le mot de passe":{en:"Confirm password",es:"Confirmar contraseña",de:"Passwort bestätigen",it:"Conferma password",pt:"Confirmar senha",nl:"Wachtwoord bevestigen",ar:"تأكيد كلمة المرور"},
  "Modifier le mot de passe":{en:"Change password",es:"Cambiar contraseña",de:"Passwort ändern",it:"Modifica password",pt:"Alterar senha",nl:"Wachtwoord wijzigen",ar:"تغيير كلمة المرور"},
  "Regarde.":{en:"Watch.",es:"Mira.",de:"Schau.",it:"Guarda.",pt:"Assista.",nl:"Kijk.",ar:"شاهد."},
  "Gagne.":{en:"Earn.",es:"Gana.",de:"Verdiene.",it:"Guadagna.",pt:"Ganhe.",nl:"Verdien.",ar:"اربح."},
  "Profite.":{en:"Enjoy.",es:"Profita.",de:"Goditi.",it:"Goditi.",pt:"Aproveite.",nl:"Geniet.",ar:"استمتع."},
  "GAGNE DES RÉCOMPENSES":{en:"EARN REWARDS",es:"GANA RECOMPENSAS",de:"BELOHNUNGEN VERDIENEN",it:"GUADAGNA RICOMPENSE",pt:"GANHE RECOMPENSAS",nl:"VERDIEN BELONINGEN",ar:"اكسب مكافآت"},
  "Transforme tes activités en AdPoints et échange-les contre des récompenses.":{en:"Turn your activities into AdPoints and exchange them for rewards.",es:"Convierte tus actividades en AdPoints y cámbialos por recompensas.",de:"Wandle deine Aktivitäten in AdPoints um und tausche sie gegen Belohnungen.",it:"Trasforma le tue attività in AdPoints e scambiali con ricompense.",pt:"Transforme suas atividades em AdPoints e troque por recompensas.",nl:"Zet je activiteiten om in AdPoints en wissel ze in voor beloningen.",ar:"حوّل أنشطتك إلى نقاط AdPoints واستبدلها بمكافآت."},
  "Commencer gratuitement →":{en:"Start for free →",es:"Empezar gratis →",de:"Kostenlos starten →",it:"Inizia gratis →",pt:"Começar grátis →",nl:"Gratis beginnen →",ar:"ابدأ مجانًا ←"}
};

function detectLanguage():Lang{
  if(typeof navigator==="undefined") return "fr";
  const code=navigator.language.toLowerCase().split("-")[0];
  return (Object.keys(languages).includes(code)?code:"fr") as Lang;
}

export default function LanguageSelector(){
  const [lang,setLang]=useState<Lang>("fr");
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem("adpoints-language") as Lang|null;
    const initial=saved&&languages[saved]?saved:detectLanguage();
    setLang(initial);
  },[]);

  useEffect(()=>{
    if(typeof document==="undefined") return;
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==="ar"?"rtl":"ltr";
    localStorage.setItem("adpoints-language",lang);

    const translate=()=>{
      document.querySelectorAll<HTMLElement>("[data-no-translate]").forEach(()=>{});
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      const nodes:Text[]=[];
      while(walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach(node=>{
        const parent=node.parentElement;
        if(!parent || parent.closest("[data-no-translate]")) return;
        const raw=node.textContent||"";
        const key=raw.trim();
        if(!key) return;
        if(!node.parentElement?.dataset.originalText) node.parentElement.dataset.originalText=raw;
        const original=node.parentElement.dataset.originalText||raw;
        const originalKey=original.trim();
        const translated=lang==="fr"?originalKey:phrases[originalKey]?.[lang];
        if(translated){
          const lead=original.match(/^\s*/)?.[0]||"";
          const tail=original.match(/\s*$/)?.[0]||"";
          node.textContent=lead+translated+tail;
        }else if(lang==="fr"){
          node.textContent=original;
        }
      });

      document.querySelectorAll<HTMLInputElement>("[placeholder]").forEach(input=>{
        const original=input.dataset.originalPlaceholder||input.getAttribute("placeholder")||"";
        if(!input.dataset.originalPlaceholder) input.dataset.originalPlaceholder=original;
        const translated=lang==="fr"?original:phrases[original]?.[lang];
        if(translated) input.setAttribute("placeholder",translated);
      });
    };

    translate();
    const observer=new MutationObserver(()=>translate());
    observer.observe(document.body,{childList:true,subtree:true});
    return ()=>observer.disconnect();
  },[lang]);

  return <div className="languageWidget" data-no-translate>
    <button className="languageButton" onClick={()=>setOpen(v=>!v)} aria-label="Choose language">
      <span>{languages[lang].flag}</span><span className="languageCode">{lang.toUpperCase()}</span><span className="languageChevron">⌄</span>
    </button>
    {open&&<div className="languageMenu">
      {(Object.keys(languages) as Lang[]).map(code=><button key={code} onClick={()=>{setLang(code);setOpen(false);}}>
        <span>{languages[code].flag}</span><span>{languages[code].name}</span>{lang===code&&<b>✓</b>}
      </button>)}
    </div>}
  </div>;
}
