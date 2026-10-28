# LANKA TURNAJ U VEVERKŮ 2027

## Základní přehled
- Formát série: Best of 5 (Bo5 na velké body)
- Cíl: Získat jako první 3 velké body
- Týmy: Modrý tým vs. Červený tým (5v5)
- Rozmístění: Face-to-Face (dvě řady hráčů naproti sobě přes stůl)
- Bodování: Každá disciplína = 1 velký bod (remíza v disciplíně není možná)

---

## Harmonogram a pravidla disciplín

### 1. Counter-Strike 2
- Formát: **Best of 3 (Bo3 na mapy)**
- Režim: Kompetitivní zápas
- Výběr map: Bude dořešeno
- Vítěz disciplíny (1 velký bod): Tým, který vyhraje 2 mapy
- Zvláštní pravidlo: Zákaz stoupat si ze židle nebo nahlížet přes monitory během rozehraného kola

### 2. Warcraft III
- Formát: V řešení
- Stav: Bude upřesněno

--- PAUZA NA OBĚD ---

### 3. League of Legends
- Formát: **Best of 3 (Bo3 na hry)**
- Mapa: Summoner's Rift
- Režim: Tournament Draft
- Volba strany: Poražený z CS2 volí stranu pro 1. hru
- Vítěz disciplíny (1 velký bod): Tým, který vyhraje 2 hry
- Zvláštní pravidlo: Zákaz screen-peekingu přes monitory soupeře

### 4. Overwatch 2 *(hraje se pouze za stavu 2:1 nebo 1:2)*
- Formát: V řešení
- Stav: Bude upřesněno

### 5. Wreckfest *(hraje se pouze za stavu 2:2)*
- Formát: V řešení
- Stav: Bude upřesněno

---

## Draftování týmů
- Průběh: Kapitáni červeného a modrého týmu si hodí mincí o to, kdo bude začínat. Začínající si vybere jednoho hráče do svého týmu a poté druhý kapitán si vybere dva hráče. Poté si už vždy výbírají po dvou hráčích, dokud nezbyde jeden a ten se automaticky přidá na stranu posledního, který si vybíral. Tedy systém **A - BB - AA - BB - A**.

## Technická a věcná organizace (Checklisty)

### Technický checklist
- [x] **Mumble server (komunikace):** Založen a nakonfigurován na Raspberry Pi.
- [ ] **Zapojení Raspberry Pi:** Propojit přes HDMI do televize (bude zobrazovat live scoreboard web a na pozadí hostovat Mumble).
- [x] **Síťová infrastruktura (Switche):** 2× 8portový gigabitový switch (1 pro Modrý tým, 1 pro Červený tým).
- [x] **Síťová kabeláž (Přívody):** 2× dlouhý ethernet kabel od routeru ke switchům na obou stolech.
- [ ] **Napájení a okruhy (Elektřina):**
  - Rozdělit zátěž do 2 samostatných jističů/okruhů (obývák vs. kuchyň).
  - Připravit prodlužovačky pro celkem minimálně 20–22 zásuvek (striktně 2 zásuvky na hráče: 1× PC + 1× monitor; rezerva na RPi a router).
- [ ] **Pásky na kabely:** Zafixovat dlouhé kabely a přívody k podlaze (textilní gaffa tape / tesa páska, ať nikdo nezakopne).
- [ ] **Označení vlastní kabeláže:** Označit organizátorské kabely proužkem barevné pásky na obou koncích (odlišení od kabelů hráčů).

### Obecný a organizační checklist
- [ ] **Webová aplikace pro TV:** Vyvinout jednoduchý live scoreboard web běžící na RPi (zobrazení aktuálního stavu série a her).
- [ ] **Oběd:** Vymyslet a naplánovat jídlo pro 10 lidí (snadné na servírování, nerozhodí časový harmonogram).
- [ ] **Kapesníky:** Připravit krabičky s kapesníky do obou týmových pokojů i do obývacího pokoje k herním stolům.

### Vybavení týmových pokojů (pro každý pokoj)
- [ ] **Základní pitný režim:** Karafy/džbány s čerstvou vodou + 5 skleniček pro tým.
- [ ] **Pohodlné sezení pro 5 lidí:** Židle, křesla, sedací vaky nebo matrace s polštáři, aby si celá pětka mohla sednout do kruhu na poradu.
- [ ] **Taktická tabule:** Whiteboard / flipchart + funkční fixy (ideálně 2 barvy) a hadřík na mazání.
- [ ] **Vytištěné půdorysy map (Cheat sheets):**
  - CS2 mapy s vyznačenými pozicemi (callouts).
  - LoL mapa (Summoner's Rift) s vyznačenými zónami a objektivy.
- [ ] **Hygiena:** Krabička papírových kapesníků.

---

## Dekorace a atmosféra

### Světelný setup (4× RGB žárovka + 2× LED pásek)
- **LED pásky (Pod stoly):**
  - 1× modrý LED pásek pod spodní hranu stolu Modrého týmu (podsvícení podlahy).
  - 1× červený LED pásek pod spodní hranu stolu Červeného týmu (podsvícení podlahy).
- **RGB žárovky (Vše v obýváku):**
  - 2× žárovka do středového tunelu mezi zády monitorů (modrá a červená pro nepřímý glow za obrazovkami).
  - 2× žárovka do rohů místnosti za záda týmů (nasvícení stěn za hráči v týmových barvách).

### Barevné rozlišení židlí (Prodyšné a tiché)
- **Bavlněná trička na opěradla:** 5 modrých a 5 červených jednobarevných triček navlečených shora přes opěradla (nebo týmový dress code hráčů).
- Žádné plastové pytle (šustění do mikrofonu, neprodyšnost).

### Herní a tematické detaily
- **Potion stoly v kuchyňce:** Karafy označené RPG cedulkami `+50 MANA` (modrá voda/sirup) a `+50 HP` (červená voda/sirup).
- **Hráčské jmenovky (Nameplates):** Kartonové stříšky před monitory s nickem hráče, rolí a údaji na Mumble/Wi-Fi ze zadní strany.
- **Krepový papír:** Zavěšené pruhy/stuhy nad osou stolů jako dělicí linie arény a orámování dveří do War Rooms.
- **Loot Boxy na snacky:** Krabice polepené nápisy `SUPPLY DROP` / `AMMO` na pochutiny.

---

## Občerstvení a nápoje

### Zajišťuje organizátor
- **Základní pitný režim:**
  - Velké karafy/džbány s čistou vodou (s citronem/mátou) – průběžně doplňované v obýváku i pokojích.
  - Káva a čaj k dispozici v kuchyňce po celý den.
- **Zdravější pochutiny (stabilní energie, čisté prsty):**
  - Směsi ořechů a sušeného ovoce (kešu, mandle, rozinky, brusinky).
  - Čerstvé ovoce na kousky (hroznové víno bez pecek, banány, jablka).
  - Sušené maso (Beef Jerky).
  - Nesmažené slané tyčinky / mini preclíky.
- **Klasické / nezdravé pochutiny na chuť a morálku:**
  - Gumoví medvídci / želé bonbony (rychlý hroznový cukr před rozhodující mapou).
  - Čokoládové tyčinky / sušenky na doplnění kalorií.
  - Slané krekry / chipsy a nachos (doporučeno konzumovat v kuchyni nebo v týmových pokojích, ne přímo nad klávesnicemi).

### Přináší si každý hráč sám
- **Vlastní oblíbené pití:** Energetické nápoje, Birelly/nealko pivo, coly, džusy nebo cokoliv dalšího podle osobní preference.

---

## Requirements pro hráče (Co mít s sebou a připravené)

### Hardware a výbava na místo
- [ ] **Herní PC / Notebook** + napájecí kabely.
- [ ] **Monitor** + napájecí kabel + videokabel (HDMI/DisplayPort).
- [ ] **Periferie:** Klávesnice, myš, podložka pod myš.
- [ ] **Ethernet patch kabel:** Každý hráč vlastní kabel (délka 2–3 m) pro propojení PC do týmového switche.
- [ ] **SLUCHÁTKA S KVALITNÍM MIKROFONEM:** Naprostá nutnost! V místnosti bude 10 nahlas mluvících lidí. Mikrofon musí mít dobré směrové snímání / potlačení okolního hluku a nesmí chytat repro ani souseda vedle.
- [ ] **POVINNĚ UZAVÍRATELNÁ LAHEV NA STŮL:** Vlastní sportovní shaker, cyklolahev nebo šroubovací PET lahev na vodu. Otevřené kelímky, sklenice a otevřené plechovky mají na herní stůl přísný zákaz!
- [ ] **Vlastní pití:** Každý si doveze své oblíbené pití (energeťáky, pivo, limonády) na celý den.

### Software a instalace (VŠECHNO PŘEDEM DOMA!)
- [ ] **Mumble klient:** Nainstalovaný a otestovaný zvuk (nastavený Push-to-Talk nebo striktní Noise Suppression).
- [ ] **Counter-Strike 2:** Plně staženo a aktualizováno.
- [ ] **Warcraft III:** Nainstalovaná shodná verze (bude upřesněno).
- [ ] **League of Legends:** Aktualizovaný klient + funkční Riot Vanguard (otestováno po restartu PC).
- [ ] **Overwatch 2:** Plně staženo přes Battle.net (ověřený přístup na účet).
- [ ] **Wreckfest:** Nainstalováno přes Steam.