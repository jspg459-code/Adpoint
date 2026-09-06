"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setEmail(user.email || "");
    const { data, error } = await supabase.from("profiles").select("username,points_balance").eq("id", user.id).single();
    if (!error && data) {
      const name = data.username || "";
      setUsername(name); setSavedUsername(name); setPoints(data.points_balance ?? 0);
    }
  }

  const cleanUsername = username.trim();
  const changed = cleanUsername !== savedUsername;
  const valid = cleanUsername.length >= 3 && cleanUsername.length <= 24;

  async function save() {
    if (!valid) { setMessage({type:"error",text:"Le pseudo doit contenir entre 3 et 24 caractères."}); return; }
    if (!changed) { setMessage({type:"success",text:"Aucune modification à enregistrer."}); return; }
    setSaving(true); setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { error } = await supabase.from("profiles").update({username:cleanUsername}).eq("id",user.id);
      if (error) throw error;
      setUsername(cleanUsername); setSavedUsername(cleanUsername);
      setMessage({type:"success",text:"Pseudo enregistré avec succès !"});
    } catch (error:any) {
      setMessage({type:"error",text:error?.message || "Impossible d’enregistrer le pseudo. Réessaie."});
    } finally { setSaving(false); }
  }

  async function logout(){ await supabase.auth.signOut(); router.replace("/"); }
  const initial = useMemo(() => (savedUsername || email || "A").charAt(0).toUpperCase(), [savedUsername,email]);

  return <main className="dash profileModern">
    <header className="modernHeader">
      <Link href="/dashboard" className="modernBrand"><span className="modernCoin"><i/></span><span><b>Ad</b><strong>Points</strong><small>Regarde. Gagne. Profite.</small></span></Link>
      <nav className="modernNav">
        <Link href="/dashboard" className="navPill"><span className="navIcon">⌂</span><span>Tableau de bord</span></Link>
        <Link href="/profile" className="navPill active"><span className="navIcon">♙</span><span>Mon profil</span></Link>
        <button className="bellButton" aria-label="Notifications">♟<i/></button>
        <button className="avatarButton" onClick={logout} title="Se déconnecter">{initial}</button>
      </nav>
    </header>

    <section className="profileModernPage"><div className="profileModernCard">
      <div className="profileHero">
        <div><span className="eyebrow modernEyebrow">♟ &nbsp; MON COMPTE</span><h1>Mon <b>profil</b></h1><p>Modifie ton pseudo à tout moment.<br/>C’est lui qui sera affiché sur AdPoints.</p></div>
        <div className="bigAvatar">{initial}<button aria-label="Modifier le profil">✎</button></div>
      </div>

      <div className="fieldBlock"><label>Pseudo</label>
        <div className={"usernameInput "+(valid?"valid":"")}><input value={username} onChange={e=>{setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g,""));setMessage(null);}} placeholder="Ton pseudo" maxLength={24}/>{valid&&<span>✓</span>}</div>
        {valid&&<div className="available">✓ <b>Pseudo disponible !</b></div>}
      </div>

      <button className="saveModern" onClick={save} disabled={saving||!valid}><span>▣</span>{saving?"Enregistrement...":"Enregistrer les modifications"}<b>→</b></button>
      {message&&<div className={"profileMessage "+message.type}>{message.type==="success"?"✓":"!"} {message.text}</div>}
      <div className="profileDivider"/>

      <div className="infoRows">
        <div className="infoModern"><span className="infoIcon">✉</span><div><small>Adresse e-mail</small><strong>{email}</strong></div><em>▣ &nbsp; Non modifiable</em></div>
        <div className="infoModern"><span className="infoIcon greenIcon">▤</span><div><small>Solde actuel</small><strong>{points} AdPoints</strong></div><Link href="/dashboard">▥ &nbsp; Voir l’historique　›</Link></div>
      </div>

      <div className="privacyNote"><span>ⓘ</span><p>Ton pseudo est visible par les autres utilisateurs.<br/>Ton e-mail reste privé et n’est jamais affiché publiquement.</p></div>
    </div></section>
  </main>;
}