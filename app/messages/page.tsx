"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { logAudit } from "../lib/audit";

type Contact = {
  id: string;
  username: string | null;
  email: string;
  role: string | null;
};

type PrivateMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export default function MessagesPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; role: string | null } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const isStaff = me?.role === "admin" || me?.role === "creator";

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(timer);
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setStatus("Impossible de charger la messagerie.");
      return;
    }

    const currentMe = { id: user.id, role: profile?.role || null };
    setMe(currentMe);
    await loadMessagesAndContacts(currentMe);
  }

  async function refresh() {
    if (me) await loadMessagesAndContacts(me);
  }

  async function loadMessagesAndContacts(currentMe: { id: string; role: string | null }) {
    const { data, error } = await supabase
      .from("private_messages")
      .select("id,sender_id,recipient_id,content,created_at,read_at")
      .or(`sender_id.eq.${currentMe.id},recipient_id.eq.${currentMe.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      setStatus(error.message || "Impossible de charger les messages.");
      return;
    }

    const allMessages = (data || []) as PrivateMessage[];
    setMessages(allMessages);

    const staffMode = currentMe.role === "admin" || currentMe.role === "creator";

    if (staffMode) {
      // Un administrateur/créateur ne contacte pas l'administration :
      // il voit uniquement les utilisateurs qui lui ont écrit.
      const ids = Array.from(
        new Set(
          allMessages
            .map((message) =>
              message.sender_id === currentMe.id ? message.recipient_id : message.sender_id
            )
            .filter((id) => id && id !== currentMe.id)
        )
      );

      if (!ids.length) {
        setContacts([]);
        setSelectedId("");
        return;
      }

      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id,username,email,role")
        .in("id", ids);

      if (usersError) {
        setStatus("Impossible de charger les utilisateurs ayant écrit à l'administration.");
        return;
      }

      const list = ((users || []) as Contact[]).sort((a, b) => {
        const aLast = Math.max(...allMessages.filter(m => m.sender_id === a.id || m.recipient_id === a.id).map(m => new Date(m.created_at).getTime()));
        const bLast = Math.max(...allMessages.filter(m => m.sender_id === b.id || m.recipient_id === b.id).map(m => new Date(m.created_at).getTime()));
        return bLast - aLast;
      });

      setContacts(list);
      setSelectedId((current) => list.some((person) => person.id === current) ? current : list[0]?.id || "");
      return;
    }

    // Utilisateur normal : il peut uniquement choisir un créateur ou administrateur.
    const { data: staffData, error: staffError } = await supabase.rpc("list_contact_staff");

    if (staffError) {
      setStatus("Impossible de charger les contacts du support.");
      return;
    }

    const list = (staffData || []) as Contact[];
    setContacts(list);
    setSelectedId((current) => current || list[0]?.id || "");
  }

  const selectedContact = contacts.find((person) => person.id === selectedId);

  const conversation = useMemo(() => {
    if (!me || !selectedId) return [];
    return messages.filter(
      (message) =>
        (message.sender_id === me.id && message.recipient_id === selectedId) ||
        (message.sender_id === selectedId && message.recipient_id === me.id)
    );
  }, [messages, me, selectedId]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();

    if (!me || !selectedId || !text || sending) return;

    setSending(true);
    setStatus("");

    const { error } = await supabase.from("private_messages").insert({
      sender_id: me.id,
      recipient_id: selectedId,
      content: text
    });

    if (error) {
      setStatus(error.message || "Impossible d'envoyer le message.");
      setSending(false);
      return;
    }

    setDraft("");
    await logAudit("private_message_sent", { recipient_id: selectedId }, "/messages");
    await refresh();
    setSending(false);
  }

  async function logout() {
    await logAudit("logout", {}, "/messages");
    await supabase.auth.signOut();
    router.replace("/");
  }

  const title = isStaff ? "Messages reçus" : "Contacter l'administration";
  const description = isStaff
    ? "Retrouve ici les utilisateurs qui t'ont contacté. Sélectionne une conversation pour lire les messages et répondre."
    : "Envoie un message privé directement au créateur ou à un administrateur. Tes échanges restent visibles uniquement par les participants concernés.";

  return (
    <main className="dash messagesPage">
      <header className="modernHeader cleanTopHeader">
        <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
        <nav className="cleanTextNav">
          <Link href="/dashboard">Tableau de bord</Link>
          <Link href="/ranking">Classement</Link>
          <Link href="/profile">Mon profil</Link>
          <Link href="/messages" className="active">Messages</Link>
          {isStaff && <Link href="/admin">Administration</Link>}
          <button onClick={logout}>Déconnexion</button>
        </nav>
      </header>

      <section className="messagesIntro">
        <span className="eyebrow">{isStaff ? "MESSAGERIE ADMIN" : "BESOIN D'AIDE ?"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className="messagesShell">
        <aside className="contactsPanel">
          <h2>{isStaff ? "Conversations reçues" : "Contacts"}</h2>

          {contacts.length === 0 && (
            <p className="muted">
              {isStaff
                ? "Aucun utilisateur ne t'a encore contacté."
                : "Aucun administrateur disponible pour le moment."}
            </p>
          )}

          {contacts.map((person) => (
            <button
              key={person.id}
              type="button"
              className={selectedId === person.id ? "contactItem selected" : "contactItem"}
              onClick={() => setSelectedId(person.id)}
            >
              <span className="contactAvatar">
                {(person.username || person.email).slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{person.username || person.email}</strong>
                <small>
                  {isStaff
                    ? "Utilisateur"
                    : person.role === "creator"
                      ? "Créateur"
                      : "Administrateur"}
                </small>
              </span>
            </button>
          ))}
        </aside>

        <div className="chatPanel">
          {selectedContact ? (
            <>
              <div className="chatHeader">
                <div>
                  <strong>{selectedContact.username || selectedContact.email}</strong>
                  <span>
                    {isStaff
                      ? "Conversation utilisateur"
                      : selectedContact.role === "creator"
                        ? "Créateur AdPoints"
                        : "Administrateur AdPoints"}
                  </span>
                </div>
                <button type="button" className="chatRefresh" onClick={refresh}>Actualiser</button>
              </div>

              <div className="chatMessages">
                {conversation.length === 0 && (
                  <div className="emptyConversation">
                    <strong>Nouvelle conversation</strong>
                    <span>
                      {isStaff
                        ? "Cette conversation est prête. Tu peux répondre à l'utilisateur."
                        : "Explique ton problème et un membre de l'équipe pourra te répondre ici."}
                    </span>
                  </div>
                )}

                {conversation.map((message) => {
                  const mine = message.sender_id === me?.id;
                  return (
                    <article key={message.id} className={mine ? "chatBubble mine" : "chatBubble"}>
                      <p>{message.content}</p>
                      <small>{new Date(message.created_at).toLocaleString("fr-FR")}</small>
                    </article>
                  );
                })}
              </div>

              <form className="chatComposer" onSubmit={sendMessage}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={isStaff
                    ? `Répondre à ${selectedContact.username || selectedContact.email}...`
                    : `Écrire à ${selectedContact.username || selectedContact.email}...`}
                  maxLength={4000}
                  rows={3}
                />
                <div>
                  <span>{draft.length}/4000</span>
                  <button disabled={!draft.trim() || sending} type="submit">
                    {sending ? "Envoi..." : isStaff ? "Répondre" : "Envoyer"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="emptyConversation">
              <strong>{isStaff ? "Aucun message reçu" : "Aucun contact sélectionné"}</strong>
              <span>
                {isStaff
                  ? "Les conversations apparaîtront ici lorsqu'un utilisateur te contactera."
                  : "Les administrateurs apparaîtront ici dès qu'ils seront disponibles."}
              </span>
            </div>
          )}
        </div>
      </section>

      {status && <div className="profileMessage error">{status}</div>}
    </main>
  );
}
