# 🛒 Nákupní seznam

Webová aplikace na nákupní seznam z diktování. Ťukneš na 🎤, vyjmenuješ, co koupit, a položky se samy roztřídí do kategorií v pořadí uliček v obchodě.

## Jak to funguje

- **Diktování:** Web Speech API v češtině (Chrome / Safari). Seznam stačí vyjmenovat jedním dechem („mléko chleba dvě másla kuřecí prsa prášek do pečiva“). Aplikace ho rozdělí po slovech a pohromadě nechá množství, přídavná jména a předložky („dvě másla“, „kuřecí prsa“, „prášek do pečiva“). Před přidáním se ukáže náhled. Co k sobě patří a rozdělilo se („sýr / eidam“), spoj na jeden řádek a aplikace si to zapamatuje.
- **Třídění:** podle klíčových slov v `categories.js` (porovnává se bez diakritiky a podle začátku slova, takže „rohlík“ najde i „rohlíky“). Když položku přes ⋯ přesuneš do jiné kategorie, aplikace si to zapamatuje.
- **💡 Návrhy:** když nevíš, co ještě koupit. Ukáže minulý nákup a velký inspirační seznam (`staples.js`) po kategoriích, od nejčastěji kupovaných věcí. Ťuknutím položku přidáš, dalším ťuknutím odebereš. Aplikace si sama vede historii, co a jak často kupujete.
- **Přidání odkazem:** `…/nakupni-seznam/#pridat=Kefír,Gnocchi,Tofu` přidá položky do seznamu.
- **Koupeno:** ťuknutím se položka přeškrtne, zešedne a sjede na konec kategorie. Dalším ťuknutím (nebo „Vrátit“ v liště) se vrátí.
- **Úklid:** před diktováním se aplikace zeptá, jestli smazat koupené věci z minula (nekoupené zůstanou). Koupené se navíc samy mažou po nastavené době (výchozí 12 h).
- **Duplicity:** položka, která už na seznamu je, se nepřidá znovu. Pokud už byla koupená, vrátí se mezi nekoupené.
- **Offline / PWA:** stránku jde přidat na plochu telefonu a otevře se i bez signálu.

## Společný seznam v cloudu (Firebase)

Bez konfigurace se seznam ukládá jen v prohlížeči. S konfigurací mají všechna zařízení automaticky stejný seznam, změny se projeví hned a bez signálu se dožene synchronizace později. Nic se nesdílí ručně.

1. Na <https://console.firebase.google.com> vytvoř projekt (Analytics není potřeba).
2. **Build → Firestore Database → Create database** (production mode, region v Evropě, např. `eur3`).
3. V záložce **Rules** nahraď pravidla obsahem souboru `firestore.rules` a dej **Publish**.
4. **Project settings → Your apps → Web (`</>`)**, zaregistruj aplikaci a objekt `firebaseConfig` vlož do `firebase-config.js` místo `null`.
5. Commitni a pushni.

Přihlašování není potřeba. Přístup hlídá dlouhé ID seznamu v `firebase-config.js`, které je ale ve veřejném repozitáři: kdo si kód přečte, může seznam zobrazit nebo upravit.

## Lokální spuštění

```bash
python3 -m http.server 8765
```

Pak otevři <http://localhost:8765>.
