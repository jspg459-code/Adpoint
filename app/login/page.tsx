"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage(){
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault(); setMessage(""); setLoading(true);
    const {error}=await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if(error){setMessage(error.message);return;}
    router.replace("/dashboard");
  }

  return <main className="authPage"><Link className="back" href="/">← Retour à AdPoints</Link><section className="authCard"><div className="coinBig">◉</div><h1>Connexion</h1><p>Content de te revoir.</p><form onSubmit={submit}><input type="email" placeholder="Adresse e-mail" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required/><button disabled={loading}>{loading?"Connexion...":"Se connecter"}</button></form>{message&&<div className="error">{message}</div>}<div className="switch">Pas encore de compte ? <Link href="/signup">Créer mon compte</Link></div></section></main>;
}