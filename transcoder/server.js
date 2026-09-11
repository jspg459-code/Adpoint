import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import { mkdir, rm, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const app = express();
app.use(cors());
app.use(express.json({ limit: "32kb" }));

const PORT = Number(process.env.PORT || 8080);
const ROOT = process.env.HLS_ROOT || "/tmp/adpoints-hls";
const SECRET = process.env.TRANSCODER_SECRET || "";
const ALLOWED = (process.env.ALLOWED_UPSTREAM_HOSTS || "")
  .split(",").map(v => v.trim()).filter(Boolean);

const sessions = new Map();

function authorized(req) {
  return SECRET && req.get("authorization") === "Bearer " + SECRET;
}

function validateSource(value) {
  const url = new URL(value);
  if (!["http:","https:"].includes(url.protocol)) throw new Error("Protocole non autorisé.");
  if (ALLOWED.length && !ALLOWED.includes(url.hostname)) {
    throw new Error("Serveur source non autorisé.");
  }
  return url.toString();
}

async function stopSession(id) {
  const s = sessions.get(id);
  if (s?.proc && !s.proc.killed) s.proc.kill("SIGTERM");
  sessions.delete(id);
  await rm(path.join(ROOT,id), { recursive:true, force:true });
}

app.get("/health", (_req,res) => res.json({ ok:true }));

app.post("/session", async (req,res) => {
  if (!authorized(req)) return res.status(401).json({ error:"Non autorisé." });

  try {
    const source = validateSource(req.body?.source || "");
    const id = randomUUID();
    const dir = path.join(ROOT,id);
    await mkdir(dir,{ recursive:true });

    const output = path.join(dir,"index.m3u8");
    const args = [
      "-hide_banner","-loglevel","warning",
      "-i",source,
      "-map","0:v:0?","-map","0:a:0?",
      "-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p",
      "-c:a","aac","-b:a","128k",
      "-f","hls","-hls_time","4","-hls_list_size","6",
      "-hls_flags","delete_segments+append_list",
      output
    ];

    const proc = spawn("ffmpeg",args,{ stdio:["ignore","ignore","pipe"] });
    sessions.set(id,{ proc, created:Date.now() });
    proc.on("exit",() => sessions.delete(id));

    res.json({ id, url: "/hls/" + id + "/index.m3u8" });
  } catch (e) {
    res.status(400).json({ error:e instanceof Error ? e.message : "Source invalide." });
  }
});

app.use("/hls", express.static(ROOT, {
  setHeaders(res,file) {
    if (file.endsWith(".m3u8")) res.setHeader("Content-Type","application/vnd.apple.mpegurl");
    if (file.endsWith(".ts")) res.setHeader("Content-Type","video/mp2t");
    res.setHeader("Cache-Control","no-store");
  }
}));

setInterval(async () => {
  const now=Date.now();
  for (const [id,s] of sessions) {
    if (now-s.created > 30*60*1000) await stopSession(id);
  }
  try {
    const dirs=await readdir(ROOT);
    for (const id of dirs) {
      const p=path.join(ROOT,id);
      const info=await stat(p);
      if (now-info.mtimeMs > 60*60*1000) await rm(p,{recursive:true,force:true});
    }
  } catch {}
},60*1000).unref();

await mkdir(ROOT,{recursive:true});
app.listen(PORT,()=>console.log("Transcoder listening on",PORT));
