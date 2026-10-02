import json
from pathlib import Path

ROOT = Path(__file__).parent
src = json.loads((ROOT / "pairs_src.json").read_text(encoding="utf-8"))
ph = json.loads((ROOT / "phrases.json").read_text(encoding="utf-8"))

have = {r[0] for r in ph}
added = 0
for r in src["new"]:
    if r[0] not in have:
        ph.append(r)
        have.add(r[0])
        added += 1
if added:
    text = "[\n" + ",\n".join(json.dumps(e, ensure_ascii=False) for e in ph) + "\n]\n"
    (ROOT / "phrases.json").write_text(text, encoding="utf-8")

idx = {}
for i, r in enumerate(ph):
    if r[0] in idx:
        raise SystemExit("duplicate phrase: " + r[0])
    idx[r[0]] = i

LAB = {"opp": ("Opposite", "Opposite"), "alt": ("Alternative", "Alternative"), "with": ("Goes with", "Goes with"),
       "qa": ("Answer", "Question"), "seq": ("Next", "Previous")}
ORDER = ["Opposite", "Alternative", "Answer", "Question", "Goes with", "Next", "Previous"]
out = [[] for _ in ph]
seen = set()
missing = []

def add(a, b, t):
    if a not in idx or b not in idx:
        missing.append((a, b))
        return
    i, j = idx[a], idx[b]
    key = (min(i, j), max(i, j), t)
    if key in seen:
        return
    seen.add(key)
    out[i].append([j, LAB[t][0]])
    out[j].append([i, LAB[t][1]])

for a, b, t in src["pairs"]:
    add(a, b, t)
for ch in src["chains"]:
    for a, b in zip(ch, ch[1:]):
        add(a, b, "seq")

if missing:
    raise SystemExit("unknown phrases: " + repr(missing))

for lst in out:
    lst.sort(key=lambda x: ORDER.index(x[1]))
    del lst[4:]

lonely = [ph[i][0] for i, x in enumerate(out) if not x]
(ROOT / "pairs.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"phrases: {len(ph)} (+{added} new), pairs: {len(seen)}, without a partner: {len(lonely)}")
for l in lonely:
    print("  LONELY:", l)
