"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { logAudit } from "../lib/audit";

type Staff = {
  id: string;
  username: string | null;
  email: string;
  role: "admin" | "creator";
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
  const [staff, setStaff] = useState<Staff[]>([]);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void load();

    const timer = window.setInterval(() => {
      void refreshMessages();
    }, 8000);

    return () => window.clearInterval(timer);
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: profile }, { data: staffData, error: staffError }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.rpc("list_contact_staff")
    ]);

    setMe({ id: user.id, role: profile?.role || null });

    if (staffError) {
      setStatus("Impossible de charger les contacts du support.");
      return;
    }

    const list = (staffData || []) as Staff[];
    setStaff(list);
    if (list.length) setSelectedId((current) => current || list[0].id);

    await loadMessages(user.id);
  }

  async function loadMessages(userId?: string) {
    const id = userId || me?.id;
    if (!id) return;

    const { data, error } = await supabase
      .from("private_messages")
      .select("id,sender_id,recipient_id,content,created_at,read_at")
      .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
      .order("created_at", { ascending: true });

    if (!error) setMessages((data || []) as PrivateMessage[]);
  }

  async function refreshMessages() {
    await loadMessages();
  }

  const selectedStaff = staff.find((person) => person.id === selectedId);

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
    await loadMessages(me.id);
    setSending(false);
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
          {(me?.role === "admin" || me?.role === "creator") && <Link href="/admin">Administration</Link>}
          <button onClick={logout}>Déconnexion</button>
        </nav>
      </header>

      <section className="messagesIntro">
        <span className="eyebrow">BESOIN D'AIDE ?</span>
        <h1>Contacter l'administration</h1>
        <p>Envoie un message privé directement au créateur ou à un administrateur. Tes échanges restent visibles uniquement par les participants concernés.</p>
      </section>

      <section className="messagesShell">
        <aside className="contactsPanel">
          <h2>Contacts</h2>
          {staff.length === 0 && <p className="muted">Aucun administrateur disponible pour le moment.</p>}
          {staff.map((person) => (
            <button
              key={person.id}
              type="button"
              className={selectedId === person.id ? "contactItem selected" : "contactItem"}
              onClick={() => setSelectedId(person.id)}
            >
              <span className="contactAvatar">{(person.username || person.email).slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{person.username || person.email}</strong>
                <small>{person.role === "creator" ? "Créateur" : "Administrateur"}</small>
              </span>
            </button>
          ))}
        </aside>

        <div className="chatPanel">
          {selectedStaff ? (
            <>
              <div className="chatHeader">
                <div>
                  <strong>{selectedStaff.username || selectedStaff.email}</strong>
                  <span>{selectedStaff.role === "creator" ? "Créateur AdPoints" : "Administrateur AdPoints"}</span>
                </div>
                <button type="button" className="chatRefresh" onClick={refreshMessages}>Actualiser</button>
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
                  placeholder={`Écrire à ${selectedStaff.username || selectedStaff.email}...`}
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

      {status && <div className="profileMessage error">{status}</div>}
    </main>
  );
}
