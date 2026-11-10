# Architektura a Průvodce: Pickovací Systém pro Turnajové Hry (Lanka)

Tento dokument slouží jako přesný standard a šablona pro vytváření pickovacích obrazovek pro další hry v turnaji (např. *Warcraft III*, *League of Legends*, *Overwatch 2*, *Wreckfest* apod.) tak, aby měly **100% identický vizuál, rozložení i chování** jako hotové CS2 pickování.

---

## 1. Jak funguje propojení celého turnaje

Každá pickovací aplikace komunikuje s celkovým přehledem turnaje v `score.html` prostřednictvím `localStorage`:

```
               [ cs.html / warcraft.html / ... ]
                               │
            1. Uloží výsledek do localStorage: 'lanka_pick_<gameId>'
            2. Předá data v odkazu: score.html?pick_<gameId>=... (zajišťuje přenos i přes file://)
                               │
                               ▼
                         [ score.html ]
   - Automaticky načte mapy a metadata (zobrazí náhledy v buňkách)
   - Uloží data do vlastního localStorage a vyčistí URL pro čistou adresu
   - Kliknutí na ikonu hry v hlavičce otevře příslušnou pickUrl
```

### Datový kontrakt pro `score.html`
Při dokončení (nebo po každém picku) se do `localStorage.setItem('lanka_pick_<gameId>', ...)` ukládá:
```json
{
  "game": "cs2",
  "teamA": "blue",
  "teamB": "red",
  "rounds": [
    {
      "round": 1,
      "mapId": "mirage",
      "mapName": "Mirage",
      "mapImage": "mirage.jpg",
      "metaTop": "Mirage",
      "metaBottom": "CT: MODRÝ",
      "ctTeam": "blue",
      "pickedBy": "blue"
    }
  ]
}
```
*Poznámka:* Pokud hra nemá strany (např. Warcraft nebo Wreckfest), `metaBottom` může být prázdné nebo nést např. `Výběr: Modrý tým`.

---

## 2. Co je potřeba zadat pro novou hru

Až budeš chtít vytvořit další hru, stačí mi napsat jen tyto základní parametry:

1. **ID hry a název** (např. `warcraft` – *Warcraft III*)
2. **Pool map / tratí / postav**:
   - Seznam položek (ID, název, název obrázku v `map_picks/<gameId>/`)
3. **Formát zápasu**:
   - BO3 (3 mapy) nebo BO5 (5 map)
4. **Sekvence postupu (kroky)**:
   - Rozstřel o právo první volby (Kámen-nůžky-papír)
   - Pořadí banů a picků (např. `Ban A -> Ban B -> Pick A -> Pick B -> Ban A -> Ban B -> Decider`)
5. **Má hra volbu stran?**
   - **Ano** (např. CS2 CT/T, LoL Modrá/Červená strana, Valorant Attack/Defense)
   - **Ne** (pouze výběr mapy – např. Warcraft III, Wreckfest)

---

## 3. Šablona souborů pro novou hru

Pro každou novou hru vznikne trojice souborů (nebo sdílené CSS):
- `<game>.html` – Čistá kostra layoutu
- `<game>.js`   – Konfigurace poolu, sekvence kroků a engine
- `<game>.css`  – Vizuální styly (vycházející přímo z `cs.css`)

### A. HTML kostra (`<game>.html`)
```html
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lanka 2027 — [Název Hry] Pickování</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,600;0,700;0,800;1,700;1,800&family=Orbitron:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="cs.css"> <!-- nebo sdílené pick.css -->
</head>
<body>
  <!-- Postranní bleskové pruhy (modrý vlevo, červený vpravo) -->
  <div class="side-panel side-panel-left" aria-hidden="true">
    <div class="side-surface side-surface-blue"></div>
    <svg class="side-edge side-edge-left" viewBox="0 0 50 1000" preserveAspectRatio="none">
      <path class="side-stroke side-stroke-blue" d="M0,0 L50,180 L10,210 L45,460 L0,490 L50,750 L15,780 L40,1000" />
    </svg>
  </div>
  <div class="side-panel side-panel-right" aria-hidden="true">
    <div class="side-surface side-surface-red"></div>
    <svg class="side-edge side-edge-right" viewBox="0 0 55 1000" preserveAspectRatio="none">
      <path class="side-stroke side-stroke-red" d="M15,0 L50,140 L20,160 L55,360 L25,390 L50,600 L12,630 L55,830 L25,860 L40,1000" />
    </svg>
  </div>

  <main class="container" id="mainContainer">
    <!-- Horní lišta: Indikátor týmu na řadě + HUD tlačítka -->
    <header class="top-header">
      <div class="top-turn-display" id="topTurnDisplay"></div>
      <div class="top-buttons-group">
        <button id="resetPickBtn" class="hud-action-btn" title="Resetovat pickování">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span>RESET PICKU</span>
        </button>
        <a href="score.html" class="hud-action-btn" title="Přejít na skóre">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>SKÓRE</span>
        </a>
        <button id="fullscreenBtn" class="hud-action-btn" title="Fullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <span>FULLSCREEN</span>
        </button>
      </div>
    </header>

    <!-- Hlavní rozvržení: Časová osa vlevo + Pracovní plocha vpravo -->
    <div class="pick-layout">
      <aside class="timeline-column" id="timelineCol">
        <div class="timeline-container" id="timelineContainer"></div>
      </aside>
      <section class="workspace-column" id="workspaceCol"></section>
    </div>
  </main>

  <script src="<game>.js"></script>
</body>
</html>
```

### B. Deklarativní konfigurace v JS (`<game>.js`)
Celá logika je řízená jen dvěma poli:

```javascript
// 1. Pool položek
const MAP_POOL = [
  { id: 'map1', name: 'Název 1', image: 'map_picks/<game>/map1.jpg' },
  { id: 'map2', name: 'Název 2', image: 'map_picks/<game>/map2.jpg' },
  ...
];

// 2. Deklarativní sekvence kroků
const PICK_SEQUENCE = [
  { id: 'step-0', type: 'rps' },
  { id: 'step-1', type: 'ban', team: 'A' },
  { id: 'step-2', type: 'ban', team: 'B' },
  { id: 'step-3', type: 'pick', team: 'A', mapNumber: 1 },
  { id: 'step-4', type: 'pick', team: 'B', mapNumber: 2 },
  { id: 'step-5', type: 'ban', team: 'A' },
  { id: 'step-6', type: 'ban', team: 'B' },
  { id: 'step-7', type: 'decider', mapNumber: 3 },
];
```

---

## 4. Vizuální a UX standardy, které držíme pro všechny hry

1. **Karty týmů a výsledné stavy**:
   - Tmavé pozadí `#22252c` s jemným rámečkem `rgba(255, 255, 255, 0.09)`.
   - Modrý tým: barva `#1351d8`, textové akcenty `#93c5fd`.
   - Červený tým: barva `#c62828`, textové akcenty `#fca5a5`.
   - Žádné průhledné ani "hollow" barvy – plné syté barvy v souladu s `score.html`.
2. **Časová osa vlevo**:
   - Zvýrazněný aktuální krok, spojovací šipka s animací ukazující na krok na řadě.
   - Hotové i budoucí kroky mají dostatečný kontrast a čitelnost.
   - U vybraných map je název mapy a případná strana zarovnaná vlevo (např. `MIRAGE, CT: MODŘÍ`).
3. **Mřížka map**:
   - Plynulá změna stavů (ban / pick / decider kandidát) bez probliknutí celé mřížky.
   - Pevná vertikální pozice (tlačítko náhodného výběru se zobrazuje pod mřížkou a neposouvá mapy).
4. **Náhodné losování (Decider & Strany)**:
   - Postupné zpomalování rulety (~2.4s) pro napětí.
   - Po vylosování je vždy neutrální tlačítko `POKRAČOVAT`, aby měli diváci čas vidět výsledek před přechodem.
5. **Konec picku (Summary)**:
   - Pouze dominantní nadpis `PICKOVÁNÍ DOKONČENO`.
   - Přehledná mřížka finálních map.
   - Neutrální tlačítko `PŘEJÍT NA TURNAJOVÉ SKÓRE` s neutrálním hoverem.

