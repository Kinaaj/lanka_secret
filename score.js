// =====================================================================
// CONFIG
// =====================================================================
const NUM_GAMES = 5;
const GAMES_TO_WIN = 3;
const DEFAULT_ROUNDS = 3;

// rounds:   počet kol pro danou hru (např. 1 pro Bo1, 3 pro Bo3, 5 pro Bo5)
// position: CSS object-position (např. 'center top', '50% 30%')
// scale:    přiblížení obrázku (1 = normální, 1.3 = 30% přiblížení)
const GAME_ICONS = [
  { label: 'HRA 1', src: 'assets/images/cs_icon.jpg', position: 'center top', scale: 1, rounds: 3 },
  { label: 'HRA 2', src: 'assets/images/warcraft_logo.jpeg', position: 'center center', scale: 1.1, rounds: 1 },
  { label: 'HRA 3', src: 'assets/images/lol_icon.webp', position: 'center center', scale: 1.05, rounds: 3 },
  { label: 'HRA 4', src: 'assets/images/overwatch-2_logo.jpg', position: 'center center', scale: 1, rounds: 3 },
  { label: 'HRA 5', src: 'assets/images/wreckfest_icon.webp', position: 'center top', scale: 1.15, rounds: 3 },
];

// Přestávky / jídlo mezi sloupečky (Varianta A)
const SCHEDULE_BREAKS = [
  { afterGameIndex: 1, label: 'Oběd' },    // Mezi Warcraftem (Hra 2) a LoLkem (Hra 3)
  { afterGameIndex: 3, label: 'Večeře' },  // Mezi Overwatchem (Hra 4) a Wreckfestem (Hra 5)
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
// STAV SKÓRE
// =====================================================================
const results = GAME_ICONS.map(g => new Array(g.rounds || DEFAULT_ROUNDS).fill(0));
const gameWinner = new Array(NUM_GAMES).fill(0);

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
    const game = GAME_ICONS[g];
    const numRounds = game.rounds || DEFAULT_ROUNDS;

    const col = document.createElement('div');
    col.className = 'game-col';
    col.id = `gameCol-${g}`;

    // Ikona
    const iconCell = document.createElement('div');
    iconCell.className = 'gcell-icon';
    const img = document.createElement('img');
    img.src = game.src;
    img.alt = game.label;
    img.className = 'game-icon-img';
    img.style.objectPosition = game.position || 'center center';
    if (game.scale && game.scale !== 1) {
      img.style.transform = `scale(${game.scale})`;
    }
    img.onerror = () => img.replaceWith(createIconFallback(game.label));
    iconCell.appendChild(img);
    col.appendChild(iconCell);

    // Kontejner kol
    const roundsWrapper = document.createElement('div');
    roundsWrapper.className = 'gcell-rounds-wrapper';

    for (let r = 0; r < numRounds; r++) {
      const roundCell = document.createElement('div');
      roundCell.className = 'gcell-round';

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

    const winZoneLeft = document.createElement('div');
    winZoneLeft.className = 'gcell-click-zone zone-left';
    winZoneLeft.title = 'Vítěz: Modrý tým';
    const winLabelLeft = document.createElement('span');
    winLabelLeft.className = 'zone-label';
    winLabelLeft.textContent = 'MODRÝ';
    winZoneLeft.appendChild(winLabelLeft);

    const winZoneRight = document.createElement('div');
    winZoneRight.className = 'gcell-click-zone zone-right';
    winZoneRight.title = 'Vítěz: Červený tým';
    const winLabelRight = document.createElement('span');
    winLabelRight.className = 'zone-label';
    winLabelRight.textContent = 'ČERVENÝ';
    winZoneRight.appendChild(winLabelRight);

    const winText = document.createElement('span');
    winText.className = 'winner-cell-text';

    winCell.appendChild(winZoneLeft);
    winCell.appendChild(winZoneRight);
    winCell.appendChild(winText);

    applyWinnerState(winCell, gameWinner[g]);

    winCell.addEventListener('click', (e) => {
      const rect = winCell.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isLeft = clickX < rect.width / 2;

      if (isLeft) {
        gameWinner[g] = gameWinner[g] === 1 ? 0 : 1;
      } else {
        gameWinner[g] = gameWinner[g] === 2 ? 0 : 2;
      }

      applyWinnerState(winCell, gameWinner[g]);
      applyColHighlight(g);
      updateTournamentWinner();
    });
    col.appendChild(winCell);

    applyColHighlight(g);
    table.appendChild(col);
  }

  renderBreakMarkers(table);
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

    const leftCol = document.getElementById(`gameCol-${b.afterGameIndex}`);
    const rightCol = document.getElementById(`gameCol-${b.afterGameIndex + 1}`);
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

function applyColHighlight(g) {
  const col = document.getElementById(`gameCol-${g}`);
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
  const cell = document.getElementById(`gameWinnerCell-${g}`);
  if (!cell) return;
  if (blue >= maj && blue > red) gameWinner[g] = 1;
  else if (red >= maj && red > blue) gameWinner[g] = 2;
  else gameWinner[g] = 0;
  applyWinnerState(cell, gameWinner[g]);
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
  buildTable();
  updateTournamentWinner();
});

// =====================================================================
// FULLSCREEN
// =====================================================================
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => { });
  } else {
    document.exitFullscreen().catch(() => { });
  }
});

// =====================================================================
// INIT
// =====================================================================
buildTable();

window.addEventListener('resize', () => {
  renderBreakMarkers();
});
document.addEventListener('fullscreenchange', () => {
  renderBreakMarkers();
});

