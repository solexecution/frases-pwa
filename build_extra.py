import json
from pathlib import Path

ROOT = Path(__file__).parent

BODY = [
    ("la cabeza", "the head"), ("el pelo", "the hair"), ("la cara", "the face"), ("los ojos", "the eyes"),
    ("la nariz", "the nose"), ("la boca", "the mouth"), ("los dientes", "the teeth"), ("las orejas", "the ears"),
    ("la garganta", "the throat"), ("el cuello", "the neck"), ("los hombros", "the shoulders"), ("el brazo", "the arm"),
    ("la mano", "the hand"), ("los dedos", "the fingers"), ("el pecho", "the chest"), ("el corazón", "the heart"),
    ("la espalda", "the back"), ("el estómago", "the stomach"), ("la pierna", "the leg"), ("la rodilla", "the knee"),
    ("el pie", "the foot"),
]
BODY_SENT = [
    ("Me duele la cabeza", "My head hurts", "la cabeza"),
    ("Me duele la garganta", "My throat hurts", "la garganta"),
    ("Me duele la espalda", "My back hurts", "la espalda"),
    ("Me duele el estómago", "My stomach hurts", "el estómago"),
    ("Me duele aquí", "It hurts here", None),
]
BODY_LINKS = [("el pelo", "la cabeza"), ("la cara", "los ojos"), ("la nariz", "la boca"), ("la boca", "los dientes"),
              ("las orejas", "la cabeza"), ("el cuello", "los hombros"), ("el brazo", "la mano"), ("la mano", "los dedos"),
              ("el pecho", "el corazón"), ("la pierna", "la rodilla"), ("la rodilla", "el pie")]

DAYS = [("lunes", "Monday"), ("martes", "Tuesday"), ("miércoles", "Wednesday"), ("jueves", "Thursday"),
        ("viernes", "Friday"), ("sábado", "Saturday"), ("domingo", "Sunday")]
MONTHS = [("enero", "January"), ("febrero", "February"), ("marzo", "March"), ("abril", "April"), ("mayo", "May"),
          ("junio", "June"), ("julio", "July"), ("agosto", "August"), ("septiembre", "September"),
          ("octubre", "October"), ("noviembre", "November"), ("diciembre", "December")]
TIME_SENT = [
    ("Hoy", "Today", "Time"), ("Ayer", "Yesterday", "Time"),
    ("¿Qué día es hoy?", "What day is it today?", "Time"), ("Hoy es viernes", "Today is Friday", "Time"),
    ("¿En qué mes estamos?", "What month is it?", "Time"), ("Estamos en octubre", "It is October", "Time"),
    ("Mi cumpleaños es en mayo", "My birthday is in May", "Time"),
    ("Nos vemos el lunes", "See you on Monday", "Time"),
]

NUMS = [("cero", "zero"), ("uno", "one"), ("dos", "two"), ("tres", "three"), ("cuatro", "four"), ("cinco", "five"),
        ("seis", "six"), ("siete", "seven"), ("ocho", "eight"), ("nueve", "nine"), ("diez", "ten"),
        ("once", "eleven"), ("doce", "twelve"), ("trece", "thirteen"), ("catorce", "fourteen"), ("quince", "fifteen"),
        ("dieciséis", "sixteen"), ("diecisiete", "seventeen"), ("dieciocho", "eighteen"), ("diecinueve", "nineteen"),
        ("veinte", "twenty"), ("treinta", "thirty"), ("cuarenta", "forty"), ("cincuenta", "fifty"),
        ("sesenta", "sixty"), ("setenta", "seventy"), ("ochenta", "eighty"), ("noventa", "ninety"),
        ("cien", "one hundred"), ("mil", "one thousand")]
NUM_SENT = [
    ("¿Cuántos años tienes?", "How old are you?", "Numbers"),
    ("Son cien pesos", "It is one hundred pesos", "Numbers"),
    ("Cuesta mil pesos", "It costs a thousand pesos", "Numbers"),
    ("Dame dos, por favor", "Give me two, please", "Numbers"),
    ("Somos cinco", "There are five of us", "Numbers"),
    ("Mi número es cinco, cinco, uno, dos", "My number is five, five, one, two", "Numbers"),
]

MATH = [
    ("más", "plus", "Numbers"), ("menos", "minus", "Numbers"), ("por", "times", "Numbers"),
    ("entre", "divided by", "Numbers"), ("igual a", "equals", "Numbers"),
    ("Dos más dos son cuatro", "Two plus two is four", "Numbers"),
    ("Diez menos tres son siete", "Ten minus three is seven", "Numbers"),
    ("Tres por tres son nueve", "Three times three is nine", "Numbers"),
    ("Diez entre dos son cinco", "Ten divided by two is five", "Numbers"),
    ("¿Cuánto es cinco más cinco?", "How much is five plus five?", "Numbers"),
    ("Son diez", "It is ten", "Numbers"),
    ("la mitad", "half", "Numbers"), ("el doble", "double", "Numbers"),
]

EASY = [
    ("Perdón", "Sorry / Excuse me", "Easy"), ("Con permiso", "Excuse me (to pass)", "Easy"),
    ("Salud", "Cheers / Bless you", "Easy"), ("Buen provecho", "Enjoy your meal", "Easy"),
    ("Felicidades", "Congratulations", "Easy"), ("Buena suerte", "Good luck", "Easy"),
    ("Bienvenido", "Welcome", "Easy"), ("Hasta luego", "See you later", "Easy"),
    ("Hasta mañana", "See you tomorrow", "Easy"), ("Nos vemos", "See you", "Easy"),
    ("Cuídate", "Take care", "Easy"), ("Igualmente", "Likewise", "Easy"),
    ("Está bien", "It is fine", "Easy"), ("Está muy rico", "It is very tasty", "Easy"),
    ("No me gusta", "I do not like it", "Easy"), ("Otra vez, por favor", "Again, please", "Easy"),
    ("¿Qué significa?", "What does it mean?", "Easy"), ("¿Cómo se escribe?", "How do you spell it?", "Easy"),
    ("Lo entiendo", "I understand it", "Easy"), ("Ayúdame, por favor", "Help me, please", "Easy"),
    ("Un poco", "A little", "Easy"), ("Mucho", "A lot", "Easy"), ("Todo", "Everything", "Easy"), ("Nada", "Nothing", "Easy"),
]

src_path = ROOT / "pairs_src.json"
src = json.loads(src_path.read_text(encoding="utf-8"))
ph = json.loads((ROOT / "phrases.json").read_text(encoding="utf-8"))
exist = {r[0] for r in ph} | {r[0] for r in src["new"]}
pairs = {tuple(p) for p in src["pairs"]}


def add(es, en, cat, note=None):
    if es in exist:
        return False
    row = [es, en, cat] + ([note] if note else [])
    src["new"].append(row)
    exist.add(es)
    return True


def pair(a, b, t):
    if (a, b, t) not in pairs and (b, a, t) not in pairs:
        src["pairs"].append([a, b, t])
        pairs.add((a, b, t))


def cap(s):
    return s[0].upper() + s[1:]


for es, en in BODY:
    add(cap(es), cap(en), "Body")
for es, en, w in BODY_SENT:
    add(es, en, "Body")
    if w:
        pair(cap(w), es, "with")
for a, b in BODY_LINKS:
    pair(cap(a), cap(b), "with")
pair("Me duele aquí", "Me duele la cabeza", "alt")

for es, en in DAYS:
    add(cap(es), en, "Time")
for i in range(len(DAYS) - 1):
    pair(cap(DAYS[i][0]), cap(DAYS[i + 1][0]), "seq")
for es, en in MONTHS:
    add(cap(es), en, "Time")
for i in range(len(MONTHS) - 1):
    pair(cap(MONTHS[i][0]), cap(MONTHS[i + 1][0]), "seq")
for es, en, c in TIME_SENT:
    add(es, en, c)
pair("¿Qué día es hoy?", "Hoy es viernes", "qa")
pair("¿En qué mes estamos?", "Estamos en octubre", "qa")
pair("Hoy", "Ayer", "opp")
pair("Hoy es viernes", "Viernes", "with")
pair("Estamos en octubre", "Octubre", "with")
pair("Mi cumpleaños es en mayo", "Mayo", "with")
pair("Nos vemos el lunes", "Lunes", "with")

for es, en in NUMS:
    add(cap(es), cap(en), "Numbers")
for i in range(len(NUMS) - 1):
    pair(cap(NUMS[i][0]), cap(NUMS[i + 1][0]), "seq")
for es, en, c in NUM_SENT:
    add(es, en, c)
pair("¿Cuántos años tienes?", "Treinta", "with")
pair("Son cien pesos", "Cien", "with")
pair("Cuesta mil pesos", "Mil", "with")
pair("Dame dos, por favor", "Dos", "with")
pair("Somos cinco", "Cinco", "with")
pair("Mi número es cinco, cinco, uno, dos", "Cinco", "with")

for es, en, c in MATH:
    add(cap(es), cap(en), c)
pair("Más", "Menos", "opp")
pair("Por", "Entre", "opp")
pair("Igual a", "Más", "with")
pair("Dos más dos son cuatro", "Más", "with")
pair("Diez menos tres son siete", "Menos", "with")
pair("Tres por tres son nueve", "Por", "with")
pair("Diez entre dos son cinco", "Entre", "with")
pair("¿Cuánto es cinco más cinco?", "Son diez", "qa")
pair("La mitad", "El doble", "opp")

for es, en, c in EASY:
    add(es, en, c)
pair("Perdón", "Con permiso", "alt")
pair("Hasta luego", "Hasta mañana", "alt")
pair("Hasta luego", "Nos vemos", "alt")
pair("Salud", "Buen provecho", "with")
pair("Felicidades", "Buena suerte", "with")
pair("Bienvenido", "Cuídate", "opp")
pair("Igualmente", "Buen provecho", "with")
pair("Está bien", "No me gusta", "opp")
pair("Está muy rico", "No me gusta", "opp")
pair("Otra vez, por favor", "¿Qué significa?", "with")
pair("¿Qué significa?", "¿Cómo se escribe?", "with")
pair("Lo entiendo", "No entiendo", "opp")
pair("Ayúdame, por favor", "Con gusto", "qa")
pair("Un poco", "Mucho", "opp")
pair("Todo", "Nada", "opp")

src_path.write_text(json.dumps(src, ensure_ascii=False, indent=1), encoding="utf-8")
print("new rows:", len(src["new"]))
