(function(window) {
  'use strict';
  window.LankaPickModules = window.LankaPickModules || {};

// =====================================================================
// OVERWATCH 2 MAP PICKING ENGINE (BO5)
// MÓDY: CONTROL -> ESCORT -> HYBRID -> CONTROL -> ESCORT
// ZAČÍNÁ TÝM, KTERÝ PROHRÁVÁ V TURNAJI
// =====================================================================

// Mapový pool rozdělený podle oficiálních módů
const OW_MAP_POOL = {
  control: [
    { id: 'antarctic_peninsula', name: 'Antarctic Peninsula', image: 'map_picks/overwatch/control/Antarctic_Peninsula.webp' },
    { id: 'busan', name: 'Busan', image: 'map_picks/overwatch/control/Busan.webp' },
    { id: 'ilios', name: 'Ilios', image: 'map_picks/overwatch/control/Ilios.webp' },
    { id: 'lijiang_tower', name: 'Lijiang Tower', image: 'map_picks/overwatch/control/Lijiang_Tower.webp' },
    { id: 'nepal', name: 'Nepal', image: 'map_picks/overwatch/control/Nepal.webp' },
    { id: 'oasis', name: 'Oasis', image: 'map_picks/overwatch/control/Oasis.webp' },
    { id: 'samoa', name: 'Samoa', image: 'map_picks/overwatch/control/Samoa.webp' },
  ],
  escort: [
    { id: 'circuit_royal', name: 'Circuit Royal', image: 'map_picks/overwatch/escort/Monte_Carlo.webp' },
    { id: 'dorado', name: 'Dorado', image: 'map_picks/overwatch/escort/Dorado.webp' },
    { id: 'gibraltar', name: 'Watchpoint: Gibraltar', image: 'map_picks/overwatch/escort/Gibraltar.webp' },
    { id: 'havana', name: 'Havana', image: 'map_picks/overwatch/escort/Havana.webp' },
    { id: 'junkertown', name: 'Junkertown', image: 'map_picks/overwatch/escort/Junkertown.webp' },
    { id: 'rialto', name: 'Rialto', image: 'map_picks/overwatch/escort/Rialto.webp' },
    { id: 'route_66', name: 'Route 66', image: 'map_picks/overwatch/escort/Route_66.webp' },
    { id: 'shambali', name: 'Shambali Monastery', image: 'map_picks/overwatch/escort/Shambali.webp' },
  ],
  hybrid: [
    { id: 'blizzard_world', name: 'Blizzard World', image: 'map_picks/overwatch/hybrid/Blizzard_World.webp' },
    { id: 'eichenwalde', name: 'Eichenwalde', image: 'map_picks/overwatch/hybrid/Eichenwalde.webp' },
    { id: 'hollywood', name: 'Hollywood', image: 'map_picks/overwatch/hybrid/Hollywood.webp' },
    { id: 'kings_row', name: "King's Row", image: "map_picks/overwatch/hybrid/King's_Row.webp" },
    { id: 'midtown', name: 'Midtown', image: 'map_picks/overwatch/hybrid/Midtown.webp' },
    { id: 'neon_junction', name: 'Neon Junction', image: 'map_picks/overwatch/hybrid/Neon-Junction.webp' },
    { id: 'numbani', name: 'Numbani', image: 'map_picks/overwatch/hybrid/Numbani.webp' },
    { id: 'paraiso', name: 'Paraíso', image: 'map_picks/overwatch/hybrid/Paraíso.webp' },
  ],
};

// Informace o módech (ikony a popisky)
const OW_MODES = {
  control: {
    id: 'control',
    name: 'Control',
    icon: 'map_picks/overwatch/modes/control.png',
    desc: 'Boj o nadvládu nad kontrolním bodem (do 100 %)',
  },
  escort: {
    id: 'escort',
    name: 'Escort',
    icon: 'map_picks/overwatch/modes/escort.png',
    desc: 'Doprovázení nákladu k cílovým bodům',
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    icon: 'map_picks/overwatch/modes/hybrid.png',
    desc: 'Zabraní výchozího bodu a následný doprovod nákladu',
  },
};

// Pořadí kroků: BO5 střídání picků podle zadaných módů
// 1. Mapa: Escort (Tým A - prohrávající v sérii)
// 2. Mapa: Control  (Tým B)
// 3. Mapa: Hybrid  (Tým A)
// 4. Mapa: Escort (Tým B) - bez mapy vybrané v 1. kole
// 5. Mapa: Control  (Tým A) - bez mapy vybrané v 2. kole
const PICK_SEQUENCE = [
  { id: 'step-0', type: 'trailing' },
  { id: 'step-1', type: 'pick', team: 'A', mapNumber: 1, mode: 'escort' },
  { id: 'step-2', type: 'pick', team: 'B', mapNumber: 2, mode: 'control' },
  { id: 'step-3', type: 'pick', team: 'A', mapNumber: 3, mode: 'hybrid' },
  { id: 'step-4', type: 'pick', team: 'B', mapNumber: 4, mode: 'escort' },
  { id: 'step-5', type: 'pick', team: 'A', mapNumber: 5, mode: 'control' },
];

// Stav pickování
let pickState = {
  currentStepIndex: 0,
  teamA: null,          // 'blue' | 'red'
  teamB: null,          // 'blue' | 'red'
  pickedMaps: [],       // [{ round, mapId, mapName, imagePath, mode, modeName, pickedBy }]
  stepResults: {},      // metadata kroků pro timeline
  isCompleted: false,
};

const STORAGE_KEY = 'lanka_pick_overwatch';
const STATE_BACKUP_KEY = 'lanka_ow_pick_state_v1';

// =====================================================================
// NAČTENÍ & ULOŽENÍ STAVU
// =====================================================================
function loadState() {
  const saved = localStorage.getItem(STATE_BACKUP_KEY);
  if (saved) {
    try {
      pickState = JSON.parse(saved);
      return;
    } catch (e) {
      console.error('Chyba při čtení stavu:', e);
    }
  }
  resetState();
}

function saveState() {
  localStorage.setItem(STATE_BACKUP_KEY, JSON.stringify(pickState));
  saveToScoreStorage();
}

function getScoreData() {
  if (!pickState.pickedMaps || pickState.pickedMaps.length === 0) return null;

  return {
    game: 'overwatch',
    teamA: pickState.teamA,
    teamB: pickState.teamB,
    rounds: pickState.pickedMaps.map((pm, idx) => ({
      round: idx + 1,
      mapId: pm.mapId,
      mapName: pm.mapName,
      mapImage: pm.imagePath.replace('map_picks/overwatch/', ''),
      metaTop: pm.mapName,
      metaBottom: pm.modeName || pm.mode,
      pickedBy: pm.pickedBy,
    })),
  };
}

function getScoreUrl() {
  const data = getScoreData();
  if (!data) return 'score.html?reset_overwatch=1';
  return `score.html?pick_overwatch=${encodeURIComponent(JSON.stringify(data))}`;
}

function updateScoreLinks() {
  const url = getScoreUrl();
  const headerBtn = document.getElementById('headerScoreBtn');
  if (headerBtn) headerBtn.href = url;

  const summaryBtn = document.getElementById('summaryGoScoreBtn');
  if (summaryBtn) summaryBtn.href = url;
}

function saveToScoreStorage() {
  const scoreData = getScoreData();
  try {
    if (scoreData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Nelze zapsat do localStorage:', e);
  }

  updateScoreLinks();
}

function resetState() {
  pickState = {
    currentStepIndex: 0,
    teamA: null,
    teamB: null,
    pickedMaps: [],
    stepResults: {},
    isCompleted: false,
  };
  localStorage.removeItem(STATE_BACKUP_KEY);
  localStorage.removeItem(STORAGE_KEY);

  const container = document.getElementById('timelineContainer');
  if (container) container.innerHTML = '';
  const workspace = document.getElementById('workspaceCol');
  if (workspace) workspace.innerHTML = '';
}

// =====================================================================
// AUTOMATICKÉ URČENÍ TÝMU, KTERÝ PROHRÁVÁ V TURNAJI
// Začíná ten, kdo prohrává (Tým A). Pokud je remíza, proběhne rozstřel.
// =====================================================================
function getTournamentTrailingTeam() {
  // 1. URL searchParams (?ow_first=blue/red nebo ?lead=blue/red)
  try {
    const url = new URL(window.location.href);
    const owFirst = url.searchParams.get('ow_first');
    if (owFirst === 'blue' || owFirst === 'red') return owFirst;

    const lead = url.searchParams.get('lead');
    if (lead === 'blue') return 'red';
    if (lead === 'red') return 'blue';
  } catch (e) { }

  // 2. Čtení stavu z celkového turnajového skóre
  try {
    const raw = localStorage.getItem('lanka_tournament_score');
    if (raw) {
      const data = JSON.parse(raw);
      let blueWins = 0, redWins = 0;
      // Projdeme hry 0: CS2, 1: Warcraft III, 2: LoL
      for (let g = 0; g < 3; g++) {
        let w = data.gameWinner?.[g];
        if (!w && Array.isArray(data.results?.[g])) {
          const b = data.results[g].filter(v => v === 1).length;
          const r = data.results[g].filter(v => v === 2).length;
          if (b >= 2) w = 1;
          else if (r >= 2) w = 2;
        }
        if (w === 1) blueWins++;
        else if (w === 2) redWins++;
      }
      if (blueWins > redWins) return 'red';  // Červený tým prohrává -> začíná
      if (redWins > blueWins) return 'blue'; // Modrý tým prohrává -> začíná
    }
  } catch (e) { }

  return null;
}

function syncWithTournamentScore() {
  const trailingTeam = getTournamentTrailingTeam();
  if (trailingTeam) {
    pickState.teamA = trailingTeam;
    pickState.teamB = trailingTeam === 'blue' ? 'red' : 'blue';
    if (pickState.currentStepIndex === 0) {
      pickState.currentStepIndex = 1;
    }
    saveState();
  }
}

// =====================================================================
// POMOCNÉ FUNKCE PRO VÝPOČET TÝMŮ A TEXTŮ
// =====================================================================
function getTeamColor(teamSlot) {
  if (teamSlot === 'A') return pickState.teamA;
  if (teamSlot === 'B') return pickState.teamB;
  return null;
}

function getTeamName(teamColor) {
  if (teamColor === 'blue') return 'MODRÝ TÝM';
  if (teamColor === 'red') return 'ČERVENÝ TÝM';
  return 'NEZNÁMÝ';
}

function getMapById(mode, mapId) {
  const pool = OW_MAP_POOL[mode] || [];
  return pool.find(m => m.id === mapId);
}

// =====================================================================
// HORNÍ LIŠTA: INDIKÁTOR TÝMU NA ŘADĚ
// =====================================================================
function updateTopTurnDisplay() {
  const display = document.getElementById('topTurnDisplay');
  if (!display) return;

  document.body.classList.remove('turn-active-blue', 'turn-active-red');

  if (pickState.isCompleted) {
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
    return;
  }

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  if (!currentStep || currentStep.type === 'trailing' || currentStep.type === 'rps') {
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
    return;
  }

  const teamColor = getTeamColor(currentStep.team);

  if (teamColor === 'blue') {
    document.body.classList.add('turn-active-blue');
    display.className = 'top-turn-display turn-card-blue';
    display.textContent = 'MODRÝ TÝM';
  } else if (teamColor === 'red') {
    document.body.classList.add('turn-active-red');
    display.className = 'top-turn-display turn-card-red';
    display.textContent = 'ČERVENÝ TÝM';
  } else {
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
  }
}

// =====================================================================
// LEVÝ SLOUPEC: ČASOVÁ OSA POSTUPU (TIMELINE)
// =====================================================================
function renderTimeline() {
  const container = document.getElementById('timelineContainer');
  if (!container) return;

  const isTeamsChosen = Boolean(pickState.teamA && pickState.teamB);
  container.className = isTeamsChosen ? 'timeline-container teams-chosen' : 'timeline-container';

  const existingRows = container.querySelectorAll('.timeline-row');
  const needsFullBuild = existingRows.length !== PICK_SEQUENCE.length;

  if (needsFullBuild) {
    container.innerHTML = '';
  }

  PICK_SEQUENCE.forEach((step, idx) => {
    const isPast = idx < pickState.currentStepIndex || (pickState.isCompleted && idx <= pickState.currentStepIndex);
    const isActive = idx === pickState.currentStepIndex && !pickState.isCompleted;

    // Spojovací šipka zarovnaná na osu akcí (zvýrazněna ta, která ukazuje na aktivní krok)
    if (idx > 0) {
      let arrowRow;
      if (needsFullBuild) {
        arrowRow = document.createElement('div');
        arrowRow.id = `timelineArrow-${idx}`;
        arrowRow.innerHTML = `
          <div class="timeline-row-team-spacer"></div>
          <div class="timeline-arrow-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4v14"/>
              <path d="m18 13-6 6-6-6"/>
            </svg>
          </div>
        `;
        container.appendChild(arrowRow);
      } else {
        arrowRow = document.getElementById(`timelineArrow-${idx}`);
      }
      if (arrowRow) {
        arrowRow.className = `timeline-arrow-row ${isPast ? 'is-passed' : ''} ${isActive ? 'is-next-active' : ''}`;
      }
    }

    let teamLabel = '';
    if (!isTeamsChosen) {
      if (step.team === 'A') teamLabel = 'TÝM A';
      else if (step.team === 'B') teamLabel = 'TÝM B';
    }

    const teamColor = getTeamColor(step.team);
    let teamColorCls = 'team-neutral';
    let frameColorCls = 'frame-neutral';

    if (teamColor === 'blue') {
      teamColorCls = 'team-blue';
      frameColorCls = 'frame-blue';
      teamLabel = 'MODRÝ';
    } else if (teamColor === 'red') {
      teamColorCls = 'team-red';
      frameColorCls = 'frame-red';
      teamLabel = 'ČERVENÝ';
    }
    const frameTeamCls = teamColorCls;

    const stepResult = pickState.pickedMaps[step.mapNumber - 1];

    let row;
    if (needsFullBuild) {
      row = document.createElement('div');
      row.id = `timelineRow-${idx}`;
      container.appendChild(row);
    } else {
      row = document.getElementById(`timelineRow-${idx}`);
    }
    if (!row) return;

    row.className = `timeline-row ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;

    // KROK 0: Prohrávající vybírá první (hvězdička, stejně jako u lolka)
    if (step.type === 'trailing' || step.type === 'rps') {
      const loserTeam = pickState.teamA;
      const loserCls = loserTeam === 'blue' ? 'team-blue' : loserTeam === 'red' ? 'team-red' : '';
      const loserName = loserTeam === 'blue' ? 'MODRÝ' : loserTeam === 'red' ? 'ČERVENÝ' : '';

      if (needsFullBuild) {
        row.innerHTML = `
          <div class="timeline-row-team">
            ${loserTeam ? `<span class="team-mini-label ${loserCls}">${loserName}</span>` : ''}
          </div>
          <div class="timeline-row-action">
            <div class="timeline-skip-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" title="Prohrávající vybírá první">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="skip-svg">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>PROHRÁVAJÍCÍ ZAČÍNÁ</span>
            </div>
          </div>
        `;
      } else {
        const teamSpan = row.querySelector('.team-mini-label');
        if (teamSpan) {
          if (loserTeam) {
            teamSpan.className = `team-mini-label ${loserCls}`;
            teamSpan.textContent = loserName;
          } else {
            teamSpan.textContent = '';
          }
        }
        const skipNode = row.querySelector('.timeline-skip-node');
        if (skipNode) {
          skipNode.className = `timeline-skip-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;
        }
      }
      return;
    }

    // PICK KROKY (1 až 5) — Zde je "MAPA" místo "KOLO"
    const modeInfo = OW_MODES[step.mode];
    const mapOrderText = `${modeInfo.name.toUpperCase()}`;

    let frameInnerHtml = '';
    let renderKey = '';

    if (stepResult) {
      renderKey = `map-${stepResult.mapId}-${stepResult.pickedBy || ''}`;
      frameInnerHtml = `
        <img src="${stepResult.imagePath}" alt="" class="frame-map-img" draggable="false">
        <div class="frame-bottom-gradient"></div>
        <div class="frame-ct-tag">${stepResult.mapName}</div>
      `;
    } else {
      const activeStatusBadge = isActive ? `<div class="frame-active-status">VÝBĚR</div>` : '';
      renderKey = `prepick-${isActive}-${mapOrderText}`;
      frameInnerHtml = `
        <div class="frame-prepick-content">
          <div class="frame-order-title">${mapOrderText}</div>
          ${activeStatusBadge}
        </div>
      `;
    }

    if (needsFullBuild) {
      row.innerHTML = `
        <div class="timeline-row-team">
          <span class="team-mini-label ${frameTeamCls} ${isActive ? 'is-active-team' : ''}">${teamLabel}</span>
        </div>
        <div class="timeline-row-action">
          <div class="timeline-map-frame ${frameColorCls} ${isActive ? 'is-active' : ''} ${stepResult ? 'has-map is-completed' : ''}" data-render-key="${renderKey}">
            ${frameInnerHtml}
          </div>
        </div>
      `;
    } else {
      const teamSpan = row.querySelector('.team-mini-label');
      if (teamSpan) {
        teamSpan.className = `team-mini-label ${frameTeamCls} ${isActive ? 'is-active-team' : ''}`;
        teamSpan.textContent = teamLabel;
      }
      const frame = row.querySelector('.timeline-map-frame');
      if (frame) {
        frame.className = `timeline-map-frame ${frameColorCls} ${isActive ? 'is-active' : ''} ${stepResult ? 'has-map is-completed' : ''}`;
        if (frame.dataset.renderKey !== renderKey) {
          frame.innerHTML = frameInnerHtml;
          frame.dataset.renderKey = renderKey;
        }
      }
    }
  });
}

// =====================================================================
// PRAVÁ ČÁST: PRACOVNÍ PLOCHA
// =====================================================================
function renderWorkspace() {
  const container = document.getElementById('workspaceCol');
  if (!container) return;

  if (pickState.isCompleted) {
    renderSummaryView(container);
    return;
  }

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  if (!currentStep) return;

  if (currentStep.type === 'trailing' || currentStep.type === 'rps') {
    renderTrailingTeamSelectView(container);
    return;
  }

  if (currentStep.type === 'pick') {
    renderMapPoolGrid(container, currentStep);
  }
}

// ---------------------------------------------------------------------
// KROK 0: Kdo začíná (prohrávající tým z předchozích her)
// ---------------------------------------------------------------------
function renderTrailingTeamSelectView(container) {
  container.className = 'workspace-column';
  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">KDO PROHRÁVÁ V SÉRII A VYBÍRÁ PRVNÍ?</h2>
      <p class="workspace-subtitle">Tým, který v turnaji prohrává, má právo první volby mapy v Overwatch 2.</p>
    </div>

    <div class="rps-cards-wrapper">
      <div class="rps-team-card rps-card-blue" id="loserSelectBlue" role="button" tabindex="0">
        <div class="rps-card-title">MODRÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">PROHRÁVÁ SÉRII (1. PICK)</div>
      </div>

      <div class="rps-team-card rps-card-red" id="loserSelectRed" role="button" tabindex="0">
        <div class="rps-card-title">ČERVENÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">PROHRÁVÁ SÉRII (1. PICK)</div>
      </div>
    </div>
  `;

  document.getElementById('loserSelectBlue')?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      pickState.teamA = 'blue';
      pickState.teamB = 'red';
      pickState.currentStepIndex = 1;
      saveState();
      render();
    }, 130);
  });

  document.getElementById('loserSelectRed')?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      pickState.teamA = 'red';
      pickState.teamB = 'blue';
      pickState.currentStepIndex = 1;
      saveState();
      render();
    }, 130);
  });
}

// ---------------------------------------------------------------------
// KROK: Mřížka map pro daný mód (Control, Escort, Hybrid)
// ---------------------------------------------------------------------
function renderMapPoolGrid(container, step) {
  const teamColor = getTeamColor(step.team);
  const modeInfo = OW_MODES[step.mode];
  const pool = OW_MAP_POOL[step.mode] || [];

  container.className = `workspace-column ${teamColor === 'blue' ? 'active-picker-blue' : 'active-picker-red'} is-pick-phase`;

  // Zjistíme, které mapy v tomto módu už byly vybrány v dřívějším kole
  const alreadyPickedMapIdsInThisMode = pickState.pickedMaps
    .filter(pm => pm.mode === step.mode)
    .map(pm => pm.mapId);

  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">${modeInfo.name.toUpperCase()}</h2>
    </div>

    <div class="maps-grid-wrapper">
      <div class="maps-grid" id="mapsGrid">
        ${pool.map(map => {
    const prevPick = pickState.pickedMaps.find(pm => pm.mapId === map.id);
    const isAlreadyPicked = Boolean(prevPick);

    return `
            <div class="map-card ${isAlreadyPicked ? 'is-banned is-already-picked' : ''}" id="mapCard-${map.id}" data-map-id="${map.id}">
              ${isAlreadyPicked ? `
                <div class="map-card-banned-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>ODEHRÁNO (${prevPick.round}. MAPA)</span>
                </div>
              ` : `
                <div class="map-card-hover-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              `}

              <div class="map-card-image-box">
                <img src="${map.image}" alt="${map.name}" class="map-card-img" draggable="false" />
              </div>

              <div class="map-card-footer">
                <div class="map-card-title">${map.name}</div>
                <div class="map-card-status-badge ${isAlreadyPicked ? 'status-picked' : ''}">
                  ${isAlreadyPicked ? 'ODEHRÁNO' : 'VOLNÁ'}
                </div>
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;

  // Obsluha kliknutí na kartu mapy (provedení výběru)
  container.querySelectorAll('.map-card:not(.is-already-picked)').forEach(card => {
    card.addEventListener('click', () => {
      const mapId = card.getAttribute('data-map-id');
      const mapObj = getMapById(step.mode, mapId);
      if (!mapObj) return;

      card.classList.add('is-selecting');

      setTimeout(() => {
        executeMapPick(step, mapObj);
      }, 140);
    });
  });
}

// ---------------------------------------------------------------------
// PROVEDENÍ VÝBĚRU MAPY
// ---------------------------------------------------------------------
function executeMapPick(step, mapObj) {
  const teamColor = getTeamColor(step.team);
  const modeInfo = OW_MODES[step.mode];

  const pickEntry = {
    round: step.mapNumber,
    mapId: mapObj.id,
    mapName: mapObj.name,
    imagePath: mapObj.image,
    mode: step.mode,
    modeName: modeInfo.name,
    pickedBy: teamColor,
  };

  pickState.pickedMaps.push(pickEntry);
  pickState.stepResults[pickState.currentStepIndex] = pickEntry;

  pickState.currentStepIndex++;

  if (pickState.currentStepIndex >= PICK_SEQUENCE.length) {
    pickState.isCompleted = true;
  }

  saveState();
  render();
}

// ---------------------------------------------------------------------
// KROK: DOKONČENÝ PICK (SOUHRN VŠECH 5 MAP PRO OVERWATCH 2 BO5)
// ---------------------------------------------------------------------
function renderSummaryView(container) {
  container.className = 'workspace-column';
  container.innerHTML = `
    <div class="summary-wrapper">
      <h2 class="summary-title">PICKOVÁNÍ DOKONČENO</h2>

      <div class="summary-maps-grid summary-bo5-grid">
        ${pickState.pickedMaps.map(pm => {
    const modeInfo = OW_MODES[pm.mode];
    return `
            <div class="summary-map-card">
              <div class="summary-map-order">${pm.round}. MAPA</div>

              <div class="summary-map-image-box">
                <img src="${pm.imagePath}" alt="${pm.mapName}" class="summary-map-img" />
              </div>

              <div class="summary-map-details">
                <div class="summary-map-name">${pm.mapName}</div>
                <div class="summary-map-mode">${modeInfo.name.toUpperCase()}</div>
              </div>
            </div>
          `;
  }).join('')}
      </div>

      <a href="${getScoreUrl()}" class="summary-go-score-btn" id="summaryGoScoreBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span>PŘEJÍT NA TURNAJOVÉ SKÓRE</span>
      </a>
    </div>
  `;
}

// =====================================================================
// HLAVNÍ RENDER CYKLUS
// =====================================================================
function render() {
  updateTopTurnDisplay();
  renderTimeline();
  renderWorkspace();
  updateScoreLinks();
}

  window.LankaPickModules.overwatch = {
    id: 'overwatch',
    name: 'Overwatch 2',
    mount() {
      loadState();
      if (pickState.currentStepIndex === 0 && !pickState.teamA) {
        syncWithTournamentScore();
      }
      render();
    },
    unmount() {
      const ws = document.getElementById('workspaceCol');
      if (ws) ws.innerHTML = '';
      const tl = document.getElementById('timelineContainer');
      if (tl) tl.innerHTML = '';
      const turn = document.getElementById('topTurnDisplay');
      if (turn) { turn.className = 'top-turn-display is-hidden'; turn.innerHTML = ''; }
    },
    reset(silent = false) {
      if (silent || confirm('Opravdu chcete resetovat pickování map pro Overwatch 2 a začít znovu?')) {
        resetState();
        syncWithTournamentScore();
        render();
      }
    }
  };

  if (!window.LankaSPA) {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.LankaMusic) {
        window.LankaMusic.bindUI();
        window.LankaMusic.playGame('overwatch');
      }
      window.LankaPickModules.overwatch.mount();
      document.getElementById('resetPickBtn')?.addEventListener('click', () => {
        window.LankaPickModules.overwatch.reset();
      });
      document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        } else {
          document.exitFullscreen().catch(() => { });
        }
      });
    });
  }
})(window);
