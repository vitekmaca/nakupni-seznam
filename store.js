// Úložiště seznamu. Stejné rozhraní pro lokální režim (localStorage)
// i sdílený režim (Firebase Firestore, synchronizace mezi zařízeními).
//
//   store.items  – { [id]: {id, name, key, cat, bought, boughtAt, addedAt} }
//   store.meta   – { categories, learned, autoDeleteHours }
//   store.onChange(callback)
//   putItems(items), patchItem(id, patch), deleteItems(ids), patchMeta(patch)

import { FIREBASE_CONFIG } from "./firebase-config.js";

// Stejná verze musí být i v sw.js (kvůli offline).
const FIREBASE_VERSION = "10.14.1";

class LocalStore {
  constructor(listId, defaultMeta) {
    this.mode = "local";
    this.key = "nakupni-seznam:" + listId;
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(this.key));
    } catch {}
    this.items = saved?.items ?? {};
    this.meta = { ...defaultMeta, ...(saved?.meta ?? {}) };
    this.listeners = [];
  }
  async init() {}
  onChange(fn) {
    this.listeners.push(fn);
  }
  _commit() {
    try {
      localStorage.setItem(this.key, JSON.stringify({ items: this.items, meta: this.meta }));
    } catch {}
    this.listeners.forEach((fn) => fn());
  }
  async putItems(items) {
    for (const it of items) this.items[it.id] = it;
    this._commit();
  }
  async patchItem(id, patch) {
    if (!this.items[id]) return;
    this.items[id] = { ...this.items[id], ...patch };
    this._commit();
  }
  async deleteItems(ids) {
    for (const id of ids) delete this.items[id];
    this._commit();
  }
  async patchMeta(patch) {
    this.meta = { ...this.meta, ...patch };
    this._commit();
  }
}

class FirebaseStore {
  constructor(listId, defaultMeta) {
    this.mode = "firebase";
    this.listId = listId;
    this.defaultMeta = defaultMeta;
    this.items = {};
    this.meta = { ...defaultMeta };
    this.listeners = [];
  }

  async init() {
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
    const { initializeApp } = await import(`${base}/firebase-app.js`);
    const fs = await import(`${base}/firebase-firestore.js`);
    this.fs = fs;
    const app = initializeApp(FIREBASE_CONFIG);
    // Lokální cache: seznam funguje i bez signálu v obchodě a dosynchronizuje se později.
    this.db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
    this.listRef = fs.doc(this.db, "lists", this.listId);
    this.itemsRef = fs.collection(this.listRef, "items");

    let firstMeta = true;
    let metaCreated = false;
    await new Promise((resolve) => {
      let pending = 2;
      const done = () => --pending === 0 && resolve();
      fs.onSnapshot(this.listRef, (snap) => {
        if (snap.exists()) {
          this.meta = { ...this.defaultMeta, ...snap.data() };
        } else if (!metaCreated && !snap.metadata.fromCache) {
          metaCreated = true;
          this._write(fs.setDoc(this.listRef, this.defaultMeta));
        }
        if (firstMeta) {
          firstMeta = false;
          done();
        }
        this._emit();
      }, (err) => this._fail(err));
      let firstItems = true;
      fs.onSnapshot(this.itemsRef, (snap) => {
        const items = {};
        snap.forEach((d) => (items[d.id] = d.data()));
        this.items = items;
        if (firstItems) {
          firstItems = false;
          done();
        }
        this._emit();
      }, (err) => this._fail(err));
    });
  }

  _fail(err) {
    console.error("Firestore:", err);
  }
  // Na potvrzení serveru se nečeká: bez signálu by nepřišlo a aplikace by stála.
  // Změna se ukáže hned a odešle se, jakmile bude spojení.
  _write(promise) {
    promise.catch((err) => this._fail(err));
  }

  onChange(fn) {
    this.listeners.push(fn);
  }
  _emit() {
    this.listeners.forEach((fn) => fn());
  }
  async putItems(items) {
    const batch = this.fs.writeBatch(this.db);
    for (const it of items) batch.set(this.fs.doc(this.itemsRef, it.id), it);
    this._write(batch.commit());
  }
  async patchItem(id, patch) {
    this._write(this.fs.updateDoc(this.fs.doc(this.itemsRef, id), patch));
  }
  async deleteItems(ids) {
    const batch = this.fs.writeBatch(this.db);
    for (const id of ids) batch.delete(this.fs.doc(this.itemsRef, id));
    this._write(batch.commit());
  }
  async patchMeta(patch) {
    this.meta = { ...this.meta, ...patch };
    this._write(this.fs.setDoc(this.listRef, patch, { merge: true }));
  }
}

export async function createStore(listId, defaultMeta) {
  if (FIREBASE_CONFIG) {
    try {
      const store = new FirebaseStore(listId, defaultMeta);
      await store.init();
      return store;
    } catch (err) {
      console.error("Firebase se nepodařilo spustit, používám lokální úložiště.", err);
    }
  }
  const store = new LocalStore(listId, defaultMeta);
  await store.init();
  return store;
}

export const syncAvailable = () => Boolean(FIREBASE_CONFIG);
