# AdPoints

## IPTV browser compatibility service

The Next.js site can try native HLS first. Some authorized streams used by native IPTV apps are MPEG-TS or use codecs that Safari cannot decode directly.

This repository now includes an optional FFmpeg compatibility service in `/transcoder`. It converts an authorized source into HLS (H.264 + AAC), which is broadly compatible with Safari.

### Deploy the transcoder on a VPS

1. Copy this repository to a Linux server with Docker.
2. Edit `docker-compose.transcoder.yml`:
   - set a long `TRANSCODER_SECRET`
   - set `ALLOWED_UPSTREAM_HOSTS` to the hostname(s) you are authorized to stream
3. Run:
   `docker compose -f docker-compose.transcoder.yml up -d --build`
4. Configure the Next.js deployment environment:
   - `IPTV_TRANSCODER_URL`
   - `IPTV_TRANSCODER_PUBLIC_URL`
   - `IPTV_TRANSCODER_SECRET`

Vercel is used for the website, but continuous FFmpeg transcoding must run on a dedicated server/container.

Only use this with streams you are authorized to access and distribute.
