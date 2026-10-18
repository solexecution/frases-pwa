import json, re, sys
from pathlib import Path

EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF]")
ES_OK = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9¿¡?!.,;:'\"() \-…–]+$")


def check(path):
    errs = []
    d = json.loads(Path(path).read_text(encoding="utf-8"))
    for k in ("id", "level", "title", "sentences"):
        if k not in d:
            errs.append("missing " + k)
    if errs:
        return errs
    if not re.fullmatch(r"[a-z0-9_]+", d["id"]):
        errs.append("id must be lowercase letters/digits/underscore")
    if "group" in d and (not isinstance(d["group"], str) or not d["group"].strip()):
        errs.append("group must be a non-empty string")
    if d["level"] not in (1, 2):
        errs.append("level must be 1 or 2")
    for l in ("es", "en", "sk"):
        if not isinstance(d["title"].get(l), str) or not d["title"][l].strip():
            errs.append("title." + l + " missing")
    s = d["sentences"]
    if not 6 <= len(s) <= 10:
        errs.append("need 6 to 10 sentences, got %d" % len(s))
    for i, x in enumerate(s):
        p = "sentence %d: " % (i + 1)
        for l in ("es", "en", "sk"):
            v = x.get(l)
            if not isinstance(v, str) or not v.strip():
                errs.append(p + l + " missing")
            elif EMOJI.search(v):
                errs.append(p + l + " has emoji")
        if errs and any(e.startswith(p) and "missing" in e for e in errs):
            continue
        es = x["es"]
        if not ES_OK.match(es):
            errs.append(p + "es has odd characters: " + es)
        n = len(es.split())
        if not 2 <= n <= 12:
            errs.append(p + "es should be 2 to 12 words, got %d" % n)
        if not re.search(r"[.!?…]$", es):
            errs.append(p + "es must end with . ! ? or …")
        w = x.get("w")
        if not isinstance(w, list) or not w:
            errs.append(p + "w (chunks) missing")
            continue
        joined = []
        for c in w:
            if not (isinstance(c, list) and len(c) == 3 and all(isinstance(t, str) and t.strip() for t in c)):
                errs.append(p + "each chunk must be [es, en, sk] with non-empty strings")
                break
            joined.append(c[0].strip())
            if len(c[0].split()) > 4:
                errs.append(p + "chunk too long (max 4 words): " + c[0])
        else:
            if " ".join(joined) != " ".join(es.split()):
                errs.append(p + "chunks do not rebuild the sentence. chunks: %r  sentence: %r" % (" ".join(joined), es))
    ids = [x["es"] for x in s]
    if len(set(ids)) != len(ids):
        errs.append("duplicate sentences")
    return errs


if __name__ == "__main__":
    bad = False
    for p in sys.argv[1:]:
        e = check(p)
        if e:
            bad = True
            print("FAIL", p)
            for x in e:
                print("  -", x)
        else:
            print("OK", p)
    sys.exit(1 if bad else 0)
