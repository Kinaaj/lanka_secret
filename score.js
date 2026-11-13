// =====================================================================
// CONFIG
// =====================================================================

// Seznam her v turnaji (pořadí v poli = pořadí sloupců na obrazovce):
// - id:         jedinečný identifikátor hry (pro uložení dat, specifický pick, přestávky)
// - name:       plný název hry
// - src:        cesta k logu / ikoně
// - rounds:     počet kol pro danou hru (např. 1 pro Bo1, 3 pro Bo3, 5 pro Bo5)
// - pickUrl:    cesta na specifickou pickovací obrazovku (např. 'cs.html', pro hry bez picku nechat null)
// - position:   CSS object-position (např. 'center top', '50% 30%')
// - scale:      přiblížení obrázku (1 = normální, 1.15 = 15% přiblížení)
// - label:      (volitelné) pokud chybí, automaticky se generuje 'HRA 1', 'HRA 2', atd.
const GAMES = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    src: 'assets/images/cs_icon.jpg',
    position: 'center top',
    scale: 1,
    rounds: 3,
    pickUrl: 'cs.html',
  },
  {
    id: 'warcraft',
    name: 'Warcraft III',
    src: 'assets/images/warcraft_logo.png',
    position: 'center bottom',
    translateX: -10,
    scale: 1.25,
    rounds: 3,
    pickUrl: 'warcraft.html',
  },
  {
    id: 'lol',
    name: 'League of Legends',
    src: 'assets/images/lol_icon.webp',
    position: 'center center',
    scale: 1.05,
    rounds: 3,
    pickUrl: 'lol.html',
  },
  {
    id: 'overwatch',
    name: 'Overwatch 2',
    src: 'assets/images/overwatch-2_logo.jpg',
    position: 'center center',
    scale: 1,
    rounds: 5,
    pickUrl: 'overwatch.html',
  },
  {
    id: 'wreckfest',
    name: 'Wreckfest',
    src: 'assets/images/wreckfest_icon.webp',
    position: 'center top',
    scale: 1.15,
    rounds: 5,
    pickUrl: 'wreckfest.html',
  },
];

// Počet her a potřebný počet výher pro celkové vítězství
const NUM_GAMES = GAMES.length;
const GAMES_TO_WIN = Math.ceil(NUM_GAMES / 2);
const DEFAULT_ROUNDS = 3;
const GAME_ICONS = GAMES; // alias pro zpětnou kompatibilitu

// Přestávky / jídlo mezi sloupečky
// - afterGameId: umístí značku za hru s daným id (odolné proti změně pořadí her)
// - afterGameIndex: alternativně lze zadat pevný index (0-based)
const SCHEDULE_BREAKS = [
  { afterGameId: 'warcraft', label: 'Oběd' },    // Mezi Warcraftem a další hrou
  { afterGameId: 'overwatch', label: 'Večeře' }, // Mezi Overwatchem a další hrou
];


// =====================================================================
// DATA TÝMŮ (načte se z draft localStorage, nebo fallback)
// =====================================================================
const CAPTAIN_BLUE = {
  id: 'captain-blue', name: 'KODA', realName: 'Brácha',
  photo: 'assets/images/players/koda.png', isCaptain: true,
};
const CAPTAIN_RED = {
  id: 'captain-red', name: 'KINAJ', realName: 'Kinaj',
  photo: 'assets/images/players/kinaj.png', isCaptain: true,
};

const ALL_PLAYERS_DEFAULT = [
  { id: 'player-1', name: 'GIRY', realName: 'Vojtěch Michal', photo: 'assets/images/players/Giry.jpg', team: 'blue' },
  { id: 'player-2', name: 'Winters', realName: 'Karel Kosík', photo: 'assets/images/players/Karel.jpg', team: 'blue' },
  { id: 'player-4', name: 'Vojcii', realName: 'Vojtěch Kos', photo: 'assets/images/players/Vojcii.jpg', team: 'blue' },
  { id: 'player-7', name: 'Chleba', realName: 'Jiří Hanzlík', photo: 'assets/images/players/Jirka.jpg', team: 'blue' },
  { id: 'player-5', name: 'Kahanate', realName: 'David Kuba', photo: 'assets/images/players/David.jpg', team: 'red' },
  { id: 'player-6', name: 'Balib', realName: 'Libor Barvík', photo: 'assets/images/players/Balib.jpg', team: 'red' },
  { id: 'player-3', name: 'Pravdomil Kecal', realName: 'Dan Žáček', photo: 'assets/images/players/Pravdomil Kecal.jpg', team: 'red' },
  { id: 'player-8', name: 'Trebkiller', realName: 'Vladimír Hořký', photo: 'assets/images/players/Trebkiller.jpg', team: 'red' },
];

// =====================================================================
// PICK DATA PRO JEDNOTLIVÉ HRY (z pickovací obrazovky)
// Složka: map_picks/<gameId>/<mapId>.<ext>
// =====================================================================
function getGamePickUrl(game, g) {
  if (!game || !game.pickUrl) return null;
  let url = game.pickUrl;
  if (game.id === 'warcraft') {
    let cs2W = gameWinner[0];
    if (!cs2W && results[0]) {
      const b = results[0].filter(v => v === 1).length;
      const r = results[0].filter(v => v === 2).length;
      if (b >= 2) cs2W = 1;
      else if (r >= 2) cs2W = 2;
    }
    if (cs2W === 1) {
      url += '?cs2_winner=blue';
    } else if (cs2W === 2) {
      url += '?cs2_winner=red';
    }
  }
  if (game.id === 'lol') {
    let g0W = gameWinner[0];
    let g1W = gameWinner[1];
    if (!g0W && results[0]) {
      const b = results[0].filter(v => v === 1).length;
      const r = results[0].filter(v => v === 2).length;
      if (b >= 2) g0W = 1;
      else if (r >= 2) g0W = 2;
    }
    if (!g1W && results[1]) {
      const b = results[1].filter(v => v === 1).length;
      const r = results[1].filter(v => v === 2).length;
      if (b >= 2) g1W = 1;
      else if (r >= 2) g1W = 2;
    }

    const params = [];
    if (g0W === 1 && g1W === 1) {
      params.push('lead=blue');
    } else if (g0W === 2 && g1W === 2) {
      params.push('lead=red');
    }

    const lol1 = (results[2] && results[2][0]) || (gameWinner[2] || 0);
    const lol2 = (results[2] && results[2][1]) || 0;
    if (lol1 === 1) params.push('lol_g1=blue');
    else if (lol1 === 2) params.push('lol_g1=red');
    if (lol2 === 1) params.push('lol_g2=blue');
    else if (lol2 === 2) params.push('lol_g2=red');

    if (params.length > 0) {
      url += '?' + params.join('&');
    }
  }
  if (game.id === 'overwatch') {
    // Zjistíme, kdo prohrává po prvních 3 hrách (CS2, Warcraft, LoL)
    let blueWins = 0, redWins = 0;
    for (let prevG = 0; prevG < 3; prevG++) {
      let w = gameWinner[prevG];
      if (!w && results[prevG]) {
        const numR = GAME_ICONS[prevG].rounds || 3;
        const maj = Math.ceil(numR / 2);
        const b = results[prevG].filter(v => v === 1).length;
        const r = results[prevG].filter(v => v === 2).length;
        if (b >= maj) w = 1;
        else if (r >= maj) w = 2;
      }
      if (w === 1) blueWins++;
      else if (w === 2) redWins++;
    }
    if (blueWins > redWins) {
      url += '?ow_first=red';
    } else if (redWins > blueWins) {
      url += '?ow_first=blue';
    }
  }
  return url;
}

function resolveMapImage(gameId, roundData) {
  if (!roundData) return null;

  // 1. Přímá cesta nebo explicitní název souboru
  if (roundData.mapImage) {
    if (roundData.mapImage.startsWith('map_picks/') || roundData.mapImage.startsWith('assets/')) {
      return roundData.mapImage;
    }
    return `map_picks/${gameId}/${roundData.mapImage}`;
  }

  // 2. ID nebo název mapy
  const rawId = roundData.mapId || roundData.map || roundData.mapName;
  if (!rawId) return null;

  const cleanId = String(rawId).toLowerCase().trim()
    .replace(/\s+/g, '')
    .replace(/^dustii$/, 'dust2');

  if (cleanId === 'cache') return `map_picks/${gameId}/cache.webp`;
  return `map_picks/${gameId}/${cleanId}.jpg`;
}

function getGamePickData(gameId) {
  try {
    const raw = localStorage.getItem(`lanka_pick_${gameId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Chyba při čtení pick dat pro ${gameId}:`, e);
  }
  return null;
}

// =====================================================================
// STAV SKÓRE
// =====================================================================
const results = GAME_ICONS.map(g => new Array(g.rounds || DEFAULT_ROUNDS).fill(0));
const gameWinner = new Array(NUM_GAMES).fill(0);

function saveTournamentScore() {
  try {
    localStorage.setItem('lanka_tournament_score', JSON.stringify({ results, gameWinner }));
  } catch (e) { /* ignore */ }
}

function loadTournamentScore() {
  try {
    const raw = localStorage.getItem('lanka_tournament_score');
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.results)) {
        data.results.forEach((rArr, g) => {
          if (results[g] && Array.isArray(rArr)) {
            rArr.forEach((val, r) => {
              if (results[g][r] !== undefined) results[g][r] = val;
            });
          }
        });
      }
      if (Array.isArray(data.gameWinner)) {
        data.gameWinner.forEach((w, g) => {
          if (gameWinner[g] !== undefined) gameWinner[g] = w;
        });
      }

      // Pojistka: pokud vítěz hry nebyl explicitně uložen, dopočítáme z kol
      for (let g = 0; g < NUM_GAMES; g++) {
        if (!gameWinner[g] && results[g]) {
          const numRounds = GAME_ICONS[g].rounds || DEFAULT_ROUNDS;
          const maj = Math.ceil(numRounds / 2);
          const b = results[g].filter(v => v === 1).length;
          const r = results[g].filter(v => v === 2).length;
          if (b >= maj && b > r) gameWinner[g] = 1;
          else if (r >= maj && r > b) gameWinner[g] = 2;
        }
      }
    }
  } catch (e) { /* ignore */ }
}

// =====================================================================
// SCORE TABLE
// =====================================================================
function buildTable() {
  const table = document.getElementById('scoreTable');
  table.innerHTML = '';

  const maxRounds = Math.max(...GAME_ICONS.map(g => g.rounds || DEFAULT_ROUNDS));
  if (maxRounds >= 5) {
    table.classList.add('has-bo5');
  } else {
    table.classList.remove('has-bo5');
  }

  // Sloupec popisků (vlevo)
  const labelsCol = document.createElement('div');
  labelsCol.className = 'labels-col';

  // Místo vedle ikon
  labelsCol.appendChild(Object.assign(document.createElement('div'), { className: 'label-cell label-cell-icon' }));

  // Prázdné místo vedle kol (žádné Kolo 1, Kolo 2)
  labelsCol.appendChild(Object.assign(document.createElement('div'), { className: 'label-cell-spacer' }));

  // Popisek vítěze hry
  const lcWin = document.createElement('div');
  lcWin.className = 'label-cell label-cell-winner';
  lcWin.textContent = 'VÍTĚZ HRY';
  labelsCol.appendChild(lcWin);
  table.appendChild(labelsCol);

  // Herní sloupce
  for (let g = 0; g < NUM_GAMES; g++) {
    const game = GAMES[g];
    const numRounds = game.rounds || DEFAULT_ROUNDS;
    const gameLabel = game.label || `HRA ${g + 1}`;

    const col = document.createElement('div');
    col.className = 'game-col';
    col.id = `gameCol-${g}`;
    if (gameWinner[g] === 1) col.classList.add('col-blue');
    else if (gameWinner[g] === 2) col.classList.add('col-red');

    // Ikona
    const iconCell = document.createElement('div');
    iconCell.className = 'gcell-icon';
    const pickUrl = getGamePickUrl(game, g);
    if (pickUrl) {
      iconCell.classList.add('gcell-icon-clickable');
      iconCell.title = `Přejít na pickování (${game.name || gameLabel})`;
      iconCell.addEventListener('click', () => {
        if (window.LankaMusic) {
          window.LankaMusic.playGame(game.id);
        }
        if (window.LankaRouter) {
          window.LankaRouter.navigateTo(game.id);
        } else {
          window.location.hash = '#' + game.id;
        }
      });
    }
    const img = document.createElement('img');
    img.src = game.src;
    img.alt = gameLabel;
    img.className = 'game-icon-img';
    img.style.objectPosition = game.position || 'center center';
    const transforms = [];
    if (game.scale && game.scale !== 1) {
      transforms.push(`scale(${game.scale})`);
    }
    const offX = game.translateX !== undefined ? game.translateX : game.offsetX;
    if (offX !== undefined) {
      transforms.push(`translateX(${typeof offX === 'number' ? offX + 'px' : offX})`);
    }
    const offY = game.translateY !== undefined ? game.translateY : game.offsetY;
    if (offY !== undefined) {
      transforms.push(`translateY(${typeof offY === 'number' ? offY + 'px' : offY})`);
    }
    if (game.transform) {
      transforms.push(game.transform);
    }
    if (transforms.length > 0) {
      img.style.transform = transforms.join(' ');
    }
    img.onerror = () => img.replaceWith(createIconFallback(gameLabel));
    iconCell.appendChild(img);
    col.appendChild(iconCell);

    // Kontejner kol
    const roundsWrapper = document.createElement('div');
    roundsWrapper.className = 'gcell-rounds-wrapper';

    // Pick data pro celou hru (pokud existují)
    const pickData = getGamePickData(game.id);

    for (let r = 0; r < numRounds; r++) {
      const roundCell = document.createElement('div');
      roundCell.className = 'gcell-round';
      roundCell.id = `roundCell-${g}-${r}`;

      // ── MAPA NA POZADÍ A INFO VLEVO DOLE (z picku) ──
      const roundData = pickData?.rounds?.[r];
      if (roundData) {
        const mapImgSrc = resolveMapImage(game.id, roundData);
        if (mapImgSrc) {
          const bg = document.createElement('div');
          bg.className = 'round-bg-image' + (game.id === 'wreckfest' ? ' round-bg-wreckfest' : '');
          bg.style.backgroundImage = `url('${encodeURI(mapImgSrc)}')`;
          roundCell.appendChild(bg);

          const overlay = document.createElement('div');
          overlay.className = 'round-bg-overlay';
          roundCell.appendChild(overlay);
        }

        const mapTitle = roundData.mapName || roundData.metaTop || roundData.map || '';
        let ctLabel = '';
        let wreckfestCarClass = '';

        // U Warcraftu a Wreckfestu chceme zobrazit specifické popisky
        if (game.id === 'warcraft') {
          // Pouze název mapy
          ctLabel = '';
        } else if (game.id === 'wreckfest') {
          // U Wreckfestu zobrazit např: "Crash Canyon — Main circuit", a odznak třídy auta
          let trackName = roundData.trackName || '';
          wreckfestCarClass = roundData.carClass || '';

          if (roundData.metaBottom) {
            if (roundData.metaBottom.includes('•')) {
              const parts = roundData.metaBottom.split('•');
              if (!trackName) trackName = parts[0].trim();
              if (!wreckfestCarClass) wreckfestCarClass = parts[1].trim();
            } else if (!trackName) {
              trackName = roundData.metaBottom.trim();
            }
          }

          ctLabel = trackName;

          // Pokud máme třídu auta, přidáme trvalý odznak do pravého horního rohu buňky
          if (wreckfestCarClass) {
            const carBadge = document.createElement('div');
            let carCls = 'car-custom';
            const cLower = wreckfestCarClass.toLowerCase();
            let badgeText = wreckfestCarClass;

            if (cLower.includes('max a') || cLower === 'a') {
              carCls = 'car-max-a';
              badgeText = 'MAX A';
            } else if (cLower.includes('max b') || cLower === 'b') {
              carCls = 'car-max-b';
              badgeText = 'MAX B';
            } else if (cLower.includes('max c') || cLower === 'c') {
              carCls = 'car-max-c';
              badgeText = 'MAX C';
            } else if (cLower.includes('konkrétní')) {
              carCls = 'car-custom';
              badgeText = 'KONKRÉTNÍ';
            }

            carBadge.className = `round-car-badge ${carCls}`;
            carBadge.textContent = badgeText;
            roundCell.appendChild(carBadge);
          }
        } else {
          if (roundData.ctTeam) {
            ctLabel = `CT: ${roundData.ctTeam === 'blue' ? 'Modří' : 'Červení'}`;
          } else if (roundData.metaBottom) {
            ctLabel = roundData.metaBottom
              .replace(/MODRÝ/i, 'Modří')
              .replace(/ČERVENÝ/i, 'Červení');
          }
        }

        const infoText = [mapTitle, ctLabel].filter(Boolean).join(game.id === 'wreckfest' ? ' — ' : ', ');

        if (infoText) {
          const infoEl = document.createElement('div');
          infoEl.className = 'round-info-label';
          infoEl.textContent = infoText;
          roundCell.appendChild(infoEl);
          roundCell.title = infoText + (wreckfestCarClass ? ` (${wreckfestCarClass})` : '');
        }

        // Plovoucí HUD pruh dole na obrazovce při najetí na buňku
        roundCell.addEventListener('mouseenter', () => {
          const hud = document.getElementById('scoreHoverHud');
          if (!hud) return;

          let hudHtml = `<span class="score-hud-game-tag">${game.name} • ${r + 1}. KOLO</span>`;

          if (mapTitle || ctLabel) {
            hudHtml += `<span class="score-hud-divider"></span>`;
            if (mapTitle) hudHtml += `<span class="score-hud-title">${mapTitle}</span>`;
            if (ctLabel) hudHtml += `<span class="score-hud-sub">${mapTitle ? '— ' : ''}${ctLabel}</span>`;
          }

          if (wreckfestCarClass) {
            let carCls = 'car-custom';
            const cLower = wreckfestCarClass.toLowerCase();
            if (cLower.includes('max a') || cLower === 'a') carCls = 'car-max-a';
            else if (cLower.includes('max b') || cLower === 'b') carCls = 'car-max-b';
            else if (cLower.includes('max c') || cLower === 'c') carCls = 'car-max-c';
            hudHtml += `<span class="score-hud-divider"></span><span class="score-hud-car-badge ${carCls}">AUTA: ${wreckfestCarClass}</span>`;
          }

          hud.innerHTML = hudHtml;
          hud.classList.add('is-visible');
        });

        roundCell.addEventListener('mouseleave', () => {
          const hud = document.getElementById('scoreHoverHud');
          if (hud) hud.classList.remove('is-visible');
        });
      }

      const zoneLeft = document.createElement('div');
      zoneLeft.className = 'gcell-click-zone zone-left';
      zoneLeft.title = 'Modrý tým';
      const labelLeft = document.createElement('span');
      labelLeft.className = 'zone-label';
      labelLeft.textContent = 'MODRÝ';
      zoneLeft.appendChild(labelLeft);

      const zoneRight = document.createElement('div');
      zoneRight.className = 'gcell-click-zone zone-right';
      zoneRight.title = 'Červený tým';
      const labelRight = document.createElement('span');
      labelRight.className = 'zone-label';
      labelRight.textContent = 'ČERVENÝ';
      zoneRight.appendChild(labelRight);

      const dot = document.createElement('div');
      dot.className = 'round-dot';

      roundCell.appendChild(zoneLeft);
      roundCell.appendChild(zoneRight);
      roundCell.appendChild(dot);

      applyRoundState(roundCell, results[g][r]);

      roundCell.addEventListener('click', (e) => {
        const rect = roundCell.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const isLeft = clickX < rect.width / 2;

        if (isLeft) {
          results[g][r] = results[g][r] === 1 ? 0 : 1;
        } else {
          results[g][r] = results[g][r] === 2 ? 0 : 2;
        }

        applyRoundState(roundCell, results[g][r]);
        recalcGameWinner(g);
        updateTournamentWinner();
      });

      roundsWrapper.appendChild(roundCell);
    }
    col.appendChild(roundsWrapper);

    // Oddělovač + vítěz
    col.appendChild(Object.assign(document.createElement('div'), { className: 'gcell-divider' }));

    const winCell = document.createElement('div');
    winCell.className = 'gcell-winner';
    winCell.id = `gameWinnerCell-${g}`;

    const winText = document.createElement('span');
    winText.className = 'winner-cell-text';
    winCell.appendChild(winText);

    applyWinnerState(winCell, gameWinner[g]);
    col.appendChild(winCell);

    table.appendChild(col);
    applyColHighlight(g, col);
  }

  renderBreakMarkers(table);
  updateTournamentWinner();
}

function renderBreakMarkers(table) {
  if (!table) table = document.getElementById('scoreTable');
  if (!table) return;

  table.querySelectorAll('.table-break-marker, .table-direction-arrow').forEach(el => el.remove());

  // Směrová šipka (zleva doprava) u levého horního rohu CS2
  const col0 = document.getElementById('gameCol-0');
  if (col0) {
    const dirArrow = document.createElement('div');
    dirArrow.className = 'table-direction-arrow';
    dirArrow.title = 'Průběh turnaje (zleva doprava)';
    dirArrow.setAttribute('aria-label', 'Průběh turnaje zleva doprava');
    dirArrow.innerHTML = `
      <svg viewBox="0 0 28 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="2" y1="7" x2="25" y2="7" />
        <polyline points="19 2 25 7 19 12" />
      </svg>
    `;
    table.appendChild(dirArrow);
    dirArrow.style.left = `${col0.offsetLeft}px`;
  }

  SCHEDULE_BREAKS.forEach(b => {
    let afterIdx = b.afterGameIndex;
    if (afterIdx === undefined && b.afterGameId) {
      afterIdx = GAMES.findIndex(g => g.id === b.afterGameId);
    }
    if (afterIdx === undefined || afterIdx < 0) return;

    const leftCol = document.getElementById(`gameCol-${afterIdx}`);
    const rightCol = document.getElementById(`gameCol-${afterIdx + 1}`);
    if (!leftCol || !rightCol) return;

    const marker = document.createElement('div');
    marker.className = 'table-break-marker';
    marker.title = b.label;
    marker.setAttribute('aria-label', b.label);

    marker.innerHTML = `
      <div class="break-marker-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
          <path d="M7 2v20"/>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
      </div>
      <div class="break-marker-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4v14"/>
          <path d="m18 13-6 6-6-6"/>
        </svg>
      </div>
    `;

    table.appendChild(marker);

    const leftEdge = leftCol.offsetLeft + leftCol.offsetWidth;
    const rightEdge = rightCol.offsetLeft;
    const center = (leftEdge + rightEdge) / 2;
    marker.style.left = `${center}px`;
  });
}


function createIconFallback(label) {
  const div = document.createElement('div');
  div.className = 'game-icon-placeholder';
  div.textContent = label;
  return div;
}

function applyRoundState(cell, state) {
  cell.classList.remove('state-blue', 'state-red');
  if (state === 1) cell.classList.add('state-blue');
  else if (state === 2) cell.classList.add('state-red');
}

function applyWinnerState(cell, state) {
  cell.classList.remove('state-blue', 'state-red');
  const textEl = cell.querySelector('.winner-cell-text') || cell;
  if (state === 1) { cell.classList.add('state-blue'); textEl.textContent = 'MODRÝ'; }
  else if (state === 2) { cell.classList.add('state-red'); textEl.textContent = 'ČERVENÝ'; }
  else { textEl.textContent = ''; }
}

function applyColHighlight(g, colEl) {
  const col = colEl || document.getElementById(`gameCol-${g}`);
  if (!col) return;
  col.classList.remove('col-blue', 'col-red');
  if (gameWinner[g] === 1) col.classList.add('col-blue');
  else if (gameWinner[g] === 2) col.classList.add('col-red');
}

function recalcGameWinner(g) {
  const numRounds = GAME_ICONS[g].rounds || DEFAULT_ROUNDS;
  let blue = 0, red = 0;
  for (let r = 0; r < numRounds; r++) {
    if (results[g][r] === 1) blue++;
    if (results[g][r] === 2) red++;
  }
  const maj = Math.ceil(numRounds / 2);
  if (blue >= maj && blue > red) gameWinner[g] = 1;
  else if (red >= maj && red > blue) gameWinner[g] = 2;
  else gameWinner[g] = 0;

  const cell = document.getElementById(`gameWinnerCell-${g}`);
  if (cell) applyWinnerState(cell, gameWinner[g]);
  applyColHighlight(g);
}

function updateTournamentWinner() {
  let blue = 0, red = 0;
  for (let g = 0; g < NUM_GAMES; g++) {
    if (gameWinner[g] === 1) blue++;
    if (gameWinner[g] === 2) red++;
  }
  const panel = document.getElementById('tournamentWinnerPanel');
  const val = document.getElementById('tournamentWinnerValue');
  panel.classList.remove('winner-blue', 'winner-red');
  if (blue >= GAMES_TO_WIN) {
    panel.classList.add('winner-blue');
    val.innerHTML = 'MODRÝ<br>TÝM';
  } else if (red >= GAMES_TO_WIN) {
    panel.classList.add('winner-red');
    val.innerHTML = 'ČERVENÝ<br>TÝM';
  } else {
    val.textContent = '—';
  }
  saveTournamentScore();
}

// =====================================================================
// TEAM SIDEBARS — draft styl (karty s fotkou)
// =====================================================================
function loadTeamsFromDraft() {
  let savedPlayers = null;
  try {
    const raw = localStorage.getItem('lanka_draft_state_v3');
    if (raw) savedPlayers = JSON.parse(raw);
  } catch { /* ignore */ }

  const allPlayers = ALL_PLAYERS_DEFAULT.map(dp => {
    const match = savedPlayers?.find(p => p.id === dp.id);
    return { ...dp, team: (match && match.team !== 'pool') ? match.team : dp.team };
  });

  // Blue: kapitán slot 1 + hráči v pořadí 2–5
  let bluePlayers = allPlayers.filter(p => p.team === 'blue');
  let redPlayers = allPlayers.filter(p => p.team === 'red');

  // Fallback pokud by ještě nebyly přiřazeny týmy: Modrý (Giry, Winters, Vojcii, Chleba), Červený (Kahanate, Balib, Danik, Trebkiller)
  if (bluePlayers.length === 0 && redPlayers.length === 0) {
    bluePlayers = [
      allPlayers.find(p => p.id === 'player-1'), // Giry
      allPlayers.find(p => p.id === 'player-2'), // Winters
      allPlayers.find(p => p.id === 'player-4'), // Vojcii
      allPlayers.find(p => p.id === 'player-7'), // Chleba (Jirka)
    ].filter(Boolean);

    redPlayers = [
      allPlayers.find(p => p.id === 'player-5'), // Kahanate
      allPlayers.find(p => p.id === 'player-6'), // Balib
      allPlayers.find(p => p.id === 'player-3'), // Pravdomil Kecal (Dan Žáček)
      allPlayers.find(p => p.id === 'player-8'), // Trebkiller
    ].filter(Boolean);
  }

  // Modrý tým: 3-sloupec vlevo (blueSubLeft), 2-sloupec vpravo (blueSubRight)
  renderTeamSidebar('blueSubRight', 'blueSubLeft', CAPTAIN_BLUE, bluePlayers);
  // Červený tým: 2-sloupec vlevo (redSubLeft), 3-sloupec vpravo (redSubRight)
  renderTeamSidebar('redSubLeft', 'redSubRight', CAPTAIN_RED, redPlayers);
}

/**
 * Vykreslí draft-style zigzag layout do sidebaru.
 * Sestaví 5 slotů v zigzag pořadí: Slot 1 (vrch 3-col), Slot 2 (vrch 2-col),
 * Slot 3 (střed 3-col), Slot 4 (spodek 2-col), Slot 5 (spodek 3-col)
 */
function renderTeamSidebar(subcol2Id, subcol3Id, captain, players) {
  const col2 = document.getElementById(subcol2Id);
  const col3 = document.getElementById(subcol3Id);
  if (!col2 || !col3) return;
  col2.innerHTML = '';
  col3.innerHTML = '';

  const allMembers = [captain, ...players.slice(0, 4)];
  const slots = [
    [col3, allMembers[0]], // Slot 1 — kapitán (vrch 3-col)
    [col2, allMembers[1]], // Slot 2 — 1. draftovaný hráč (vrch 2-col)
    [col3, allMembers[2]], // Slot 3 — 2. draftovaný hráč (střed 3-col)
    [col2, allMembers[3]], // Slot 4 — 3. draftovaný hráč (spodek 2-col)
    [col3, allMembers[4]], // Slot 5 — 4. draftovaný hráč (spodek 3-col)
  ];

  slots.forEach(([col, member]) => {
    if (member) {
      col.appendChild(createSidebarCard(member));
    } else {
      col.appendChild(createEmptySlot());
    }
  });
}

function createSidebarCard(player) {
  const card = document.createElement('div');
  card.className = 'sidebar-card' + (player.isCaptain ? ' is-captain' : '');

  const nickLen = (player.name || '').length;
  let nickClass = 'sidebar-card-nick';
  if (nickLen > 12) {
    nickClass += ' is-very-long-name';
  } else if (nickLen > 8) {
    nickClass += ' is-long';
  }

  card.innerHTML = `
    <div class="sidebar-card-photo-wrapper">
      <img class="sidebar-card-photo" src="${player.photo}" alt="${player.name}" draggable="false"
           onerror="this.parentElement.style.background='#16181e'">
    </div>
    <div class="sidebar-card-info">
      <div class="${nickClass}">${player.name}</div>
      ${player.realName ? `<div class="sidebar-card-real">${player.realName}</div>` : ''}
    </div>
  `;
  return card;
}

function createEmptySlot() {
  const slot = document.createElement('div');
  slot.className = 'sidebar-card sidebar-card-empty';
  slot.style.cssText = 'border:1.5px dashed rgba(255,255,255,0.12); background:rgba(0,0,0,0.15); border-radius:8px;';
  return slot;
}

// =====================================================================
// INTRO / VS PRE-FÁZE CONTROLLER
// =====================================================================
function triggerStartIntro() {
  const body = document.body;
  if (!body.classList.contains('intro-mode') || body.classList.contains('intro-leaving')) return;

  body.classList.add('intro-leaving');
  const overlay = document.getElementById('scoreIntroOverlay');
  if (overlay) overlay.classList.add('is-hiding');

  try {
    sessionStorage.setItem('lanka_score_intro_played', 'true');
  } catch (e) { /* ignore */ }

  setTimeout(() => {
    body.classList.remove('intro-mode', 'intro-leaving');
    if (overlay) {
      overlay.classList.remove('is-hiding');
    }
    renderBreakMarkers();
  }, 850);
}

function showIntroScreen() {
  try {
    sessionStorage.removeItem('lanka_score_intro_played');
  } catch (e) { /* ignore */ }
  loadTeamsFromDraft();
  const overlay = document.getElementById('scoreIntroOverlay');
  if (overlay) {
    overlay.classList.remove('is-hiding');
  }
  document.body.classList.remove('intro-leaving');
  document.body.classList.add('intro-mode');
}

const startBtn = document.getElementById('scoreIntroStartBtn');
if (startBtn) {
  startBtn.addEventListener('click', triggerStartIntro);
}

const introBtn = document.getElementById('introBtn');
if (introBtn) {
  introBtn.addEventListener('click', showIntroScreen);
}

const fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  });
}

// Možnost odpálit START stiskem mezerníku nebo Enteru na klávesnici / TV ovladači
document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('intro-mode') && !document.body.classList.contains('intro-leaving')) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      triggerStartIntro();
    }
  }
});

// =====================================================================
// RESET
// =====================================================================
document.getElementById('resetBtn').addEventListener('click', () => {
  results.forEach(gRounds => gRounds.fill(0));
  gameWinner.fill(0);
  try {
    localStorage.removeItem('lanka_tournament_score');
  } catch (e) { /* ignore */ }
  buildTable();
  updateTournamentWinner();
});

// =====================================================================
// INIT & EXTERNAL SYNC
// =====================================================================

// Synchronizace pick dat z URL parametrů (zajišťuje spolehlivý přenos i přes file:// protokol)
function syncPickDataFromUrl() {
  try {
    const url = new URL(window.location.href);
    let hasUpdates = false;

    // 1. Zpracování resetu hry (?reset_cs2=1)
    for (const [key] of url.searchParams.entries()) {
      if (key.startsWith('reset_')) {
        const gameId = key.replace('reset_', '');
        localStorage.removeItem(`lanka_pick_${gameId}`);
        hasUpdates = true;
      }
    }

    // 2. Zpracování picknutých dat hry (?pick_cs2=...)
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith('pick_')) {
        const gameId = key.replace('pick_', '');
        try {
          const data = JSON.parse(decodeURIComponent(value));
          localStorage.setItem(`lanka_pick_${gameId}`, JSON.stringify(data));
          hasUpdates = true;
        } catch (err) {
          console.error('Chyba při parsování dat z URL pro ' + gameId, err);
        }
      }
    }

    // 3. Po synchronizaci vyčistíme URL, aby adresa zůstala čistá
    if (hasUpdates) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  } catch (e) {
    console.warn('Nelze synchronizovat pick data z URL:', e);
  }
}

syncPickDataFromUrl();
loadTournamentScore();
buildTable();
loadTeamsFromDraft();

if (window.LankaMusic) {
  window.LankaMusic.bindUI();
}

window.addEventListener('pageshow', () => {
  syncPickDataFromUrl();
  loadTournamentScore();
  buildTable();
  loadTeamsFromDraft();
});

// Automatická aktualizace tabulky při změně pick dat (např. z jiné záložky)
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('lanka_pick_')) {
    buildTable();
    updateTournamentWinner();
  }
});

// Pomocná globální funkce pro uložení pick dat a okamžité překreslení
window.setGamePickData = (gameId, data) => {
  localStorage.setItem(`lanka_pick_${gameId}`, JSON.stringify(data));
  buildTable();
  updateTournamentWinner();
};

window.addEventListener('resize', () => {
  renderBreakMarkers();
});
document.addEventListener('fullscreenchange', () => {
  renderBreakMarkers();
});

