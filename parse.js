// Rozdělení nadiktovaného textu na položky a jejich zařazení do kategorií.

export function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Slova, která oddělují položky v diktátu („mléko a pak chleba a máslo“).
// (\b nejde použít – v JS nezná česká písmena.)
const SEPARATORS =
  /\s*[,;.\n]\s*|(?:^|\s+)(?:a pak|a potom|a ještě|a taky|pak|potom|ještě|taky|a)(?=\s|$)\s*/i;

export function splitItems(text) {
  return text
    .split(SEPARATORS)
    .map((s) => s.trim())
    .filter((s) => s && !/^(a|pak|potom|ještě|taky)$/i.test(s))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

// Množství na začátku položky se pro účely třídění a hledání duplicit ignoruje.
const QUANTITY_WORDS = new Set([
  "jeden", "jedna", "jedno", "jednu", "dva", "dve", "tri", "ctyri", "pet", "sest", "sedm",
  "osm", "devet", "deset", "par", "nekolik", "pul", "ctvrt", "kilo", "kila", "kil", "deka",
  "dkg", "kg", "g", "gramu", "litr", "litry", "litru", "l", "baleni", "balik", "baliky",
  "balicek", "balicky", "krabice", "krabicku", "plechovka", "plechovky", "lahev", "lahve",
  "lahvi", "kus", "kusy", "kusu", "ks", "sacek", "sacky", "vanicka", "velky", "velka",
  "velke", "maly", "mala", "male", "jeste", "nejaky", "nejaka", "nejake",
]);

export function itemKey(name) {
  const words = normalize(name).split(" ");
  while (words.length > 1 && (QUANTITY_WORDS.has(words[0]) || /^\d+$/.test(words[0]))) {
    words.shift();
  }
  return words.join(" ");
}

function commonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

// Vrátí id kategorie, nebo null, když nic nesedí.
export function categorize(name, categories, learned) {
  const key = itemKey(name);
  if (learned[key]) {
    if (categories.some((c) => c.id === learned[key])) return learned[key];
  }
  const words = key.split(" ").filter((w) => w.length >= 2);
  let best = null;
  let bestScore = 0;
  for (const cat of categories) {
    for (const kwRaw of cat.keywords) {
      const kw = normalize(kwRaw);
      if (!kw) continue;
      let score = 0;
      if (kw.includes(" ")) {
        // Víceslovné heslo („prášek do pečiva“) musí sedět celé a má přednost.
        if (key.includes(kw)) score = 100 + kw.length;
      } else {
        for (const w of words) {
          const p = commonPrefix(w, kw);
          const need = Math.max(3, Math.min(w.length, kw.length) - 2);
          if (p >= need) score = Math.max(score, p + (p === w.length && p === kw.length ? 5 : 0));
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = cat.id;
      }
    }
  }
  return best;
}
