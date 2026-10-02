// Výchozí kategorie a klíčová slova. Slova se porovnávají bez diakritiky
// a podle společného začátku (rohlík ~ rohlíky), takže stačí základní tvar.
// Kategorie i slova jdou upravit v aplikaci (Nastavení).
// Pořadí odpovídá uličkám v obchodě.
export const DEFAULT_CATEGORIES = [
  {
    id: "ovoce",
    name: "Ovoce",
    keywords: ["jablko", "jablka", "hruška", "banán", "pomeranč", "mandarinka", "citron",
      "limetka", "hrozny", "hroznové víno", "jahody", "borůvky", "maliny", "ostružiny",
      "meloun", "kiwi", "ananas", "mango", "avokádo", "broskev", "nektarinka", "meruňka",
      "švestky", "třešně", "višně", "grep", "granátové", "fíky", "datle", "ovoce"],
  },
  {
    id: "zelenina",
    name: "Zelenina",
    keywords: ["brambory", "cibule", "česnek", "mrkev", "petržel", "celer", "rajče",
      "rajčata", "okurka", "paprika", "salát", "ledový", "rukola", "špenát", "brokolice",
      "květák", "zelí", "kedluben", "cuketa", "lilek", "dýně", "houby", "žampiony", "pórek",
      "ředkvičky", "kukuřice", "bylinky", "pažitka", "kopr", "bazalka", "zázvor", "řepa",
      "batáty", "jarní cibulka", "polníček", "chřest", "zelenina"],
  },
  {
    id: "mlecne",
    name: "Mléčné a vejce",
    keywords: ["mléko", "máslo", "jogurt", "sýr", "tvaroh", "smetana", "šlehačka", "kefír",
      "podmáslí", "vejce", "vajíčka", "vajec", "eidam", "gouda", "mozzarella", "parmazán",
      "hermelín", "niva", "cottage", "lučina", "pomazánka", "skyr", "zakysaná", "mascarpone",
      "ricotta", "jogurty", "termix", "pribináček", "lipánek", "žervé", "rama", "margarín"],
  },
  {
    id: "pecivo",
    name: "Pečivo",
    keywords: ["rohlík", "chleba", "chléb", "houska", "bageta", "kaiserka", "vánočka",
      "croissant", "koláč", "buchta", "toustový", "veka", "dalamánek", "pečivo", "tortilla",
      "loupák", "šáteček", "briošky"],
  },
  {
    id: "maso",
    name: "Maso a uzeniny",
    keywords: ["maso", "kuře", "kuřecí", "prsa", "stehna", "vepřové", "hovězí", "mleté",
      "krůtí", "šunka", "salám", "párky", "klobása", "slanina", "špekáčky", "sekaná",
      "játra", "ryba", "losos", "tuňák", "krevety", "filé", "kotleta", "plec", "krkovice",
      "uzené", "debrecínka", "vlašák", "pršut", "kabanos", "jitrnice", "tlačenka"],
  },
  {
    id: "mrazene",
    name: "Mražené",
    keywords: ["mražené", "mražená", "zmrzlina", "nanuk", "pizza", "hranolky", "led",
      "mražený", "mražená zelenina", "mražené ovoce", "mražená pizza", "rybí prsty", "knedlíky", "pelmeně", "nugety"],
  },
  {
    id: "trvanlive",
    name: "Trvanlivé",
    keywords: ["mouka", "cukr", "sůl", "pepř", "rýže", "těstoviny", "špagety", "olej",
      "ocet", "kečup", "hořčice", "majonéza", "konzerva", "fazole", "čočka", "hrách",
      "kuskus", "ovesné", "vločky", "müsli", "cornflakes", "med", "marmeláda", "džem",
      "nutella", "čokoláda", "sušenky", "oplatky", "chipsy", "brambůrky", "ořechy",
      "mandle", "rozinky", "kakao", "káva", "čaj", "kypřící", "prášek do pečiva", "droždí",
      "koření", "paprika mletá", "bujón", "polévka", "omáčka", "protlak", "passata",
      "tuňák v konzervě", "sardinky", "pudink", "škrob", "strouhanka", "krupice",
      "kroupy", "olivy", "kukuřice v plechovce", "bonbony", "tyčinky", "popcorn", "sirup"],
  },
  {
    id: "drogerie",
    name: "Drogerie",
    keywords: ["toaletní papír", "papír", "kapesníky", "ubrousky", "utěrky", "mýdlo",
      "šampon", "kondicionér", "sprchový", "gel", "zubní pasta", "pasta", "kartáček",
      "deodorant", "prací", "prášek", "aviváž", "jar", "saponát", "čistič", "savo",
      "houbičky", "pytle", "sáčky", "alobal", "fólie", "pečicí", "plenky", "vlhčené",
      "krém", "vatové", "tampony", "vložky", "holítka", "žiletky", "baterie", "žárovka",
      "tablety do myčky", "sůl do myčky", "leštidlo", "krém na ruce"],
  },
  {
    id: "napoje",
    name: "Nápoje",
    keywords: ["voda", "minerálka", "sodovka", "džus", "šťáva", "limonáda", "kola",
      "pivo", "víno", "prosecco", "rum", "vodka", "slivovice", "tonic", "sirup",
      "mattoni", "ice tea", "energy", "nápoj", "nealko"],
  },
  {
    id: "ostatni",
    name: "Ostatní",
    keywords: [],
  },
];

export const FALLBACK_CATEGORY = "ostatni";
