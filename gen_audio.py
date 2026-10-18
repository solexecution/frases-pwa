import asyncio, json, sys, re
from pathlib import Path
from audiolib import render, key, EXT

VOICE = "es-MX-DaliaNeural"
EN_VOICE = "en-US-AriaNeural"
SK_VOICE = "sk-SK-ViktoriaNeural"
EN_PITCH = "+0Hz"
RATE = "-8%"
EN_RATE = "-4%"
SK_RATE = "-6%"
SLOW_RATE = "-30%"
ROOT = Path(__file__).parent
AUDIO = ROOT / "audio"
SLOW = AUDIO / "slow"
EN = AUDIO / "en"
SK = AUDIO / "sk"
MANIFEST = AUDIO / "index.json"


def clean(s):
    for c in "…¿¡":
        s = s.replace(c, "")
    return s.strip()


def en_clean(s):
    s = re.sub(r"\([^)]*\)", "", s)
    s = s.replace("/", ", ").replace("…", " ")
    return re.sub(r"\s+", " ", s).strip(" ,")


def sk_clean(s):
    s = re.sub(r"\([^)]*\)", "", s)
    s = s.replace("/", ", ").replace("…", " ").replace("...", " ")
    return re.sub(r"\s+", " ", s).strip(" ,")


def spaced(s):
    words = [w for w in clean(s).replace(",", " ").split() if w]
    return ", ".join(words)


async def main():
    force = "--force" in sys.argv
    phrases = json.loads((ROOT / "phrases.json").read_text(encoding="utf-8"))
    sk = json.loads((ROOT / "sk.json").read_text(encoding="utf-8"))
    for d in (AUDIO, SLOW, EN, SK):
        d.mkdir(parents=True, exist_ok=True)
    done = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    jobs = []
    for i, row in enumerate(phrases):
        n = f"{i:03d}{EXT}"
        jobs.append((n, clean(row[0]), VOICE, RATE, "+0Hz", AUDIO / n))
        jobs.append(("slow/" + n, spaced(row[0]), VOICE, SLOW_RATE, "+0Hz", SLOW / n))
        jobs.append(("en/" + n, en_clean(row[1]), EN_VOICE, EN_RATE, EN_PITCH, EN / n))
        jobs.append(("sk/" + n, sk_clean(sk[i]), SK_VOICE, SK_RATE, "+0Hz", SK / n))
    sem = asyncio.Semaphore(4)
    made = 0
    todo = []
    for name, text, voice, rate, pitch, out in jobs:
        k = key(voice, rate, pitch, text)
        if force or not out.exists() or done.get(name) != k:
            todo.append((name, text, voice, rate, pitch, out, k))

    async def run(job):
        nonlocal made
        name, text, voice, rate, pitch, out, k = job
        await render(text, voice, rate, out, sem, pitch)
        done[name] = k
        made += 1
        if made % 50 == 0:
            print(" ", made, "of", len(todo), flush=True)

    await asyncio.gather(*(run(j) for j in todo))
    keep = {j[0] for j in jobs}
    for base, prefix in ((AUDIO, ""), (SLOW, "slow/"), (EN, "en/"), (SK, "sk/")):
        for f in base.glob("*.*"):
            if f.suffix != EXT or (prefix + f.name) not in keep:
                f.unlink()
                done.pop(prefix + f.name, None)
    MANIFEST.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"done. {made} files written, {len(phrases)} phrases x4 sets.")


if __name__ == "__main__":
    asyncio.run(main())
