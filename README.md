# Frases: learn Spanish every day

Offline PWA with audio, 336 phrases, daily review sessions, missions and one daily push reminder.
Live at https://solexecution.github.io/frases-pwa/

There is no points, level, badge or streak layer. Progress is shown as facts: what is due, what was recalled
on later days, first-try accuracy, minutes, and days practised.

## Screens
| Screen | What it does |
|---|---|
| Today | One button for the right session (review-first, catch-up, welcome-back or extra practice), Just 2 minutes, Event prep, Pocket mode, phrase-of-the-day cue, focus for new phrases, offline status |
| Missions | 8 scripted conversations with voiced characters. You hear the line first; the text stays hidden until you reply |
| Listen | Hands-free player for the car or a walk: speed slider, word gaps, English first, Echo (pause for you to repeat), pairs, loop. Lock-screen controls |
| Browse | Search, groups, tap to hear, partner phrases |
| Me | Progress counts, 14-day rows, backup export and import, session length, push set-up |

## How learning works
- **Review first.** Due phrases from the whole deck come first, oldest first. New phrases fill the time that is left
  (at least 2 and at most 5 a day). If the backlog is more than 1.5 times the session budget the app switches to a
  catch-up session with no new phrases and spreads the overload over the coming days.
- **Credit rules** (`srs.js`): a phrase moves up the ladder (1, 2, 4, 8, 16, 32 days) only on a committed answer to a
  phrase that is due, once per day, in an eligible format with no Not sure. Early reviews and extra practice never move a
  phrase up; a miss sends it back to tomorrow, once a day. Box 0 and 1 accept listen or pick; box 2 and above need a build
  (unless the phrase has one word). Carried-over phrases show as unverified until they pass a harder format.
- **Quiz hygiene.** Lures avoid a phrase's partners, near-duplicates and equal translations and match its
  sentence type and punctuation; the build bank is lowercase with decoys; every choice has a Not sure button; the right answer is
  always shown and played after you answer.
- **New phrases** get an intro with audio, then their first cold test a few steps later (about 5 in a full session).
- **Say-it round** sits mid-session: say it aloud, tap I said it, then Got it or Missed it. It can only hold or demote.
- **Review log** (`frases-log`, last 5000 answers) stores time, format, result, response time and box before and after.
  Export it from Me > Backup; your progress lives only on the phone.

## Tests
`node test/srs.test.js` checks the credit rules and simulates 200 days at 100, 90, 80 and 70 percent accuracy.

## Release a new version
1. Edit what you need.
2. Bump `VER` in `ver.js` (for example `v21` to `v22`). Bump `AV` only if you regenerate existing audio.
3. Commit and push. Every open or returning app checks for a new version on load, on return to the app, when it comes back online and every 10 minutes, then refreshes itself. It waits until a quiz or Listen playback is finished so nothing is interrupted, and shows "Updated to vNN" afterwards. Me > Check for updates does the same on demand. If `VER` is not bumped, installed apps will not update.

The app shell and audio live in separate caches. A new version installs only the small app files (a second or two) and takes over straight away; audio sits in its own cache named by `AV`, so a release never re-downloads it, and the page fills any missing clips quietly in the background afterwards. Clips are tracked per file: `audio/index.json` holds a content hash for every clip, the page compares it with the copy saved after the last complete download and re-fetches only clips whose hash changed (and any missing ones). The manifest is always fetched from the network. Do not bump `AV` any more: that renames the audio cache and makes everyone download everything again. The current version is shown on the Me tab icon.

## Stories
Missions > Stories (or the Today tile Story reading) holds short graded stories shown in a focus reader. The current sentence sits large inside a magnifier box; the current word or fixed expression is highlighted, the rest dimmed, with its English or Slovak meaning shown big underneath and the whole-sentence translation below. Play walks through the sentence one chunk at a time: the Spanish chunk (Dalia, slowed), then the translation in a second voice (Aria for English, Viktoria for Slovak), a pause, the next chunk, and optionally the whole sentence once smoothly at the end. Speed (Slow, Normal, Fast) changes the playback rate and the pauses. The five round buttons are previous sentence, previous word, play/pause, next word, next sentence; tapping a word in the box jumps to it. Voice turns the translation voice on or off, Whole turns the closing whole-sentence playback on or off, and Text shows the story as a plain two-language list. Read aloud listens through the phone's Spanish speech recognition (needs a connection), marks the words it heard in green and the missed ones in red, accepts spoken numbers as digits. Stories never change the review schedule; `prof.stories` counts finished readings.
Audio: sentences are `audio/st/<id>_NN.ogg`; chunks are `audio/ck/{es,en,sk}/<hash>.ogg`, named by a hash of the cleaned text so they are shared between stories and stay stable when stories are added. `stories.json` carries the three hashes after each chunk's three texts.
The list is grouped: Marek in Mérida (everyday life) and Maya legends from the villages (aluxes, Chaac, chechén and chacá, the ceiba, the Xtabay, balam, the milpa, the melipona bee, cenotes, Hanal Pixán, the tunkuluchú, Kukulkán, the toh bird). The Maya stories were written strictly from sourced fact sheets kept in `stories_src/facts/` (summary, facts, Maya terms, source URLs, cautions about what was left out on purpose such as sacrifice, death details and anything not supported by sources) and checked for cultural accuracy as well as language. Each story has a `group` field.
To add or change stories: write `stories_src/<id>.json` (check it with `python validate_story.py stories_src/<id>.json`; format in that script: sentences with `es`, `en`, `sk` and chunk glosses `w`), add the id to `ORDER` in `gen_stories.py`, run `python gen_stories.py` (stops if any listed story file is missing; builds `stories.json` and renders the sentence and chunk clips under `audio/st` and `audio/ck`). New clips are fetched per file by the manifest.

## Slovak mode
The EN/SK pill in the header (or Me > Translate from) switches the learning language between English and Slovak. In Slovak mode every prompt, answer option, mission line and the Listen translation track use the Slovak text in `sk.json` (parallel to `phrases.json`, one entry per phrase) and its audio in `audio/sk` (voice sk-SK-ViktoriaNeural, rendered by `python gen_audio.py`). Word-by-word highlighting is English-only. Mission text is in `sk_m.json`. Phrases you add (dictated or typed) are saved in the active language and fall back to the other one if empty. When adding phrases, add the Slovak line to `sk.json` too (the app falls back to English for any missing entry).

## Core words
A group called Core holds 43 of the most common words (yo, tú, me, te, conmigo, soy, quiero, aquí, qué, porque...) each with two short sentences. Two Core items are introduced per day ahead of other groups. A sentence is only introduced after its word has reached box 2. Today > Core words drill is a fill-in-the-missing-word practice (never promotes, a miss reschedules like any other). Edit `CORE` in `build_core.py`, then run `python build_core.py`, `python build_pairs.py`, `python gen_audio.py`, `python build_align.py`.

## Add phrases
In the app: Browse > Add phrase. Tap the round mic button (bottom right on every screen, top right in Listen) or long-press the app icon and choose Dictate a phrase, then say it in your language or in Spanish (the I say it in switch at the top of the Add screen, remembered), and it is transcribed (phone speech recognition, needs a connection), translated (Spanish phrases get the English or Slovak translation, and Grok fills both languages when set up), saved and spoken back. Or type English; it is translated online (MyMemory), edit the Spanish if needed and save. The phrase lives in a group called Mine, is taught like any other, is spoken with the phone voice, and is included in the backup. Translating needs a connection; saving does not.

Smart translation: Me > Smart translation (Grok), paste an xAI API key. It is stored only on the phone (never in the repo or the backup) and the app calls api.x.ai directly; the model is picked automatically from the account's list. The Spanish is natural Mexican, speech mishearings are corrected, and if Grok fails the free MyMemory translator is used with a Mexican word-swap list (`SWAPS` in `app.js`). Dictated phrases show an Undo for 9 seconds.

In the repo:
1. Add lines to `phrases.json` (or to `new` in `pairs_src.json`, then link them in `pairs`): `["Nueva frase","New phrase","Work","MX"]`. The 4th item is optional.
   Category must be one in `CATS` in `app.js` (add a new one there to create a group).
2. `python build_pairs.py` appends the `new` phrases and rebuilds `pairs.json` (it stops if a phrase has no partner or a name is misspelled).
3. `python gen_audio.py` renders the normal, slow, English and Slovak clips (needs ffmpeg and `pip install -U edge-tts`). The original 48 kbps studio audio is cached outside the repo in `../raw_audio` and encoded once to Opus (`.ogg`, 64 kbps mono, 24 kHz) with silence trimmed at the start and a short natural tail; change `BITRATE` in `audiolib.py` and run `python gen_audio.py --force` to re-encode without downloading again. Needs the network for new text only.
4. `python build_align.py` rebuilds word pairing (hand-authored pairs live in `SRC`).
5. Bump `VER`, commit, push.

Gender: the learner is a man, so self-descriptions are masculine. A phrase with `"x"` as its 5th field (for example the feminine "Encantada de conocerte") is shown in Browse but never taught. Phrases addressed to a man or a woman (for example "¿Estás soltero?" and "¿Estás soltera?") are both taught.

Missions: edit `missions_src.json`, run `python gen_missions.py`.

## Voices
Spanish: es-MX-DaliaNeural. English: en-US-AriaNeural. Change in `gen_audio.py`, delete `../raw_audio` if the voice or rate changed, then `python gen_audio.py --force` and bump `AV`.
Mission characters: es-MX-JorgeNeural (male), es-US-PalomaNeural (female).

## Daily push reminder (ntfy)
`.github/workflows/daily-nudge.yml` posts once a day at 08:30 (UTC-5; the cron is in UTC, edit as needed). The message
shows only the English cue of the phrase of the day, never the Spanish, and says nothing about whether you practised.
The private topic is the repo secret `NTFY_TOPIC`. On the phone: install the ntfy app and subscribe to that topic
(Me > Daily push reminder helps). `.github/workflows/keepalive.yml` makes an empty commit monthly so GitHub does not
pause the schedule after 60 inactive days.

## Background playback
Listen never leaves the audio element idle: every pause between clips (word gap, echo wait, pair gap) is played as a near-silent clip of the right length, so the phone keeps treating the app as a music player. It keeps running with the screen off or another app in front, shows the lock-screen and notification controls (play/pause, next, previous) with the phrase and its English, and no timer is needed to advance in the background.

Chrome on Android treats media shorter than 5 seconds as a transient sound with no background session, and every clip here is shorter than that, so while Listen runs a second hidden element loops a 10-second near-silent track to keep a real media session (and the notification) alive. Resume attempts after a system pause are capped at 6 in a row.

If the system pauses the audio (another app, a notification, Bluetooth), Listen tries to resume it instead of stopping; only the Pause button, the notification Pause, or a refused resume stops it. Me > Playback log shows the last 40 player events with whether the screen was showing, to diagnose phones that still stop.

## Offline
The service worker caches the app and all normal audio on install, and the page downloads the slow and English audio
in the background. Today shows "Fully offline" when everything is on the phone.
