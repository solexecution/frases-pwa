import json
import random
from pathlib import Path

ROOT = Path(__file__).parent

CORE = [
    ("P", "Yo", "I", "yo", [
        ("Yo trabajo en energía solar", "I work in solar energy"),
        ("Yo soy de Eslovaquia", "I am from Slovakia")]),
    ("P", "Tú", "You", "tú", [
        ("¿Y tú de dónde eres?", "And where are you from?"),
        ("Tú hablas muy bien", "You speak very well")]),
    ("P", "Él", "He", "él", [
        ("Él es mi socio", "He is my business partner"),
        ("Él trabaja en una empresa grande", "He works at a big company")]),
    ("P", "Ella", "She", "ella", [
        ("Ella es mi amiga", "She is my friend"),
        ("Ella vive en Mérida", "She lives in Mérida")]),
    ("P", "Nosotros", "We", "nosotros", [
        ("Nosotros instalamos paneles solares", "We install solar panels"),
        ("Nosotros somos un buen equipo", "We are a good team")]),
    ("P", "Ellos", "They", "ellos", [
        ("Ellos quieren una cotización", "They want a quote"),
        ("Ellos llegan mañana", "They arrive tomorrow")]),
    ("P", "Ustedes", "You all", "ustedes", [
        ("Ustedes son muy amables", "You all are very kind"),
        ("¿Ustedes ya comieron?", "Have you all eaten yet?")]),
    ("O", "Me", "Me / to me", "me", [
        ("¿Me puedes ayudar?", "Can you help me?"),
        ("¿Me escuchas?", "Can you hear me?")]),
    ("O", "Te", "You / to you", "te", [
        ("Te veo mañana", "I'll see you tomorrow"),
        ("Te llamo después", "I'll call you later")]),
    ("O", "Mi", "My", "mi", [
        ("Mi trabajo es muy interesante", "My job is very interesting"),
        ("Mi familia vive en Eslovaquia", "My family lives in Slovakia")]),
    ("O", "Tu", "Your", "tu", [
        ("¿Cuál es tu número?", "What is your number?"),
        ("Tu español es muy bueno", "Your Spanish is very good")]),
    ("O", "Conmigo", "With me", "conmigo", [
        ("¿Quieres cenar conmigo?", "Do you want to have dinner with me?"),
        ("Habla conmigo, por favor", "Talk to me, please")]),
    ("O", "Contigo", "With you", "contigo", [
        ("Me gusta hablar contigo", "I like talking with you"),
        ("Quiero trabajar contigo", "I want to work with you")]),
    ("O", "Para mí", "For me", "para mí", [
        ("Para mí, un café", "For me, a coffee"),
        ("Esto es importante para mí", "This is important to me")]),
    ("O", "Para ti", "For you", "para ti", [
        ("Esto es para ti", "This is for you"),
        ("Tengo algo para ti", "I have something for you")]),
    ("V", "Soy", "I am (who I am)", "soy", [
        ("Soy nuevo aquí", "I am new here"),
        ("Soy muy puntual", "I am very punctual")]),
    ("V", "Eres", "You are", "eres", [
        ("Eres muy amable", "You are very kind"),
        ("¿Eres de aquí?", "Are you from here?")]),
    ("V", "Estoy", "I am (how or where I am)", "estoy", [
        ("Estoy en la oficina", "I am at the office"),
        ("Estoy muy contento", "I am very happy")]),
    ("V", "Tengo", "I have", "tengo", [
        ("Tengo una reunión hoy", "I have a meeting today"),
        ("Tengo hambre", "I am hungry")]),
    ("V", "Tienes", "You have", "tienes", [
        ("¿Tienes tiempo hoy?", "Do you have time today?"),
        ("¿Tienes hermanos?", "Do you have siblings?")]),
    ("V", "Quiero", "I want", "quiero", [
        ("Quiero un café, por favor", "I want a coffee, please"),
        ("Quiero conocerte mejor", "I want to get to know you better")]),
    ("V", "Quieres", "You want", "quieres", [
        ("¿Quieres un café?", "Do you want a coffee?"),
        ("¿Qué quieres hacer hoy?", "What do you want to do today?")]),
    ("V", "Necesito", "I need", "necesito", [
        ("Necesito tu ayuda", "I need your help"),
        ("Necesito más tiempo", "I need more time")]),
    ("V", "Puedo", "I can", "puedo", [
        ("¿Puedo sentarme aquí?", "Can I sit here?"),
        ("Hoy no puedo", "I can't today")]),
    ("V", "Puedes", "You can", "puedes", [
        ("¿Puedes repetirlo?", "Can you repeat it?"),
        ("¿Puedes hablar más despacio?", "Can you speak more slowly?")]),
    ("V", "Voy", "I go / I am going", "voy", [
        ("Voy a la oficina", "I am going to the office"),
        ("Voy contigo", "I am going with you")]),
    ("V", "Hago", "I do / I make", "hago", [
        ("Hago ejercicio por la mañana", "I exercise in the morning"),
        ("Hago cotizaciones de energía solar", "I make solar quotes")]),
    ("V", "Hay", "There is / there are", "hay", [
        ("Hay un problema", "There is a problem"),
        ("¿Hay una cafetería cerca?", "Is there a café nearby?")]),
    ("L", "Aquí", "Here", "aquí", [
        ("Estoy aquí", "I am here"),
        ("Aquí está mi tarjeta", "Here is my card")]),
    ("L", "Allá", "Over there", "allá", [
        ("Mi oficina está allá", "My office is over there"),
        ("Allá hace mucho calor", "It is very hot over there")]),
    ("L", "Esto", "This", "esto", [
        ("Esto es muy bueno", "This is very good"),
        ("¿Cuánto cuesta esto?", "How much is this?")]),
    ("L", "Eso", "That", "eso", [
        ("Eso es interesante", "That is interesting"),
        ("Eso me gusta", "I like that")]),
    ("Q", "¿Qué?", "What?", "qué", [
        ("¿Qué piensas de esto?", "What do you think of this?"),
        ("¿Qué necesitas?", "What do you need?")]),
    ("Q", "¿Quién?", "Who?", "quién", [
        ("¿Quién es ella?", "Who is she?"),
        ("¿Quién viene mañana?", "Who is coming tomorrow?")]),
    ("Q", "¿Dónde?", "Where?", "dónde", [
        ("¿Dónde vives?", "Where do you live?"),
        ("¿Dónde trabajas?", "Where do you work?")]),
    ("Q", "¿Cuándo?", "When?", "cuándo", [
        ("¿Cuándo llegas?", "When do you arrive?"),
        ("¿Cuándo nos vemos?", "When do we meet?")]),
    ("Q", "¿Cómo?", "How?", "cómo", [
        ("¿Cómo llego allá?", "How do I get there?"),
        ("¿Cómo se dice esto?", "How do you say this?")]),
    ("Q", "¿Por qué?", "Why?", "por qué", [
        ("¿Por qué no?", "Why not?"),
        ("¿Por qué estás aquí?", "Why are you here?")]),
    ("K", "También", "Also / too", "también", [
        ("Yo también", "Me too"),
        ("Ella también viene", "She is coming too")]),
    ("K", "Pero", "But", "pero", [
        ("Quiero ir, pero no puedo", "I want to go, but I can't"),
        ("Entiendo, pero hablo poco", "I understand, but I speak little")]),
    ("K", "Porque", "Because", "porque", [
        ("Llego tarde porque hay tráfico", "I am late because there is traffic"),
        ("Porque tengo una reunión", "Because I have a meeting")]),
    ("K", "Muy", "Very", "muy", [
        ("Estoy muy cansado", "I am very tired"),
        ("Es muy importante", "It is very important")]),
    ("K", "Con", "With", "con", [
        ("Trabajo con una empresa solar", "I work with a solar company"),
        ("Café con leche", "Coffee with milk")]),
]

OPP = [("Yo", "Tú"), ("Él", "Ella"), ("Nosotros", "Ellos"), ("Me", "Te"), ("Mi", "Tu"),
       ("Conmigo", "Contigo"), ("Para mí", "Para ti"), ("Soy", "Eres"), ("Tengo", "Tienes"),
       ("Quiero", "Quieres"), ("Puedo", "Puedes"), ("Aquí", "Allá"), ("Esto", "Eso")]

random.seed(7)
src_path = ROOT / "pairs_src.json"
src = json.loads(src_path.read_text(encoding="utf-8"))
have_new = {r[0] for r in src["new"]}
have_pair = {tuple(p) for p in src["pairs"]}

by_class = {}
for c, es, en, w, sents in CORE:
    by_class.setdefault(c, []).append(w)

needs, cloze = {}, {}
for c, es, en, w, sents in CORE:
    if es not in have_new:
        src["new"].append([es, en, "Core", "Core word"])
        have_new.add(es)
    for ses, sen in sents:
        if ses not in have_new:
            src["new"].append([ses, sen, "Core"])
            have_new.add(ses)
        if (es, ses, "with") not in have_pair:
            src["pairs"].append([es, ses, "with"])
            have_pair.add((es, ses, "with"))
        needs[ses] = es
        low = ses.lower()
        assert w in low, (w, ses)
        pool = [x for x in by_class[c] if x != w]
        if len(pool) < 3:
            pool += [x for x in by_class["P"] if x != w and x not in pool]
        opts = random.sample(pool, 3) + [w]
        random.shuffle(opts)
        cloze[ses] = {"w": w, "o": opts}
for a, b in OPP:
    if (a, b, "opp") not in have_pair:
        src["pairs"].append([a, b, "opp"])
        have_pair.add((a, b, "opp"))

src_path.write_text(json.dumps(src, ensure_ascii=False, indent=1), encoding="utf-8")
(ROOT / "core.json").write_text(json.dumps({"needs": needs, "cloze": cloze, "words": [x[1] for x in CORE]}, ensure_ascii=False), encoding="utf-8")
print("core words", len(CORE), "sentences", len(needs))
