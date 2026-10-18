import asyncio, hashlib, json, re, sys
from pathlib import Path
from audiolib import render, key, EXT
from gen_audio import clean, VOICE, RATE, EN_VOICE, EN_RATE, SK_VOICE, SK_RATE

ROOT = Path(__file__).parent
SRC = ROOT / "stories_src"
AUDIO = ROOT / "audio"
MANIFEST = AUDIO / "index.json"
CHUNK_RATE = "-18%"
CHUNK_AF = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=30:all=1,apad=pad_dur=0.1"
ORDER = ["aluxes", "chaac", "chechen", "ceiba", "xtabay", "balam", "milpa", "abeja", "cenote", "hanal", "tunkuluchu", "kukulkan", "toh",
         "intro", "mi_dia", "cafe", "familia", "semana", "feria", "cita", "techo", "doctor", "merida"]
LANGS = {"es": (VOICE, CHUNK_RATE), "en": (EN_VOICE, EN_RATE), "sk": (SK_VOICE, SK_RATE)}

STOP = {"the", "a", "an", "of", "from", "to", "in", "at", "on", "el", "la", "los", "las", "un", "una"}
SKIP_SEG = re.compile(r"pron\.|čítaj|lit\.|dosl|=|personal|not translated|neprekl|\bverb\b|sloveso|sing\.|jednotné", re.I)
PREFIX = re.compile(r"^(Maya word|mayské slovo)\s*:\s*", re.I)
SAY_ES = [(r"\bx(?=[a-zñ])", "sh"), (r"\btoh\b", "toj"), (r"\bh-men\b", "jmen"), (r"\bhanal\b", "janal"), (r"-ha\b", "-já"),
          (r"\bah\b", "aj"), (r"\bwaaj\b", "uaj"), (r"\bwajes\b", "uajes"), (r"\bel 1 de\b", "el primero de"), (r"[’']", "")]
SAY_EN = [(r"\bcha chaac\b", "chah chahk"), (r"\bchaacs?\b", "chahk"), (r"\bh-men\b", "hmen"), (r"\btoh\b", "toe"), (r"\bx(?=[a-z])", "sh"), (r"[’']", "")]
SAY_SK = [(r"\bcha chaac", "čá čák"), (r"chaac", "čák"), (r"chichén", "čičén"), (r"itzá", "icá"), (r"chechén", "čečén"), (r"chacá", "čaká"), (r"\bx(?=[a-z])", "š"), (r"[’']", "")]


def load():
    have = {p.stem for p in SRC.glob("*.json")}
    ordered = [s for s in ORDER if s in have] + sorted(have - set(ORDER))
    stories = [json.loads((SRC / (s + ".json")).read_text(encoding="utf-8")) for s in ordered]
    published = ROOT / "stories.json"
    if published.exists():
        old = {s["id"] for s in json.loads(published.read_text(encoding="utf-8"))}
        lost = old - {s["id"] for s in stories}
        if lost:
            raise SystemExit("stories missing from stories_src: " + ", ".join(sorted(lost)))
    return stories


def edge(t):
    t = re.sub(r"^[¿¡\"«“'‘„]+", "", t.strip())
    t = re.sub(r"[.,;:!?…\"»”'’“]+$", "", t)
    return re.sub(r"\s+", " ", t).strip()


def toks(t):
    return [w for w in re.findall(r"[\wñáéíóúü'’-]+", t.lower()) if w not in STOP]


def gloss_text(es, t):
    t = t.strip()
    if t.startswith("("):
        return edge(t.replace("(", "").replace(")", ""))
    t = re.sub(r"\)\s*;.*$", ")", t)
    if "(" not in t:
        t = t.split(";")[0]
    outside = edge(re.sub(r"\([^)]*\)", "", t))
    meanings = []
    for seg in re.findall(r"\(([^)]*)\)", t):
        for part in seg.split(";"):
            part = PREFIX.sub("", part.strip(" '’‘„“\""))
            if part and not SKIP_SEG.search(part):
                meanings.append(part)
    if not meanings:
        return outside
    est = set(toks(es))
    ot = toks(outside)
    if ot and all(w in est for w in ot):
        return edge(meanings[0])
    return edge(outside + ", " + meanings[0])


def apply(rules, t):
    for pat, rep in rules:
        t = re.sub(pat, rep, t, flags=re.I)
    return re.sub(r"\s+", " ", t).strip()


def say_text(lang, es, t):
    if lang == "es":
        out = edge(re.sub(r"\([^)]*\)", "", t.replace("/", ", ")))
        if out.lower() == "y":
            out = "i"
        return apply(SAY_ES, out)
    out = gloss_text(es, t.replace(" / ", ", ").replace("/", ", "))
    return apply(SAY_EN if lang == "en" else SAY_SK, out)


def chunk_id(lang, spoken):
    return hashlib.sha1((lang + "|" + spoken.lower()).encode("utf-8")).hexdigest()[:8]


async def main():
    stories = load()
    clips = {}
    for s in stories:
        for sn in s["sentences"]:
            base = sn["w"]
            for i, c in enumerate(base):
                c3 = c[:3]
                sp = [say_text("es", c3[0], c3[0]), say_text("en", c3[0], c3[1]), say_text("sk", c3[0], c3[2])]
                ids = [chunk_id("es", sp[0]), chunk_id("en", sp[1]), chunk_id("sk", sp[2])]
                for lang, text, h in (("es", sp[0], ids[0]), ("en", sp[1], ids[1]), ("sk", sp[2], ids[2])):
                    name = f"ck/{lang}/{h}{EXT}"
                    if name not in clips:
                        clips[name] = (lang, text)
                base[i] = c3 + ids + sp
    (ROOT / "stories.json").write_text(json.dumps(stories, ensure_ascii=False), encoding="utf-8")

    done = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    jobs = []
    for s in stories:
        for n, sn in enumerate(s["sentences"]):
            jobs.append((f"st/{s['id']}_{n:02d}{EXT}", clean(sn["es"]), VOICE, RATE, None))
    for name, (lang, text) in clips.items():
        voice, rate = LANGS[lang]
        jobs.append((name, text, voice, rate, CHUNK_AF))

    sem = asyncio.Semaphore(4)
    todo = []
    for name, text, voice, rate, af in jobs:
        k = key(voice, rate, "+0Hz", text, af=af) if af else key(voice, rate, "+0Hz", text)
        if not (AUDIO / name).exists() or done.get(name) != k:
            todo.append((name, text, voice, rate, af, k))

    async def run(job):
        name, text, voice, rate, af, k = job
        out = AUDIO / name
        out.parent.mkdir(parents=True, exist_ok=True)
        if af:
            await render(text, voice, rate, out, sem, af=af)
        else:
            await render(text, voice, rate, out, sem)
        done[name] = k

    await asyncio.gather(*(run(j) for j in todo))
    keep = {j[0] for j in jobs}
    for sub in ("st", "ck/es", "ck/en", "ck/sk"):
        d = AUDIO / sub
        if d.exists():
            for f in d.glob("*.*"):
                rel = f"{sub}/{f.name}"
                if rel not in keep:
                    f.unlink()
                    done.pop(rel, None)
    for k in [k for k in done if (k.startswith("st/") or k.startswith("ck/")) and k not in keep]:
        done.pop(k, None)
    MANIFEST.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"stories: {len(stories)}, sentences: {sum(len(s['sentences']) for s in stories)}, chunk clips: {len(clips)}, written: {len(todo)}")


if __name__ == "__main__":
    asyncio.run(main())
