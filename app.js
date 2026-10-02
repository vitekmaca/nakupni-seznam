import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from "./categories.js";
import { splitItems, splitDictation, itemKey, categorize, normalize } from "./parse.js";
import { createStore } from "./store.js";

const $ = (sel) => document.querySelector(sel);
const HOUR = 3600 * 1000;

const DEFAULT_META = {
  categories: DEFAULT_CATEGORIES,
  learned: {},
  phrases: [], // víceslovné položky, které se při diktování nemají rozdělit
  autoDeleteHours: 12,
};

// ---------- pomocné ----------

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function randomListId() {
  const abc = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

function pref(name, value) {
  const key = "nakupni-seznam:pref:" + name;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Seznam se dá sdílet odkazem: …/#l=<id>. Kdo má odkaz, vidí a upravuje stejný seznam.
function resolveListId() {
  const fromHash = new URLSearchParams(location.hash.slice(1)).get("l");
  const id = fromHash || pref("listId") || randomListId();
  pref("listId", id);
  if (fromHash) history.replaceState(null, "", location.pathname + location.search);
  return id;
}

// ---------- stav ----------

const listId = resolveListId();
const store = await createStore(listId, DEFAULT_META);
let hideBought = pref("hideBought") ?? false;

const categories = () => store.meta.categories?.length ? store.meta.categories : DEFAULT_CATEGORIES;

function categoryOf(item) {
  const cats = categories();
  if (cats.some((c) => c.id === item.cat)) return item.cat;
  return cats.some((c) => c.id === FALLBACK_CATEGORY) ? FALLBACK_CATEGORY : cats[cats.length - 1].id;
}

// ---------- vykreslení ----------

let flashIds = new Set();

function render() {
  const items = Object.values(store.items);
  const open = items.filter((i) => !i.bought);
  const bought = items.filter((i) => i.bought);
  $("#count").textContent = items.length ? `${open.length} zbývá` : "";
  $("#hide-bought").checked = hideBought;

  const list = $("#list");
  if (!items.length) {
    list.innerHTML = `<div class="empty"><span class="big">🛒</span>Seznam je prázdný.<br>Ťukni na 🎤 a nadiktuj, co koupit.</div>`;
    return;
  }

  let html = "";
  for (const cat of categories()) {
    const inCat = items.filter((i) => categoryOf(i) === cat.id);
    const openHere = inCat.filter((i) => !i.bought).sort((a, b) => a.addedAt - b.addedAt);
    const boughtHere = inCat.filter((i) => i.bought).sort((a, b) => a.boughtAt - b.boughtAt);
    const shown = hideBought ? openHere : [...openHere, ...boughtHere];
    if (!shown.length) continue;
    html += `<section class="cat"><h2>${escapeHtml(cat.name)}</h2><ul>`;
    for (const it of shown) {
      const cls = ["item", it.bought && "bought", flashIds.has(it.id) && "flash"].filter(Boolean).join(" ");
      html += `<li class="${cls}" data-id="${it.id}">
        <button class="tap" data-act="toggle" aria-pressed="${!!it.bought}">
          <span class="check">${it.bought ? "✓" : ""}</span>
          <span class="name">${escapeHtml(it.name)}</span>
        </button>
        <button class="more" data-act="edit" aria-label="Upravit ${escapeHtml(it.name)}">⋯</button>
      </li>`;
    }
    html += `</ul></section>`;
  }
  if (hideBought && bought.length) {
    html += `<p class="hidden-note">Skryto ${bought.length} koupených · <button class="text-btn" data-act="show-bought">zobrazit</button></p>`;
  }
  if (!html) html = `<div class="empty"><span class="big">🎉</span>Všechno koupeno!</div>`;
  list.innerHTML = html;
  flashIds = new Set();
}

store.onChange(render);

// ---------- koupeno / vrátit ----------

let toastTimer;
let toastUndo = null;

function toast(text, undo) {
  $("#toast-text").textContent = text;
  toastUndo = undo;
  $("#toast-undo").hidden = !undo;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5000);
}

$("#toast-undo").addEventListener("click", () => {
  $("#toast").hidden = true;
  toastUndo?.();
  toastUndo = null;
});

function toggleBought(id) {
  const it = store.items[id];
  if (!it) return;
  if (it.bought) {
    flashIds.add(id);
    store.patchItem(id, { bought: false, boughtAt: null });
  } else {
    store.patchItem(id, { bought: true, boughtAt: Date.now() });
    toast(`✓ ${it.name}`, () => {
      flashIds.add(id);
      store.patchItem(id, { bought: false, boughtAt: null });
    });
  }
}

$("#list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.closest(".item")?.dataset.id;
  if (btn.dataset.act === "toggle") toggleBought(id);
  else if (btn.dataset.act === "edit") openItemDialog(id);
  else if (btn.dataset.act === "show-bought") setHideBought(false);
});

function setHideBought(v) {
  hideBought = v;
  pref("hideBought", v);
  render();
}
$("#hide-bought").addEventListener("change", (e) => setHideBought(e.target.checked));

// ---------- automatické mazání koupených ----------

function autoCleanup() {
  const h = Number(store.meta.autoDeleteHours) || 0;
  if (!h) return;
  const limit = Date.now() - h * HOUR;
  const old = Object.values(store.items).filter((i) => i.bought && i.boughtAt && i.boughtAt < limit);
  if (old.length) store.deleteItems(old.map((i) => i.id));
}
autoCleanup();
setInterval(autoCleanup, 5 * 60 * 1000);

// ---------- nový nákup ----------

function askNewShopping({ fromMic }) {
  const items = Object.values(store.items);
  const bought = items.filter((i) => i.bought).length;
  $("#new-summary").textContent =
    `Na seznamu je ${items.length - bought} nekoupených a ${bought} koupených položek.`;
  $("#new-keep").hidden = !fromMic;
  const dlg = $("#dlg-new");
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => {
    dlg.addEventListener("close", () => resolve(dlg.returnValue || "cancel"), { once: true });
  });
}

async function clearList(mode) {
  const items = Object.values(store.items);
  const toDelete = mode === "all" ? items : items.filter((i) => i.bought);
  if (!toDelete.length) return;
  await store.deleteItems(toDelete.map((i) => i.id));
  toast(`Smazáno ${toDelete.length} položek`, () => store.putItems(toDelete));
}

$("#btn-new").addEventListener("click", async () => {
  if (!Object.keys(store.items).length) return toast("Seznam je už prázdný");
  const choice = await askNewShopping({ fromMic: false });
  if (choice === "bought" || choice === "all") clearList(choice);
});

// ---------- přidávání položek ----------

function addItems(names) {
  const existing = new Map(Object.values(store.items).map((i) => [i.key, i]));
  const now = Date.now();
  const fresh = [];
  let revived = 0;
  for (const name of names) {
    const key = itemKey(name);
    if (!key) continue;
    const dup = existing.get(key);
    if (dup) {
      // Už na seznamu: pokud bylo koupené, vrátí se mezi nekoupené.
      if (dup.bought) {
        store.patchItem(dup.id, { bought: false, boughtAt: null, name });
        flashIds.add(dup.id);
        revived++;
      }
      continue;
    }
    const item = {
      id: uid(),
      name,
      key,
      cat: categorize(name, categories(), store.meta.learned || {}) || FALLBACK_CATEGORY,
      bought: false,
      boughtAt: null,
      addedAt: now + fresh.length,
    };
    existing.set(key, item);
    fresh.push(item);
    flashIds.add(item.id);
  }
  if (fresh.length) store.putItems(fresh);
  const parts = [];
  if (fresh.length) parts.push(`Přidáno ${fresh.length}`);
  if (revived) parts.push(`vráceno ${revived}`);
  if (parts.length) toast(parts.join(", "));
  else if (names.length) toast("Všechno už na seznamu je");
}

// ---------- diktování ----------

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let recording = false;

function setRecording(on) {
  recording = on;
  $("#add-mic").classList.toggle("recording", on);
  $("#btn-mic").classList.toggle("recording", on);
  $("#add-title").textContent = on ? "Poslouchám…" : "Zkontroluj seznam";
  if (!on) $("#add-interim").textContent = "";
}

// Víceslovné výrazy, které se mají držet pohromadě: ze slovníku, naučené kategorie
// i položky, které uživatel v náhledu spojil na jeden řádek.
function knownPhrases() {
  const fromCats = categories().flatMap((c) => c.keywords.map(normalize));
  const fromLearned = Object.keys(store.meta.learned || {});
  return [...fromCats, ...fromLearned, ...(store.meta.phrases || [])].filter((p) => p.includes(" "));
}

// Když uživatel nechal na řádku víc slov, která by diktování rozdělilo, zapamatuj si je.
function learnPhrases(names) {
  const known = new Set(knownPhrases());
  const fresh = names
    .filter((n) => splitDictation(n, [...known]).length > 1)
    .map(itemKey)
    .filter((k) => k.includes(" ") && !known.has(k));
  if (fresh.length) store.patchMeta({ phrases: [...(store.meta.phrases || []), ...new Set(fresh)] });
}

function appendText(chunk) {
  const lines = splitDictation(chunk, knownPhrases());
  if (!lines.length) return;
  const ta = $("#add-text");
  const cur = ta.value.replace(/\s+$/, "");
  ta.value = (cur ? cur + "\n" : "") + lines.join("\n") + "\n";
  ta.scrollTop = ta.scrollHeight;
  updatePreview();
}

function startRecognition() {
  if (!SpeechRecognition) {
    $("#add-hint").textContent =
      "Tento prohlížeč neumí diktování (zkus Chrome nebo Safari). Napiš položky ručně, každou na řádek.";
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "cs-CZ";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      // Každý hotový úsek (po pauze) = samostatná položka/položky.
      if (r.isFinal) appendText(r[0].transcript);
      else interim += r[0].transcript;
    }
    $("#add-interim").textContent = interim;
  };
  recognition.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      $("#add-hint").textContent = "Prohlížeč nemá povolený mikrofon. Povol ho v nastavení stránky.";
      stopRecognition();
    }
  };
  recognition.onend = () => {
    // Některé prohlížeče (hlavně iOS) nahrávání samy ukončí – pokračujeme dál.
    if (recording) {
      try {
        recognition.start();
      } catch {
        setRecording(false);
      }
    }
  };
  try {
    recognition.start();
    setRecording(true);
  } catch {
    setRecording(false);
  }
}

function stopRecognition() {
  setRecording(false);
  try {
    recognition?.stop();
  } catch {}
  recognition = null;
}

function catName(id) {
  return categories().find((c) => c.id === id)?.name ?? "Ostatní";
}

function pendingNames() {
  return splitItems($("#add-text").value);
}

function updatePreview() {
  const learned = store.meta.learned || {};
  $("#add-preview").innerHTML = pendingNames()
    .map((n) => {
      const cat = categorize(n, categories(), learned);
      return `<li><span>${escapeHtml(n)}</span><span class="pc ${cat ? "" : "unknown"}">${escapeHtml(cat ? catName(cat) : "Ostatní ?")}</span></li>`;
    })
    .join("");
}
$("#add-text").addEventListener("input", updatePreview);

function openAddDialog({ dictate }) {
  $("#add-text").value = "";
  $("#add-interim").textContent = "";
  $("#add-hint").textContent = dictate
    ? "Vyjmenuj, co koupit, klidně jedním dechem. Pak ťukni na 🎤 a zkontroluj řádky – co k sobě patří, spoj na jeden řádek."
    : "Napiš položky, každou na nový řádek (nebo odděl čárkou).";
  $("#add-title").textContent = dictate ? "Poslouchám…" : "Přidat položky";
  $("#add-mic").hidden = !SpeechRecognition;
  updatePreview();
  $("#dlg-add").showModal();
  if (dictate) startRecognition();
  else $("#add-text").focus();
}

$("#dlg-add").addEventListener("close", stopRecognition);
$("#add-mic").addEventListener("click", () => (recording ? stopRecognition() : startRecognition()));
$("#add-confirm").addEventListener("click", () => {
  stopRecognition();
  const names = pendingNames();
  $("#dlg-add").close();
  learnPhrases(names);
  addItems(names);
});

$("#btn-mic").addEventListener("click", async () => {
  // Před diktováním nabídni úklid, pokud zůstaly koupené věci z minula.
  const hasBought = Object.values(store.items).some((i) => i.bought);
  if (hasBought) {
    const choice = await askNewShopping({ fromMic: true });
    if (choice === "cancel") return;
    if (choice === "bought" || choice === "all") await clearList(choice);
  }
  openAddDialog({ dictate: true });
});
$("#btn-type").addEventListener("click", () => openAddDialog({ dictate: false }));

// ---------- úprava položky ----------

let editingId = null;
let editingCat = null;

function renderItemCats() {
  $("#item-cats").innerHTML = categories()
    .map((c) => `<button type="button" class="chip ${c.id === editingCat ? "active" : ""}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)
    .join("");
}

function openItemDialog(id) {
  const it = store.items[id];
  if (!it) return;
  editingId = id;
  editingCat = categoryOf(it);
  $("#item-name").value = it.name;
  renderItemCats();
  $("#dlg-item").showModal();
}

$("#item-cats").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-cat]");
  if (!chip) return;
  editingCat = chip.dataset.cat;
  renderItemCats();
});

$("#item-save").addEventListener("click", () => {
  const it = store.items[editingId];
  const name = $("#item-name").value.trim();
  if (it && name) {
    const key = itemKey(name);
    store.patchItem(it.id, { name, key, cat: editingCat });
    if (editingCat !== categoryOf(it) || key !== it.key) {
      // Zapamatuj si kategorii pro příště.
      store.patchMeta({ learned: { ...(store.meta.learned || {}), [key]: editingCat } });
    }
  }
  $("#dlg-item").close();
});

$("#item-delete").addEventListener("click", () => {
  const it = store.items[editingId];
  $("#dlg-item").close();
  if (!it) return;
  store.deleteItems([it.id]);
  toast(`Smazáno: ${it.name}`, () => store.putItems([it]));
});

// ---------- nastavení ----------

let draftCats = [];

function renderCatEditor() {
  $("#set-cats").innerHTML = draftCats
    .map(
      (c, i) => `<div class="cat-edit" data-i="${i}">
        <div class="head">
          <input type="text" data-f="name" value="${escapeHtml(c.name)}" aria-label="Název kategorie">
          <button type="button" data-a="up" aria-label="Nahoru" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-a="down" aria-label="Dolů" ${i === draftCats.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" data-a="del" aria-label="Smazat kategorii">🗑</button>
        </div>
        <textarea data-f="keywords" rows="2" placeholder="klíčová slova, oddělená čárkou">${escapeHtml(c.keywords.join(", "))}</textarea>
      </div>`
    )
    .join("");
}

$("#set-cats").addEventListener("input", (e) => {
  const box = e.target.closest(".cat-edit");
  if (!box) return;
  const c = draftCats[Number(box.dataset.i)];
  if (e.target.dataset.f === "name") c.name = e.target.value;
  if (e.target.dataset.f === "keywords")
    c.keywords = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
});

$("#set-cats").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-a]");
  if (!btn) return;
  const i = Number(btn.closest(".cat-edit").dataset.i);
  const a = btn.dataset.a;
  if (a === "up" && i > 0) [draftCats[i - 1], draftCats[i]] = [draftCats[i], draftCats[i - 1]];
  if (a === "down" && i < draftCats.length - 1) [draftCats[i + 1], draftCats[i]] = [draftCats[i], draftCats[i + 1]];
  if (a === "del") {
    if (draftCats.length <= 1) return;
    if (!confirm(`Smazat kategorii „${draftCats[i].name}“? Její položky se přesunou do Ostatní.`)) return;
    draftCats.splice(i, 1);
  }
  renderCatEditor();
});

$("#set-add-cat").addEventListener("click", () => {
  draftCats.push({ id: "c-" + uid().slice(0, 8), name: "Nová kategorie", keywords: [] });
  renderCatEditor();
  const inputs = $("#set-cats").querySelectorAll('input[data-f="name"]');
  inputs[inputs.length - 1]?.select();
});

$("#btn-settings").addEventListener("click", () => {
  draftCats = structuredClone(categories());
  renderCatEditor();
  $("#set-autodelete").value = String(store.meta.autoDeleteHours ?? 12);
  $("#set-sync").textContent =
    store.mode === "firebase"
      ? `Seznam se synchronizuje mezi zařízeními. Pro sdílení použij 🔗 nahoře. (ID: ${listId})`
      : "Seznam je uložený jen v tomto prohlížeči (sdílení zatím není nastavené).";
  $("#dlg-settings").showModal();
});

$("#set-save").addEventListener("click", () => {
  const cats = draftCats
    .map((c) => ({ ...c, name: c.name.trim() }))
    .filter((c) => c.name);
  if (cats.length) store.patchMeta({ categories: cats, autoDeleteHours: Number($("#set-autodelete").value) });
  $("#dlg-settings").close();
  autoCleanup();
});

$("#set-reset-learned").addEventListener("click", () => {
  const n = Object.keys(store.meta.learned || {}).length;
  if (!n) return toast("Nic naučeného zatím není");
  if (!confirm(`Zapomenout ${n} naučených zařazení?`)) return;
  // Firestore merge neumí smazat klíče mapy, proto přepíšeme prázdnými hodnotami.
  const cleared = Object.fromEntries(Object.keys(store.meta.learned).map((k) => [k, null]));
  store.patchMeta({ learned: cleared });
  toast("Naučená zařazení smazána");
});

// ---------- sdílení ----------

if (store.mode === "firebase") {
  $("#btn-share").hidden = false;
  $("#btn-share").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#l=${listId}`;
    try {
      if (navigator.share) await navigator.share({ title: "Nákupní seznam", url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Odkaz zkopírován – pošli ho, s kým chceš seznam sdílet");
      }
    } catch {}
  });
}

// ---------- PWA ----------

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();

// pro ladění v konzoli
window.__nakup = { store, normalize, appendText };
