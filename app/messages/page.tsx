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

type ConversationClear = {
  other_user_id: string;
  cleared_at: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; role: string | null } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [clears, setClears] = useState<ConversationClear[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);

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
    const [messagesResult, clearsResult] = await Promise.all([
      supabase
        .from("private_messages")
        .select("id,sender_id,recipient_id,content,created_at,read_at")
        .or(`sender_id.eq.${currentMe.id},recipient_id.eq.${currentMe.id}`)
        .order("created_at", { ascending: true }),
      supabase
        .from("private_conversation_clears")
        .select("other_user_id,cleared_at")
        .eq("user_id", currentMe.id)
    ]);

    if (messagesResult.error) {
      setStatus(messagesResult.error.message || "Impossible de charger les messages.");
      return;
    }

    if (clearsResult.error) {
      setStatus(clearsResult.error.message || "Impossible de charger les conversations.");
      return;
    }

    const currentClears = (clearsResult.data || []) as ConversationClear[];
    setClears(currentClears);

    const clearMap = new Map(
      currentClears.map((item) => [item.other_user_id, new Date(item.cleared_at).getTime()])
    );

    const visibleMessages = ((messagesResult.data || []) as PrivateMessage[]).filter((message) => {
      const otherId = message.sender_id === currentMe.id ? message.recipient_id : message.sender_id;
      const clearedAt = clearMap.get(otherId);
      return !clearedAt || new Date(message.created_at).getTime() > clearedAt;
    });

    setMessages(visibleMessages);

    const staffMode = currentMe.role === "admin" || currentMe.role === "creator";

    if (staffMode) {
      // Les admins/créateurs voient uniquement les utilisateurs qui leur ont écrit.
      const ids = Array.from(
        new Set(
          visibleMessages
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

      const list = ((users || []) as Contact[])
        .filter((person) => person.role !== "admin" && person.role !== "creator")
        .sort((a, b) => {
          const aLast = Math.max(...visibleMessages
            .filter(m => m.sender_id === a.id || m.recipient_id === a.id)
            .map(m => new Date(m.created_at).getTime()));
          const bLast = Math.max(...visibleMessages
            .filter(m => m.sender_id === b.id || m.recipient_id === b.id)
            .map(m => new Date(m.created_at).getTime()));
          return bLast - aLast;
        });

      setContacts(list);
      setSelectedId((current) => list.some((person) => person.id === current) ? current : "");
      return;
    }

    // Utilisateur : contacts de support uniquement.
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

    const recipientId = selectedId;
    const { error } = await supabase.from("private_messages").insert({
      sender_id: me.id,
      recipient_id: recipientId,
      content: text
    });

    if (error) {
      setStatus(error.message || "Impossible d'envoyer le message.");
      setSending(false);
      return;
    }

    setDraft("");
    await logAudit("private_message_sent", { recipient_id: recipientId }, "/messages");
    await refresh();

    // Côté administration, après la réponse on ferme la conversation
    // et on revient directement à la liste des utilisateurs.
    if (isStaff) setSelectedId("");

    setSending(false);
  }

  async function deleteConversation() {
    if (!me || !selectedId || deletingConversation) return;
    const person = selectedContact?.username || selectedContact?.email || "cette conversation";

    if (!window.confirm(`Supprimer cette conversation de votre messagerie avec ${person} ? Elle sera supprimée uniquement de votre côté.`)) {
      return;
    }

    setDeletingConversation(true);
    setStatus("");

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("private_conversation_clears")
      .upsert(
        {
          user_id: me.id,
          other_user_id: selectedId,
          cleared_at: now
        },
        { onConflict: "user_id,other_user_id" }
      );

    if (error) {
      setStatus(error.message || "Impossible de supprimer la conversation.");
      setDeletingConversation(false);
      return;
    }

    setClears((current) => [
      ...current.filter((item) => item.other_user_id !== selectedId),
      { other_user_id: selectedId, cleared_at: now }
    ]);
    setMessages((current) =>
      current.filter((message) =>
        !(
          (message.sender_id === me.id && message.recipient_id === selectedId) ||
          (message.sender_id === selectedId && message.recipient_id === me.id)
        )
      )
    );

    await logAudit("private_conversation_cleared", { other_user_id: selectedId }, "/messages");

    // Pour le staff on retourne à la liste. Pour l'utilisateur, le contact
    // reste disponible mais la conversation devient vide.
    if (isStaff) setSelectedId("");
    setDeletingConversation(false);
  }

  async function logout() {
    await logAudit("logout", {}, "/messages");
    await supabase.auth.signOut();
    router.replace("/");
  }

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

      {isStaff ? (
        <section className="messagesShell staffMessagesShell">
          {!selectedContact ? (
            <div className="staffInbox">
              <h1>Messages reçus</h1>
              <p className="muted">Sélectionne un utilisateur pour ouvrir sa conversation.</p>

              {contacts.length === 0 ? (
                <div className="chatPanel staffEmpty">
                  <div className="emptyConversation">
                    <strong>Aucun message reçu</strong>
                    <span>Les utilisateurs qui t'écriront apparaîtront ici.</span>
                  </div>
                </div>
              ) : (
                <div className="contactsPanel staffContactsOnly">
                  {contacts.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className="contactItem"
                      onClick={() => setSelectedId(person.id)}
                    >
                      <span className="contactAvatar">
                        {(person.username || person.email).slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>{person.username || person.email}</strong>
                        <small>Utilisateur</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="chatPanel staffConversationOnly">
              <div className="chatHeader">
                <div>
                  <button type="button" className="conversationBack" onClick={() => setSelectedId("")}>
                    ← Retour aux messages
                  </button>
                  <strong>{selectedContact.username || selectedContact.email}</strong>
                  <span>Conversation utilisateur</span>
                </div>
                <div className="chatHeaderActions">
                  <button type="button" className="chatRefresh" onClick={refresh}>Actualiser</button>
                  <button type="button" className="deleteConversation" onClick={deleteConversation} disabled={deletingConversation}>
                    {deletingConversation ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>

              <div className="chatMessages">
                {conversation.length === 0 ? (
                  <div className="emptyConversation">
                    <strong>Aucun message</strong>
                    <span>Cette conversation est vide.</span>
                  </div>
                ) : conversation.map((message) => {
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
                  placeholder={`Répondre à ${selectedContact.username || selectedContact.email}...`}
                  maxLength={4000}
                  rows={3}
                />
                <div>
                  <span>{draft.length}/4000</span>
                  <button disabled={!draft.trim() || sending} type="submit">
                    {sending ? "Envoi..." : "Répondre"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="messagesIntro">
            <span className="eyebrow">BESOIN D'AIDE ?</span>
            <h1>Contacter l'administration</h1>
            <p>Envoie un message privé directement au créateur ou à un administrateur. Tes échanges restent visibles uniquement par les participants concernés.</p>
          </section>

          <section className="messagesShell">
            <aside className="contactsPanel">
              <h2>Contacts</h2>

              {contacts.length === 0 && (
                <p className="muted">Aucun administrateur disponible pour le moment.</p>
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
                    <small>{person.role === "creator" ? "Créateur" : "Administrateur"}</small>
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
                      <span>{selectedContact.role === "creator" ? "Créateur AdPoints" : "Administrateur AdPoints"}</span>
                    </div>
                    <div className="chatHeaderActions">
                      <button type="button" className="chatRefresh" onClick={refresh}>Actualiser</button>
                      <button type="button" className="deleteConversation" onClick={deleteConversation} disabled={deletingConversation}>
                        {deletingConversation ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>

                  <div className="chatMessages">
                    {conversation.length === 0 && (
                      <div className="emptyConversation">
                        <strong>Nouvelle conversation</strong>
                        <span>Explique ton problème et un membre de l'équipe pourra te répondre ici.</span>
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
                      placeholder={`Écrire à ${selectedContact.username || selectedContact.email}...`}
                      maxLength={4000}
                      rows={3}
                    />
                    <div>
                      <span>{draft.length}/4000</span>
                      <button disabled={!draft.trim() || sending} type="submit">
                        {sending ? "Envoi..." : "Envoyer"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="emptyConversation">
                  <strong>Aucun contact sélectionné</strong>
                  <span>Les administrateurs apparaîtront ici dès qu'ils seront disponibles.</span>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {status && <div className="profileMessage error">{status}</div>}
    </main>
  );
}
