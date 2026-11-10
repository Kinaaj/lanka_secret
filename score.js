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
    pickUrl: null,
  },
  {
    id: 'wreckfest',
    name: 'Wreckfest',
    src: 'assets/images/wreckfest_icon.webp',
    position: 'center top',
    scale: 1.15,
    rounds: 3,
    pickUrl: null,
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
  { id: 'player-1', name: 'GIRY', realName: 'Vojtěch Michal', photo: 'assets/images/players/Giry.jpg', team: 'pool' },
  { id: 'player-2', name: 'Winters', realName: 'Karel Kosík', photo: 'assets/images/players/Karel.jpg', team: 'pool' },
  { id: 'player-3', name: 'Pravdomil Kecal', realName: 'Dan Žáček', photo: 'assets/images/players/Pravdomil Kecal.jpg', team: 'pool' },
  { id: 'player-4', name: 'Vojcii', realName: 'Vojtěch Kos', photo: 'assets/images/players/Vojcii.jpg', team: 'pool' },
  { id: 'player-5', name: 'Kahanate', realName: 'David Kuba', photo: 'assets/images/players/David.jpg', team: 'pool' },
  { id: 'player-6', name: 'Balib', realName: 'Libor Barvík', photo: 'assets/images/players/Balib.jpg', team: 'pool' },
  { id: 'player-7', name: 'Chleba', realName: 'Jiří Hanzlík', photo: 'assets/images/players/Jirka.jpg', team: 'pool' },
  { id: 'player-8', name: 'Trebkiller', realName: 'Vladimír Hořký', photo: 'assets/images/players/Trebkiller.jpg', team: 'pool' },
];

// =====================================================================
// PICK DATA PRO JEDNOTLIVÉ HRY (z pickovací obrazovky)
// Složka: map_picks/<gameId>/<mapId>.<ext>
// =====================================================================
function resolveMapImage(gameId, roundData) {
  if (!roundData) return null;

  // 1. Přímá cesta nebo explicitní název souboru
  if (roundData.mapImage) {
    if (roundData.mapImage.includes('/')) return roundData.mapImage;
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
    if (game.pickUrl) {
      iconCell.classList.add('gcell-icon-clickable');
      iconCell.title = `Přejít na pickování (${game.name || gameLabel})`;
      iconCell.addEventListener('click', () => {
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
        window.location.href = url;
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
          bg.className = 'round-bg-image';
          bg.style.backgroundImage = `url('${encodeURI(mapImgSrc)}')`;
          roundCell.appendChild(bg);

          const overlay = document.createElement('div');
          overlay.className = 'round-bg-overlay';
          roundCell.appendChild(overlay);
        }

        const mapTitle = roundData.mapName || roundData.metaTop || roundData.map || '';
        let ctLabel = '';
        // U Warcraftu chceme zobrazit pouze název mapy (žádné Modří, Červení ani Decider)
        if (game.id !== 'warcraft') {
          if (roundData.ctTeam) {
            ctLabel = `CT: ${roundData.ctTeam === 'blue' ? 'Modří' : 'Červení'}`;
          } else if (roundData.metaBottom) {
            ctLabel = roundData.metaBottom
              .replace(/MODRÝ/i, 'Modří')
              .replace(/ČERVENÝ/i, 'Červení');
          }
        }

        const infoText = [mapTitle, ctLabel].filter(Boolean).join(', ');

        if (infoText) {
          const infoEl = document.createElement('div');
          infoEl.className = 'round-info-label';
          infoEl.textContent = infoText;
          roundCell.appendChild(infoEl);
        }
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
    return { ...dp, team: match ? match.team : dp.team };
  });

  // Blue: kapitán slot 1 + hráči v pořadí 2–5 (zigzag: levý sloupec 1,3,5 / pravý 2,4)
  const bluePlayers = allPlayers.filter(p => p.team === 'blue');
  const redPlayers = allPlayers.filter(p => p.team === 'red');

  renderTeamSidebar('blueSubLeft', 'blueSubRight', CAPTAIN_BLUE, bluePlayers);
  renderTeamSidebar('redSubLeft', 'redSubRight', CAPTAIN_RED, redPlayers);
}

/**
 * Vykreslí draft-style zigzag layout do sidebaru.
 * Sloty jsou: L1, R1, L2, R2, L3 (kapitan je vždy L1)
 */
function renderTeamSidebar(leftId, rightId, captain, players) {
  const leftCol = document.getElementById(leftId);
  const rightCol = document.getElementById(rightId);
  if (!leftCol || !rightCol) return;
  leftCol.innerHTML = '';
  rightCol.innerHTML = '';

  // Sestavíme 5 slotů v zigzag pořadí: L1, R1, L2, R2, L3
  const allMembers = [captain, ...players.slice(0, 4)];
  // slot index → [column, position]
  const slots = [
    [leftCol, allMembers[0]], // L1 — kapitán
    [rightCol, allMembers[1]], // R1
    [leftCol, allMembers[2]], // L2
    [rightCol, allMembers[3]], // R2
    [leftCol, allMembers[4]], // L3
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
  card.className = 'sidebar-card';

  const nickLen = (player.name || '').length;
  const nickClass = nickLen > 9 ? 'sidebar-card-nick is-long' : 'sidebar-card-nick';

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
  slot.style.cssText = 'height:136px; border:1.5px dashed rgba(255,255,255,0.1); background:rgba(0,0,0,0.15); border-radius:7px;';
  return slot;
}



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

window.addEventListener('pageshow', () => {
  syncPickDataFromUrl();
  loadTournamentScore();
  buildTable();
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

