# Frases: learn Spanish every day

Offline PWA with audio, 300 phrases, daily sessions, missions and push reminders.
Live at https://solexecution.github.io/frases-pwa/

## What's inside
| Screen | What it does |
|---|---|
| Today | Daily session (spaced repetition), Event prep (3-min mixer drill), Pocket mode, phrase of the day, focus picker, offline status |
| Missions | 8 scripted conversations (networking, solar sales, dates, restaurant, lost). Voiced characters, pick the right reply, earn stars |
| Listen | Hands-free player for the car or a walk: slow, English first, Echo (pause for you to repeat), repeat, loop. Lock-screen controls |
| Browse | Search, groups, tap to hear, mark as known |
| Me | XP, level, streak, 7-day chart, badges, settings |

Phrase pairs: every phrase is linked to its opposite, alternative, answer or "goes with" partner (for example
Para llevar and Para comer aquí). Partners show in Browse, in the intro screen, in Listen (turn on Pairs to hear them
after each phrase) and as a quiz question.

Learning loop: new phrases are introduced, then quizzed (listen, pick, fill the blank, build the sentence),
then a say-it round. Misses come back sooner (boxes at 1, 2, 4, 8, 16, 32 days). XP, combos and a daily streak
(with a streak freeze earned every 7 days) keep it fun.

## Release a new version
1. Edit what you need.
2. Bump `VER` in `ver.js` (for example `v12` to `v13`). Bump `AV` only if you regenerate existing audio.
3. Commit and push. Open apps reload themselves to the new version.

Install is small because `AV` unchanged means already-downloaded audio is reused.

## Add phrases
1. Add lines to `phrases.json` (or to `new` in `pairs_src.json`, then link them in `pairs`): `["Nueva frase","New phrase","Work","MX"]`. The 4th item is optional.
   Category must be one in `CATS` in `app.js` (add a new one there to create a group).
2. `python build_pairs.py` appends the `new` phrases and rebuilds `pairs.json` (it stops if a phrase has no partner or a name is misspelled).
3. `python gen_audio.py` renders normal, slow and English clips and trims silence (needs ffmpeg and `pip install edge-tts`).
4. `python build_align.py` rebuilds word pairing (hand-authored pairs live in `SRC`).
5. Bump `VER`, commit, push.

## Voices
Spanish: es-MX-DaliaNeural. English: en-US-AriaNeural. Change in `gen_audio.py`, then `python gen_audio.py --force` and bump `AV`.
Mission characters: es-MX-JorgeNeural (male), es-US-PalomaNeural (female). Edit `missions_src.json`, run `python gen_missions.py`.

## Daily push reminders (ntfy)
`.github/workflows/daily-nudge.yml` posts to ntfy.sh at 08:30 and 20:00 (UTC-5). Times are in UTC cron, edit as needed.
The private topic is the repo secret `NTFY_TOPIC`. On the phone: install the ntfy app, subscribe to that topic
(Me > Daily push reminders helps). Scheduled workflows pause after 60 days of no repo activity.

## Offline
The service worker caches the app and all normal audio on install, and the page downloads the slow and English audio
in the background. Today shows "Fully offline" when everything is on the phone.
