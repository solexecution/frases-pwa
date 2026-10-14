import asyncio, hashlib, subprocess, sys
from pathlib import Path
import edge_tts

RAW = Path(__file__).resolve().parent.parent / "raw_audio"
TRIM = "silenceremove=start_periods=1:start_threshold=-55dB,adelay=90:all=1,apad=pad_dur=0.35"
BITRATE = "28k"
EXT = ".ogg"


def raw_path(text, voice, rate, pitch):
    key = hashlib.sha1((voice + rate + pitch + text).encode("utf-8")).hexdigest()[:20]
    return RAW / (key + ".mp3")


def encode(raw, out, bitrate=BITRATE):
    tmp = Path(str(out) + ".tmp" + EXT)
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", TRIM, "-ac", "1", "-ar", "24000",
                        "-c:a", "libopus", "-b:a", bitrate, "-vbr", "on", "-compression_level", "10", "-application", "audio",
                        "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-f", "ogg", str(tmp)])
    if r.returncode != 0 or not tmp.exists() or tmp.stat().st_size < 300:
        tmp.unlink(missing_ok=True)
        raise RuntimeError("encode failed " + str(out))
    tmp.replace(out)


async def fetch_raw(text, voice, rate, pitch, sem):
    raw = raw_path(text, voice, rate, pitch)
    if raw.exists() and raw.stat().st_size > 500:
        return raw
    RAW.mkdir(parents=True, exist_ok=True)
    last = None
    async with sem:
        for attempt in range(6):
            try:
                say = text if attempt < 2 else text.rstrip(".") + "."
                tmp = Path(str(raw) + ".part")
                await edge_tts.Communicate(say, voice, rate=rate, pitch=pitch).save(str(tmp))
                if tmp.stat().st_size < 500:
                    raise RuntimeError("short audio")
                tmp.replace(raw)
                return raw
            except Exception as e:
                last = e
                await asyncio.sleep(2 + attempt * 3)
    raise last


async def render(text, voice, rate, out, sem, pitch="+0Hz", bitrate=BITRATE):
    raw = await fetch_raw(text, voice, rate, pitch, sem)
    await asyncio.to_thread(encode, raw, out, bitrate)


def key(*parts):
    return hashlib.sha1("|".join(parts + (BITRATE, EXT, TRIM)).encode("utf-8")).hexdigest()[:12]
