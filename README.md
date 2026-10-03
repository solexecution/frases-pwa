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
3. Commit and push. Open apps reload themselves to the new version.

Unchanged audio is reused on update instead of being downloaded again.

## Add phrases
1. Add lines to `phrases.json` (or to `new` in `pairs_src.json`, then link them in `pairs`): `["Nueva frase","New phrase","Work","MX"]`. The 4th item is optional.
   Category must be one in `CATS` in `app.js` (add a new one there to create a group).
2. `python build_pairs.py` appends the `new` phrases and rebuilds `pairs.json` (it stops if a phrase has no partner or a name is misspelled).
3. `python gen_audio.py` renders normal, slow and English clips and trims silence (needs ffmpeg and `pip install edge-tts`).
4. `python build_align.py` rebuilds word pairing (hand-authored pairs live in `SRC`).
5. Bump `VER`, commit, push.

Missions: edit `missions_src.json`, run `python gen_missions.py`.

## Voices
Spanish: es-MX-DaliaNeural. English: en-US-AriaNeural. Change in `gen_audio.py`, then `python gen_audio.py --force` and bump `AV`.
Mission characters: es-MX-JorgeNeural (male), es-US-PalomaNeural (female).

## Daily push reminder (ntfy)
`.github/workflows/daily-nudge.yml` posts once a day at 08:30 (UTC-5; the cron is in UTC, edit as needed). The message
shows only the English cue of the phrase of the day, never the Spanish, and says nothing about whether you practised.
The private topic is the repo secret `NTFY_TOPIC`. On the phone: install the ntfy app and subscribe to that topic
(Me > Daily push reminder helps). `.github/workflows/keepalive.yml` makes an empty commit monthly so GitHub does not
pause the schedule after 60 inactive days.

## Offline
The service worker caches the app and all normal audio on install, and the page downloads the slow and English audio
in the background. Today shows "Fully offline" when everything is on the phone.
