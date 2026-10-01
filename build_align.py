import json, re
from pathlib import Path

ROOT = Path(__file__).parent
PH = json.loads((ROOT / "phrases.json").read_text(encoding="utf-8"))

STRIP = "¿¡?!.,…:;\"'()«»"
def toks(s): return s.split()
def norm(t): return t.strip(STRIP).lower()

def locate(tokens, sub, cursor):
    want = [norm(w) for w in sub.split()]
    n = len(want)
    order = list(range(cursor, len(tokens) - n + 1)) + list(range(0, cursor))
    for start in order:
        if [norm(tokens[start + k]) for k in range(n)] == want:
            return list(range(start, start + n))
    raise ValueError(f"not found: {sub!r} in {tokens!r}")

SRC = {
 0:[["Déjame","Let me"],["pensarlo","think about it"]],
 1:[["Un","One"],["segundo","second"]],
 5:[["Buen","Good"],["punto","point"]],
 6:[["Tienes","You're"],["razón","right"]],
 13:[["Ya","I"],["veo","see"]],
 14:[["Me","I"],["imagino","imagine"]],
 20:[["No","didn't"],["entendí","catch"],["eso","that"]],
 23:[["Más despacio","Slower"],["por favor","please"]],
 24:[["Qué","What"],["significa","mean"]],
 25:[["Cómo","How"],["se dice","do you say"],["en español","in Spanish"]],
 26:[["Cómo","How"],["se escribe","do you spell"]],
 27:[["No sé","I don't know"],["cómo","how"],["se dice","to say"]],
 28:[["Hablo","I speak"],["un poco","a little"],["español","Spanish"]],
 29:[["explicas","Can you explain"],["Me","me"]],
 30:[["puedes","Can you"],["escribir","write"],["Me","me"]],
 32:[["Todavía","still"],["estoy","I'm"],["aprendiendo","learning"]],
 33:[["qué","What"],["refieres","mean"]],
 34:[["Creo","I think"],["sí","so"]],
 35:[["Creo","think"],["no","don't"]],
 36:[["Estoy","I"],["de acuerdo","agree"]],
 37:[["No","not"],["estoy","I'm"],["seguro","sure"]],
 38:[["Me","to me"],["parece","Sounds"],["bien","good"]],
 43:[["No","not"],["vale la pena","It's worth it"]],
 44:[["Tiene","makes"],["sentido","sense"]],
 45:[["Qué","What"],["lástima","shame"]],
 46:[["Voy","I'm"],["en camino","on my way"]],
 47:[["voy","I'm coming"],["Ahorita","soon-ish"]],
 48:[["Llego","I'll be there"],["en","in"],["diez","ten"],["minutos","minutes"]],
 49:[["Voy","I'm running"],["tarde","late"]],
 50:[["qué hora","What time"],["nos vemos","shall we meet"]],
 51:[["Te","for you"],["queda bien","work"],["mañana","tomorrow"]],
 54:[["Dónde","Where"],["nos vemos","shall we meet"]],
 56:[["Hoy","today"],["no puedo","can't"]],
 57:[["Cuánto tiempo","How long"],["tarda","take"]],
 58:[["casi","Almost"],["Ya","there"]],
 59:[["No","Not"],["todavía","yet"]],
 60:[["Qué","What's"],["onda","up"]],
 61:[["Cómo","How's"],["va","going"],["te","it"]],
 64:[["qué","What"],["dedicas","do you do"]],
 65:[["Soy","I'm"],["de","from"],["Eslovaquia","Slovakia"]],
 66:[["Vivo","I live"],["aquí cerca","nearby"]],
 69:[["No","No"],["pasa nada","worries"]],
 70:[["Gracias","Thanks"],["por","for"],["todo","everything"]],
 76:[["Cuánto","How much"],["cuesta","is it"]],
 77:[["das","have"],["la cuenta","the bill"]],
 78:[["Aceptan","Do you take"],["tarjeta","card"]],
 79:[["Dónde","Where"],["está","is"]],
 80:[["puedes","Can you"],["ayudar","help"],["Me","me"]],
 84:[["Está","Is it"],["lejos","far"]],
 85:[["Aquí","Here"],["está","is"],["bien","fine"]],
 87:[["Hay","Is there"],["descuento","discount"]],
 88:[["Sin","No"],["hielo","ice"],["por favor","please"]],
 90:[["Cuándo","When"],["pueden","can you"],["empezar","start"]],
 91:[["Hay que","It needs"],["revisarlo","checking"]],
 92:[["No","doesn't"],["funciona","work"]],
 93:[["Se fue","went out"],["la luz","The power"]],
 94:[["mandas","Can you send"],["tu","your"],["ubicación","location"],["Me","me"]],
 95:[["mando","Shall I send"],["Te","you"],["la cotización","the quote"]],
 96:[["marco","I'll call"],["Te","you"],["más tarde","later"]],
 97:[["está","It's"],["listo","ready"],["Ya","now"]],
 98:[["Todo","Everything"],["bien","OK"]],
}

out = []
for i, row in enumerate(PH):
    es, en = toks(row[0]), toks(row[1])
    if i in SRC:
        groups, ec, nc = [], 0, 0
        for esSub, enSub in SRC[i]:
            ei = locate(es, esSub, ec); ec = ei[-1] + 1
            ni = locate(en, enSub, nc); nc = ni[-1] + 1
            groups.append({"es": ei, "en": ni})
    else:
        groups = [{"es": list(range(len(es))), "en": list(range(len(en)))}]
    out.append(groups)

(ROOT / "align.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(f"wrote align.json for {len(out)} phrases; {len(SRC)} with word-level pairs, {len(out)-len(SRC)} whole-phrase")
