# 🛒 Nákupní seznam

Webová aplikace na nákupní seznam z diktování. Ťukneš na 🎤, vyjmenuješ, co koupit, a položky se samy roztřídí do kategorií v pořadí uliček v obchodě.

## Jak to funguje

- **Diktování:** Web Speech API v češtině (Chrome / Safari). Seznam stačí vyjmenovat jedním dechem („mléko chleba dvě másla kuřecí prsa prášek do pečiva“). Aplikace ho rozdělí po slovech a pohromadě nechá množství, přídavná jména a předložky („dvě másla“, „kuřecí prsa“, „prášek do pečiva“). Před přidáním se ukáže náhled. Co k sobě patří a rozdělilo se („sýr / eidam“), spoj na jeden řádek a aplikace si to zapamatuje.
- **Třídění:** podle klíčových slov v `categories.js` (porovnává se bez diakritiky a podle začátku slova, takže „rohlík“ najde i „rohlíky“). Když položku přes ⋯ přesuneš do jiné kategorie, aplikace si to zapamatuje.
- **Koupeno:** ťuknutím se položka přeškrtne, zešedne a sjede na konec kategorie. Dalším ťuknutím (nebo „Vrátit“ v liště) se vrátí.
- **Úklid:** před diktováním se aplikace zeptá, jestli smazat koupené věci z minula (nekoupené zůstanou). Koupené se navíc samy mažou po nastavené době (výchozí 12 h).
- **Duplicity:** položka, která už na seznamu je, se nepřidá znovu. Pokud už byla koupená, vrátí se mezi nekoupené.
- **Offline / PWA:** stránku jde přidat na plochu telefonu.

## Sdílení mezi telefony (Firebase)

Bez nastavení se seznam ukládá jen v prohlížeči. Pro sdílení:

1. Na <https://console.firebase.google.com> vytvoř projekt (Analytics není potřeba).
2. **Build → Firestore Database → Create database** (production mode, region `eur3` nebo `europe-west`).
3. V záložce **Rules** nahraď pravidla obsahem souboru `firestore.rules` a dej **Publish**.
4. **Project settings → Your apps → Web (`</>`)**, zaregistruj aplikaci a zkopíruj objekt `firebaseConfig`.
5. Vlož ho do `firebase-config.js` místo `null`:
   ```js
   export const FIREBASE_CONFIG = { apiKey: "…", authDomain: "…", projectId: "…", … };
   ```
6. Commitni a pushni. V aplikaci se objeví tlačítko 🔗. Odkaz z něj pošli ostatním a otevře se jim stejný seznam.

Konfigurace Firebase není tajná. Seznam chrání jeho náhodné ID v odkazu: kdo odkaz nemá, seznam nenajde.

## Lokální spuštění

```bash
python3 -m http.server 8765
```

Pak otevři <http://localhost:8765>.
