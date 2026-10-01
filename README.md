# Frases — offline Spanish PWA

Installable, fully-offline Spanish phrase trainer with bundled audio.

Voice: es-MX-DaliaNeural (female). Change it in `gen_audio.py`.

## Install on Android
Open the site in Chrome, tap **⬇ Install app** (or menu ⋮ → Install app). It lands on
your home screen and runs full-screen, offline.

## Daily reminders
Tap **🔔 Daily reminder** and allow notifications. Uses the Periodic Background Sync API:
once installed, Chrome on Android wakes the service worker roughly once a day and shows a
"phrase of the day" notification — no server, fully offline. Timing is browser-controlled
(best-effort daily, based on how much you use the app), not a fixed alarm. Tap again to turn off.

## Two modes
- **Browse** — search, filter by group, tap a phrase to hear it, mark as known.
- **Listen** — hands-free autoplay for car / walking. Plays the filtered group
  continuously with big Prev / Play-Pause / Next controls. Keeps playing with the
  screen locked and responds to Bluetooth / car / headphone / lock-screen controls
  (Media Session API). Options: English first (device TTS), Repeat ×2, Loop, and a
  gap-length toggle. Space / ← / → work on desktop. Whatever group + search you set
  defines the play queue; "To learn" plays only the not-yet-known phrases.

## Files
- `index.html`, `app.js` — the app (system fonts, no external dependencies)
- `phrases.json` — the phrase list (single source of truth)
- `audio/NNN.mp3` — one pre-generated clip per phrase (es-MX, edge-tts)
- `sw.js` — service worker; precaches everything for offline use
- `manifest.webmanifest`, `icon.svg`, `icon-180/192/512.png` — install metadata
- `gen_audio.py` — regenerates the MP3s from `phrases.json`

## Run / host
A service worker needs http(s), not `file://`.

Locally:
```
python -m http.server 8080
```
then open http://localhost:8080 and Add to Home Screen.

Hosting: drop the whole folder on any static host — GitHub Pages, Netlify drop, Cloudflare Pages, etc. Once opened online, it caches and then works with no network.

## Add new phrases
1. Add a line to `phrases.json`:
   `["Nueva frase","New phrase","Work","MX"]` — the 4th item (note) is optional.
2. Regenerate audio (needs internet, only for the new clips):
   ```
   pip install edge-tts
   python gen_audio.py
   ```
   `--force` re-renders every clip. Removing a phrase deletes its orphaned MP3.
3. Bump `CACHE` in `sw.js` (e.g. `frases-v1` -> `frases-v2`) so installed copies update.

A phrase with no matching MP3 still works: it falls back to the device's built-in text-to-speech.

## Change the voice
Edit `VOICE` / `RATE` in `gen_audio.py` (e.g. `es-MX-DaliaNeural`), then `python gen_audio.py --force`.
List voices: `edge-tts --list-voices`.
