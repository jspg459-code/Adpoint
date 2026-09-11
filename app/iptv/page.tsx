"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Credentials = { server:string; username:string; password:string };
type Category = { category_id:string; category_name:string };
type Stream = { stream_id:number; name:string; stream_icon?:string; category_id?:string; direct_source?:string; container_extension?:string };
type Candidate = { url:string; isHls:boolean; label:string };

async function api(credentials:Credentials, action="player_api", categoryId?:string) {
  const res=await fetch("/api/xtream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...credentials,action,categoryId})});
  const json=await res.json();
  if(!res.ok) throw new Error(json.error||"Erreur de connexion.");
  return json.data;
}

function proxied(url:string){ return "/api/iptv-proxy?url="+encodeURIComponent(url); }

export default function IPTVPage(){
  const [credentials,setCredentials]=useState<Credentials>({server:"",username:"",password:""});
  const [connected,setConnected]=useState(false);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [categories,setCategories]=useState<Category[]>([]);
  const [streams,setStreams]=useState<Stream[]>([]);
  const [selectedCategory,setSelectedCategory]=useState("");
  const [selected,setSelected]=useState<Stream|null>(null);
  const [search,setSearch]=useState("");
  const [playerIndex,setPlayerIndex]=useState(0);
  const [playerStatus,setPlayerStatus]=useState("");
  const [playerError,setPlayerError]=useState("");
  const [transcodedUrl,setTranscodedUrl]=useState("");
  const [transcoding,setTranscoding]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const hlsRef=useRef<any>(null);

  const server=useMemo(()=>credentials.server.trim().replace(/\/+$/,""),[credentials.server]);

  const candidates=useMemo<Candidate[]>(()=>{
    if(!selected||!server) return [];
    const user=encodeURIComponent(credentials.username.trim());
    const pass=encodeURIComponent(credentials.password.trim());
    const base=server+"/live/"+user+"/"+pass+"/"+selected.stream_id;
    const m3u8=base+".m3u8";
    const ext=selected.container_extension ? base+"."+selected.container_extension : "";
    const direct=selected.direct_source?.trim()||"";
    const ts=base+".ts";
    const list:Candidate[]=[];
    const add=(url:string,label:string,isHls:boolean)=>{
      if(url&&!list.some(x=>x.url===url)) list.push({url,label,isHls});
    };
    add(proxied(m3u8),"HLS via compatibilité",true);
    add(m3u8,"HLS direct",true);
    add(direct,"Source du serveur",/\.m3u8(?:$|[?#])/i.test(direct));
    add(ext,"Format déclaré",/\.m3u8(?:$|[?#])/i.test(ext));
    add(ts,"Flux MPEG-TS",false);
    if(transcodedUrl) add(transcodedUrl,"Version compatible navigateur",true);
    return list;
  },[selected,server,credentials.username,credentials.password,transcodedUrl]);

  const active=candidates[playerIndex];

  useEffect(()=>{
    if(!selected) return;
    setPlayerIndex(0); setPlayerError(""); setPlayerStatus(""); setTranscodedUrl("");
  },[selected?.stream_id]);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video||!active) return;
    let cancelled=false;

    const start=async()=>{
      setPlayerError("");
      setPlayerStatus("Chargement : "+active.label+"…");
      if(hlsRef.current){ hlsRef.current.destroy(); hlsRef.current=null; }
      video.pause(); video.removeAttribute("src"); video.load();

      try{
        if(active.isHls){
          if(video.canPlayType("application/vnd.apple.mpegurl")){
            video.src=active.url;
            video.load();
            await video.play().catch(()=>undefined);
            if(!cancelled) setPlayerStatus("Lecture HLS native.");
            return;
          }
          const mod=await import("hls.js");
          const Hls=mod.default;
          if(Hls.isSupported()){
            const hls=new Hls({enableWorker:true,lowLatencyMode:false,backBufferLength:30});
            hlsRef.current=hls;
            hls.on(Hls.Events.MEDIA_ATTACHED,()=>hls.loadSource(active.url));
            hls.on(Hls.Events.MANIFEST_PARSED,()=>{ if(!cancelled){setPlayerStatus("Lecture en cours."); video.play().catch(()=>undefined);} });
            hls.on(Hls.Events.ERROR,(_e,data)=>{
              if(data.fatal){ hls.destroy(); hlsRef.current=null; if(!cancelled) setPlayerIndex(i=>i+1); }
            });
            hls.attachMedia(video);
            return;
          }
        }
        video.src=active.url;
        video.load();
        await video.play().catch(()=>undefined);
      }catch{
        if(!cancelled) setPlayerIndex(i=>i+1);
      }
    };

    start();
    return()=>{cancelled=true; if(hlsRef.current){hlsRef.current.destroy();hlsRef.current=null;}};
  },[active?.url,active?.isHls]);

  useEffect(()=>{
    if(!selected||transcodedUrl||transcoding||playerIndex<candidates.length) return;
    const source=candidates.find(c=>!c.isHls)?.url;
    if(!source){ setPlayerError("Aucune source compatible n'a été trouvée."); return; }

    setTranscoding(true);
    setPlayerStatus("Préparation d'une version compatible Safari…");
    fetch("/api/transcode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source})})
      .then(async r=>{const j=await r.json(); if(!r.ok) throw new Error(j.error||"Transcodage indisponible."); return j;})
      .then(j=>{setTranscodedUrl(j.url); setPlayerIndex(0); setPlayerStatus("Version compatible prête.");})
      .catch(e=>setPlayerError(e instanceof Error?e.message:"Impossible de rendre ce flux compatible."))
      .finally(()=>setTranscoding(false));
  },[playerIndex,candidates.length,selected,transcodedUrl,transcoding]);

  async function connect(){
    setMessage("");
    if(!server||!credentials.username.trim()||!credentials.password.trim()){setMessage("Remplis tous les champs.");return;}
    setLoading(true);
    try{
      const creds={...credentials,server};
      const account=await api(creds);
      if(!account?.user_info?.auth) throw new Error("Connexion refusée par le serveur.");
      const [cats,live]=await Promise.all([api(creds,"get_live_categories"),api(creds,"get_live_streams")]);
      setCategories(Array.isArray(cats)?cats:[]);
      setStreams(Array.isArray(live)?live:[]);
      setConnected(true);
      setMessage("✅ Connecté : "+(Array.isArray(live)?live.length:0)+" chaînes.");
    }catch(e){setMessage("❌ "+(e instanceof Error?e.message:"Connexion impossible."));}
    finally{setLoading(false);}
  }

  async function chooseCategory(id:string){
    setSelectedCategory(id); setLoading(true);
    try{const d=await api({...credentials,server},"get_live_streams",id);setStreams(Array.isArray(d)?d:[]);}
    catch{setMessage("❌ Impossible de charger cette catégorie.");}
    finally{setLoading(false);}
  }

  const visible=streams.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase()));

  return <main className="dash" style={{maxWidth:1400,margin:"0 auto",padding:"28px 18px 90px"}}>
    <header className="modernHeader cleanTopHeader">
      <Link href="/dashboard" className="textBrand">Ad<span>Points</span></Link>
      <nav className="cleanTextNav"><Link href="/dashboard">Tableau de bord</Link><Link href="/iptv">IPTV</Link><Link href="/profile">Mon profil</Link></nav>
    </header>

    {!connected ? <section className="profileBox" style={{marginTop:28,maxWidth:760,marginLeft:"auto",marginRight:"auto"}}>
      <span className="eyebrow">XTREAM PLAYER</span><h1>📺 Connecter mon service</h1>
      <p className="muted">Utilise uniquement un service auquel tu es autorisé à accéder.</p>
      <div style={{display:"grid",gap:14,marginTop:24}}>
        <input placeholder="https://mon-serveur.example:8080" value={credentials.server} onChange={e=>setCredentials({...credentials,server:e.target.value})}/>
        <input placeholder="Nom d’utilisateur" value={credentials.username} onChange={e=>setCredentials({...credentials,username:e.target.value})}/>
        <input type="password" placeholder="Mot de passe" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})}/>
        <button onClick={connect} disabled={loading}>{loading?"Connexion…":"🔌 Se connecter"}</button>
      </div>{message&&<p className="notice" style={{marginTop:16}}>{message}</p>}
    </section> : <>
      <section className="profileBox" style={{marginTop:28}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div><span className="eyebrow">EN DIRECT</span><h1 style={{margin:"6px 0"}}>📺 IPTV Player</h1></div>
          <button onClick={()=>{if(hlsRef.current)hlsRef.current.destroy();setConnected(false);setSelected(null);setStreams([]);}}>Déconnexion</button>
        </div>
        {selected ? <div style={{marginTop:18}}>
          <h2>{selected.name}</h2>
          <video ref={videoRef} controls playsInline preload="metadata" style={{width:"100%",maxHeight:650,background:"#000",borderRadius:18}} onPlaying={()=>setPlayerStatus("▶️ Lecture en cours")} onError={()=>setPlayerIndex(i=>i+1)}/>
          {playerStatus&&<p className="muted" style={{marginTop:10}}>{playerStatus}</p>}
          {active&&<p className="muted">Essai {Math.min(playerIndex+1,candidates.length)}/{candidates.length} • {active.label}</p>}
          {transcoding&&<div className="notice" style={{marginTop:12}}>⏳ Conversion en HLS compatible avec Safari…</div>}
          {playerError&&<div className="notice" style={{marginTop:12}}>⚠️ {playerError}</div>}
        </div> : <div style={{marginTop:18,minHeight:280,borderRadius:18,background:"#000",display:"grid",placeItems:"center"}}><p>Choisis une chaîne pour commencer ▶️</p></div>}
      </section>

      <section style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:20,marginTop:20}}>
        <aside className="profileBox"><h2>Catégories</h2>
          <button onClick={async()=>{setSelectedCategory("");setLoading(true);try{const d=await api({...credentials,server},"get_live_streams");setStreams(Array.isArray(d)?d:[]);}finally{setLoading(false);}}} style={{width:"100%",marginBottom:8}}>Toutes les chaînes</button>
          <div style={{display:"grid",gap:8}}>{categories.map(c=><button key={c.category_id} onClick={()=>chooseCategory(c.category_id)} style={{textAlign:"left",opacity:selectedCategory===c.category_id?1:.75}}>{c.category_name}</button>)}</div>
        </aside>
        <section className="profileBox"><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><h2>Chaînes {loading?"⏳":""}</h2><input placeholder="🔎 Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:300}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14,marginTop:18}}>
            {visible.slice(0,500).map(stream=><button key={stream.stream_id} onClick={()=>setSelected(stream)} style={{padding:0,overflow:"hidden",textAlign:"left"}}>
              <div style={{height:110,background:"#111",display:"grid",placeItems:"center"}}>{stream.stream_icon?<img src={stream.stream_icon} alt="" style={{maxWidth:"70%",maxHeight:80,objectFit:"contain"}}/>:"📺"}</div>
              <div style={{padding:12,fontWeight:700}}>{stream.name}</div>
            </button>)}
          </div>
        </section>
      </section>
    </>}
  </main>;
}
