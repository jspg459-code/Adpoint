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
  "✦ GAGNE DES RÉCOMPENSES": P("✦ EARN REWARDS","✦ GANA RECOMPENSAS","✦ VERDIENE BELOHNUNGEN","✦ GUADAGNA RICOMPENSE","✦ GANHE RECOMPENSAS","✦ VERDIEN BELONINGEN","✦ اكسب المكافآت"),
  "GAGNE DES RÉCOMPENSES": P("EARN REWARDS","GANA RECOMPENSAS","VERDIENE BELOHNUNGEN","GUADAGNA RICOMPENSE","GANHE RECOMPENSAS","VERDIEN BELONINGEN","اكسب المكافآت"),
  "Regarde.": P("Watch.","Mira.","Schau.","Guarda.","Assista.","Kijk.","شاهد."),
  "Gagne.": P("Earn.","Gana.","Verdiene.","Guadagna.","Ganhe.","Verdien.","اكسب."),
  "Profite.": P("Enjoy.","Disfruta.","Genieße.","Approfitta.","Aproveite.","Geniet.","استمتع."),
  "Transforme tes activités en AdPoints et échange-les contre des récompenses.": P("Turn your activities into AdPoints and exchange them for rewards.","Convierte tus actividades en AdPoints y cámbialos por recompensas.","Verwandle deine Aktivitäten in AdPoints und tausche sie gegen Belohnungen ein.","Trasforma le tue attività in AdPoints e scambiali con ricompense.","Transforme suas atividades em AdPoints e troque-os por recompensas.","Zet je activiteiten om in AdPoints en wissel ze in voor beloningen.","حوّل أنشطتك إلى نقاط AdPoints واستبدلها بمكافآت."),
  "Commencer gratuitement →": P("Start for free →","Comenzar gratis →","Kostenlos starten →","Inizia gratuitamente →","Começar gratuitamente →","Gratis beginnen →","ابدأ مجانًا ←"),
  "Commencer gratuitement": P("Start for free","Comenzar gratis","Kostenlos starten","Inizia gratuitamente","Começar gratuitamente","Gratis beginnen","ابدأ مجانًا"),
  "Se connecter": P("Sign in","Iniciar sesión","Anmelden","Accedi","Entrar","Inloggen","تسجيل الدخول"),

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
  "Voir le tableau de bord": P("View dashboard","Ver panel","Dashboard ansehen","Vedi dashboard","Ver painel","Dashboard bekijken","عرض لوحة التحكم"),
  "COMPTE SUSPENDU": P("ACCOUNT SUSPENDED","CUENTA SUSPENDIDA","KONTO GESPERRT","ACCOUNT SOSPESO","CONTA SUSPENSA","ACCOUNT OPGESCHORT","الحساب موقوف"),
  "ACCÈS BLOQUÉ": P("ACCESS BLOCKED","ACCESO BLOQUEADO","ZUGRIFF GESPERRT","ACCESSO BLOCCATO","ACESSO BLOQUEADO","TOEGANG GEBLOKKEERD","الوصول محظور"),
  "Votre compte est suspendu": P("Your account is suspended","Tu cuenta está suspendida","Dein Konto ist gesperrt","Il tuo account è sospeso","Sua conta está suspensa","Je account is opgeschort","حسابك موقوف"),
  "Votre compte est temporairement bloqué": P("Your account is temporarily blocked","Tu cuenta está temporalmente bloqueada","Dein Konto ist vorübergehend gesperrt","Il tuo account è temporaneamente bloccato","Sua conta está temporariamente bloqueada","Je account is tijdelijk geblokkeerd","حسابك محظور مؤقتًا"),
  "Ton pseudo": P("Your username","Tu nombre de usuario","Dein Benutzername","Il tuo nome utente","Seu nome de usuário","Je gebruikersnaam","اسم المستخدم الخاص بك"),
  "Le pseudo doit contenir au moins 3 caractères.": P("Username must contain at least 3 characters.","El nombre de usuario debe contener al menos 3 caracteres.","Der Benutzername muss mindestens 3 Zeichen enthalten.","Il nome utente deve contenere almeno 3 caratteri.","O nome de usuário deve ter pelo menos 3 caracteres.","De gebruikersnaam moet minimaal 3 tekens bevatten.","يجب أن يحتوي اسم المستخدم على 3 أحرف على الأقل."),
  "Pseudo enregistré ✓": P("Username saved ✓","Nombre guardado ✓","Benutzername gespeichert ✓","Nome utente salvato ✓","Nome de usuário salvo ✓","Gebruikersnaam opgeslagen ✓","تم حفظ اسم المستخدم ✓"),
  "Adresse e-mail ou mot de passe incorrect.": P("Incorrect email address or password.","Correo electrónico o contraseña incorrectos.","E-Mail-Adresse oder Passwort falsch.","Email o password non corretti.","E-mail ou senha incorretos.","Onjuist e-mailadres of wachtwoord.","البريد الإلكتروني أو كلمة المرور غير صحيحة."),
  "Ton adresse e-mail n’est pas encore confirmée.": P("Your email address has not been confirmed yet.","Tu correo electrónico aún no ha sido confirmado.","Deine E-Mail-Adresse wurde noch nicht bestätigt.","Il tuo indirizzo email non è ancora confermato.","Seu endereço de e-mail ainda não foi confirmado.","Je e-mailadres is nog niet bevestigd.","لم يتم تأكيد بريدك الإلكتروني بعد."),
  "Trop de tentatives. Réessaie dans quelques instants.": P("Too many attempts. Please try again shortly.","Demasiados intentos. Inténtalo de nuevo en unos instantes.","Zu viele Versuche. Bitte versuche es gleich erneut.","Troppi tentativi. Riprova tra poco.","Muitas tentativas. Tente novamente em instantes.","Te veel pogingen. Probeer het straks opnieuw.","محاولات كثيرة جدًا. حاول مرة أخرى بعد قليل."),
  "Erreur de connexion au réseau. Réessaie.": P("Network connection error. Try again.","Error de conexión de red. Inténtalo de nuevo.","Netzwerkverbindungsfehler. Versuche es erneut.","Errore di connessione alla rete. Riprova.","Erro de conexão de rede. Tente novamente.","Netwerkverbindingsfout. Probeer opnieuw.","خطأ في الاتصال بالشبكة. حاول مرة أخرى."),
  "Une erreur est survenue. Vérifie tes informations et réessaie.": P("An error occurred. Check your information and try again.","Ocurrió un error. Comprueba tus datos e inténtalo de nuevo.","Ein Fehler ist aufgetreten. Überprüfe deine Angaben und versuche es erneut.","Si è verificato un errore. Controlla i dati e riprova.","Ocorreu um erro. Verifique seus dados e tente novamente.","Er is een fout opgetreden. Controleer je gegevens en probeer opnieuw.","حدث خطأ. تحقق من معلوماتك وحاول مرة أخرى."),
  "Connexion...": P("Signing in...","Iniciando sesión...","Anmeldung...","Accesso...","Entrando...","Inloggen...","جارٍ تسجيل الدخول..."),
  "Envoi du lien...": P("Sending link...","Enviando enlace...","Link wird gesendet...","Invio del link...","Enviando link...","Link verzenden...","جارٍ إرسال الرابط..."),
  "Entre d’abord ton adresse e-mail pour recevoir le lien de réinitialisation.": P("Enter your email address first to receive the reset link.","Introduce primero tu correo electrónico para recibir el enlace.","Gib zuerst deine E-Mail-Adresse ein, um den Link zu erhalten.","Inserisci prima la tua email per ricevere il link.","Digite primeiro seu e-mail para receber o link.","Voer eerst je e-mailadres in om de resetlink te ontvangen.","أدخل بريدك الإلكتروني أولاً لتلقي رابط إعادة التعيين."),
  "Un e-mail de réinitialisation vient d’être envoyé. Vérifie ta boîte de réception.": P("A reset email has just been sent. Check your inbox.","Se acaba de enviar un correo de restablecimiento. Revisa tu bandeja de entrada.","Eine E-Mail zum Zurücksetzen wurde gesendet. Prüfe deinen Posteingang.","È stata inviata un'email di reimpostazione. Controlla la posta in arrivo.","Um e-mail de redefinição foi enviado. Verifique sua caixa de entrada.","Er is een reset-e-mail verstuurd. Controleer je inbox.","تم إرسال رسالة إعادة التعيين. تحقق من بريدك الوارد."),
  "Messagerie": P("Messages","Mensajes","Nachrichten","Messaggi","Mensagens","Berichten","الرسائل"),
  "Messages reçus": P("Received messages","Mensajes recibidos","Empfangene Nachrichten","Messaggi ricevuti","Mensagens recebidas","Ontvangen berichten","الرسائل المستلمة"),
  "Sélectionne n’importe quel utilisateur pour démarrer ou ouvrir une conversation.": P("Select any user to start or open a conversation.","Selecciona cualquier usuario para iniciar o abrir una conversación.","Wähle einen Benutzer aus, um eine Unterhaltung zu starten oder zu öffnen.","Seleziona un utente per avviare o aprire una conversazione.","Selecione qualquer usuário para iniciar ou abrir uma conversa.","Selecteer een gebruiker om een gesprek te starten of te openen.","اختر أي مستخدم لبدء أو فتح محادثة."),
  "Sélectionne un utilisateur pour ouvrir sa conversation.": P("Select a user to open their conversation.","Selecciona un usuario para abrir su conversación.","Wähle einen Benutzer aus, um seine Unterhaltung zu öffnen.","Seleziona un utente per aprire la conversazione.","Selecione um usuário para abrir sua conversa.","Selecteer een gebruiker om het gesprek te openen.","اختر مستخدمًا لفتح محادثته."),
  "Suppression...": P("Deleting...","Eliminando...","Wird gelöscht...","Eliminazione...","Excluindo...","Verwijderen...","جارٍ الحذف..."),
  "Supprimer": P("Delete","Eliminar","Löschen","Elimina","Excluir","Verwijderen","حذف"),
  "Répondre": P("Reply","Responder","Antworten","Rispondi","Responder","Antwoorden","رد"),
  "Envoyer": P("Send","Enviar","Senden","Invia","Enviar","Versturen","إرسال"),
  "Créateur": P("Creator","Creador","Ersteller","Creatore","Criador","Maker","المنشئ"),
  "Administrateur": P("Administrator","Administrador","Administrator","Amministratore","Administrador","Beheerder","المسؤول"),
  "Le pseudo doit contenir entre 3 et 24 caractères.": P("Username must contain between 3 and 24 characters.","El nombre debe tener entre 3 y 24 caracteres.","Der Benutzername muss zwischen 3 und 24 Zeichen haben.","Il nome utente deve contenere tra 3 e 24 caratteri.","O nome deve ter entre 3 e 24 caracteres.","De gebruikersnaam moet tussen 3 en 24 tekens bevatten.","يجب أن يحتوي اسم المستخدم على بين 3 و24 حرفًا."),
  "Aucune modification à enregistrer.": P("No changes to save.","No hay cambios para guardar.","Keine Änderungen zu speichern.","Nessuna modifica da salvare.","Nenhuma alteração para salvar.","Geen wijzigingen om op te slaan.","لا توجد تغييرات للحفظ."),
  "Impossible d’enregistrer le pseudo. Réessaie.": P("Unable to save the username. Try again.","No se puede guardar el nombre. Inténtalo de nuevo.","Benutzername konnte nicht gespeichert werden. Versuche es erneut.","Impossibile salvare il nome utente. Riprova.","Não foi possível salvar o nome. Tente novamente.","Gebruikersnaam kon niet worden opgeslagen. Probeer opnieuw.","تعذر حفظ اسم المستخدم. حاول مرة أخرى."),
  "Ton pseudo est bloqué jusqu’à la prochaine modification autorisée dans": P("Your username is locked until the next allowed change in","Tu nombre está bloqueado hasta el próximo cambio permitido en","Dein Benutzername ist bis zur nächsten erlaubten Änderung gesperrt in","Il tuo nome utente è bloccato fino alla prossima modifica consentita tra","Seu nome de usuário está bloqueado até a próxima alteração permitida em","Je gebruikersnaam is geblokkeerd tot de volgende toegestane wijziging over","اسم المستخدم الخاص بك مقفل حتى التعديل التالي المسموح به خلال"),
  "Choisis un nouveau mot de passe pour ton compte.": P("Choose a new password for your account.","Elige una nueva contraseña para tu cuenta.","Wähle ein neues Passwort für dein Konto.","Scegli una nuova password per il tuo account.","Escolha uma nova senha para sua conta.","Kies een nieuw wachtwoord voor je account.","اختر كلمة مرور جديدة لحسابك."),
  "Nouveau mot de passe": P("New password","Nueva contraseña","Neues Passwort","Nuova password","Nova senha","Nieuw wachtwoord","كلمة مرور جديدة"),
  "Confirmer le mot de passe": P("Confirm password","Confirmar contraseña","Passwort bestätigen","Conferma password","Confirmar senha","Wachtwoord bevestigen","تأكيد كلمة المرور"),
  "Modifier le mot de passe": P("Change password","Cambiar contraseña","Passwort ändern","Modifica password","Alterar senha","Wachtwoord wijzigen","تغيير كلمة المرور"),
  "Modification...": P("Updating...","Actualizando...","Aktualisierung...","Aggiornamento...","Atualizando...","Bijwerken...","جارٍ التعديل..."),
  "Le mot de passe doit contenir au moins 6 caractères.": P("Password must contain at least 6 characters.","La contraseña debe tener al menos 6 caracteres.","Das Passwort muss mindestens 6 Zeichen enthalten.","La password deve contenere almeno 6 caratteri.","A senha deve ter pelo menos 6 caracteres.","Het wachtwoord moet minimaal 6 tekens bevatten.","يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل."),
  "Les deux mots de passe ne correspondent pas.": P("The two passwords do not match.","Las dos contraseñas no coinciden.","Die beiden Passwörter stimmen nicht überein.","Le due password non corrispondono.","As duas senhas não correspondem.","De twee wachtwoorden komen niet overeen.","كلمتا المرور غير متطابقتين."),
  "Mot de passe modifié avec succès !": P("Password changed successfully!","¡Contraseña modificada con éxito!","Passwort erfolgreich geändert!","Password modificata con successo!","Senha alterada com sucesso!","Wachtwoord succesvol gewijzigd!","تم تغيير كلمة المرور بنجاح!"),
  "BOUTIQUE": P("SHOP","TIENDA","SHOP","NEGOZIO","LOJA","WINKEL","المتجر"),
  "✕ Fermer": P("✕ Close","✕ Cerrar","✕ Schließen","✕ Chiudi","✕ Fechar","✕ Sluiten","✕ إغلاق"),
  "+ Créer une offre": P("+ Create an offer","+ Crear una oferta","+ Angebot erstellen","+ Crea un'offerta","+ Criar uma oferta","+ Aanbieding maken","+ إنشاء عرض"),
  "Publier l’offre": P("Publish offer","Publicar oferta","Angebot veröffentlichen","Pubblica offerta","Publicar oferta","Aanbieding publiceren","نشر العرض"),
  "Création...": P("Creating...","Creando...","Erstellung...","Creazione...","Criando...","Aanmaken...","جارٍ الإنشاء..."),
  "Stock illimité": P("Unlimited stock","Stock ilimitado","Unbegrenzter Bestand","Stock illimitato","Estoque ilimitado","Onbeperkte voorraad","مخزون غير محدود"),
  "disponible": P("available","disponible","verfügbar","disponibile","disponível","beschikbaar","متاح"),
  "Aucune récompense n’est disponible pour le moment. Les prochaines offres d’échange apparaîtront ici.": P("No rewards are available at the moment. Upcoming exchange offers will appear here.","No hay recompensas disponibles por el momento. Las próximas ofertas aparecerán aquí.","Derzeit sind keine Belohnungen verfügbar. Neue Angebote erscheinen hier.","Al momento non ci sono ricompense disponibili. Le prossime offerte appariranno qui.","Nenhuma recompensa está disponível no momento. As próximas ofertas aparecerão aqui.","Er zijn momenteel geen beloningen beschikbaar. Nieuwe aanbiedingen verschijnen hier.","لا توجد مكافآت متاحة حاليًا. ستظهر العروض القادمة هنا."),
  "Impossible de créer le compte pour le moment. Réessaie dans quelques minutes.": P("Unable to create the account at the moment. Try again in a few minutes.","No se puede crear la cuenta ahora. Inténtalo en unos minutos.","Konto kann derzeit nicht erstellt werden. Versuche es in einigen Minuten erneut.","Impossibile creare l'account al momento. Riprova tra qualche minuto.","Não foi possível criar a conta agora. Tente novamente em alguns minutos.","Account kan momenteel niet worden aangemaakt. Probeer het over enkele minuten opnieuw.","تعذر إنشاء الحساب حاليًا. حاول مرة أخرى بعد بضع دقائق."),
  "Compte créé ! Vérifie ton e-mail si une confirmation est demandée.": P("Account created! Check your email if confirmation is required.","¡Cuenta creada! Revisa tu correo si se requiere confirmación.","Konto erstellt! Prüfe deine E-Mails, falls eine Bestätigung erforderlich ist.","Account creato! Controlla la tua email se è richiesta una conferma.","Conta criada! Verifique seu e-mail caso seja necessária confirmação.","Account aangemaakt! Controleer je e-mail als bevestiging vereist is.","تم إنشاء الحساب! تحقق من بريدك الإلكتروني إذا كان التأكيد مطلوبًا."),
  "LOGS INDIVIDUELS": P("INDIVIDUAL LOGS","REGISTROS INDIVIDUALES","INDIVIDUELLE PROTOKOLLE","LOG INDIVIDUALI","REGISTROS INDIVIDUAIS","INDIVIDUELE LOGS","السجلات الفردية"),
  "SUIVI DU SITE": P("SITE ACTIVITY","ACTIVIDAD DEL SITIO","WEBSITE-AKTIVITÄT","ATTIVITÀ DEL SITO","ATIVIDADE DO SITE","SITE-ACTIVITEIT","نشاط الموقع"),
  "Rechercher un utilisateur, une action ou une page...": P("Search for a user, action or page...","Buscar un usuario, una acción o una página...","Suche nach Benutzer, Aktion oder Seite...","Cerca un utente, un'azione o una pagina...","Pesquisar usuário, ação ou página...","Zoek naar een gebruiker, actie of pagina...","ابحث عن مستخدم أو إجراء أو صفحة..."),
  "Utilisateur inconnu": P("Unknown user","Usuario desconocido","Unbekannter Benutzer","Utente sconosciuto","Usuário desconhecido","Onbekende gebruiker","مستخدم غير معروف"),
  "Compte supprimé ou non disponible": P("Deleted or unavailable account","Cuenta eliminada o no disponible","Gelöschtes oder nicht verfügbares Konto","Account eliminato o non disponibile","Conta excluída ou indisponível","Verwijderd of niet beschikbaar account","حساب محذوف أو غير متاح"),
  "Page non renseignée": P("Page not specified","Página no indicada","Seite nicht angegeben","Pagina non specificata","Página não informada","Pagina niet opgegeven","الصفحة غير محددة"),
  "Banni": P("Banned","Bloqueado","Gesperrt","Bandito","Banido","Verbannen","محظور"),
  "Suspendu": P("Suspended","Suspendido","Gesperrt","Sospeso","Suspenso","Opgeschort","موقوف"),
  "Actif": P("Active","Activo","Aktiv","Attivo","Ativo","Actief","نشط"),
  "Réinitialiser MDP": P("Reset password","Restablecer contraseña","Passwort zurücksetzen","Reimposta password","Redefinir senha","Wachtwoord resetten","إعادة تعيين كلمة المرور"),
  "Voir les logs": P("View logs","Ver registros","Logs ansehen","Vedi log","Ver registros","Logs bekijken","عرض السجلات"),
  "Nommer admin": P("Make admin","Nombrar administrador","Zum Administrator machen","Nomina amministratore","Nomear administrador","Admin maken","تعيين مسؤول"),
  "Retirer admin": P("Remove admin","Quitar administrador","Administrator entfernen","Rimuovi amministratore","Remover administrador","Admin verwijderen","إزالة المسؤول"),
  "Nommer créateur": P("Make creator","Nombrar creador","Zum Ersteller machen","Nomina creatore","Nomear criador","Maker maken","تعيين منشئ"),
  "Retirer créateur": P("Remove creator","Quitar creador","Ersteller entfernen","Rimuovi creatore","Remover criador","Maker verwijderen","إزالة المنشئ"),
  "Désuspendre": P("Unsuspend","Reactivar","Sperre aufheben","Riattiva","Reativar","Opschorting opheffen","إلغاء الإيقاف"),
  "Débannir": P("Unban","Desbloquear","Entsperren","Revoca ban","Desbanir","Ban opheffen","إلغاء الحظر"),
  "Suspendre": P("Suspend","Suspender","Sperren","Sospendi","Suspender","Opschorten","إيقاف"),
  "Bannir": P("Ban","Bloquear","Sperren","Banna","Banir","Verbannen","حظر"),
  "Enregistrer le pseudo": P("Save username","Guardar nombre","Benutzernamen speichern","Salva nome utente","Salvar nome","Gebruikersnaam opslaan","حفظ اسم المستخدم"),
  "Enregistrer les modifications": P("Save changes","Guardar cambios","Änderungen speichern","Salva modifiche","Salvar alterações","Wijzigingen opslaan","حفظ التغييرات"),
  "Désactiver la boutique": P("Disable shop","Desactivar tienda","Shop deaktivieren","Disattiva negozio","Desativar loja","Winkel uitschakelen","تعطيل المتجر"),
  "Activer la boutique": P("Enable shop","Activar tienda","Shop aktivieren","Attiva negozio","Ativar loja","Winkel inschakelen","تفعيل المتجر"),
  "Modification...": P("Updating...","Actualizando...","Wird geändert...","Aggiornamento...","Atualizando...","Wijzigen...","جارٍ التعديل..."),
  "Utilisateur": P("User","Usuario","Benutzer","Utente","Usuário","Gebruiker","مستخدم")

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
