(function(window) {
  'use strict';
  window.LankaPickModules = window.LankaPickModules || {};

// =====================================================================
// WARCRAFT III MAP PICKING ENGINE
// =====================================================================

// Mapový pool (8 oficiálních map Warcraft III s detailními verzemi)
const WARCRAFT_MAP_POOL = [
  { id: 'bojiste', name: 'Bojiště', image: 'map_picks/warcraft/bojiste.png', detailImage: 'map_picks/warcraft/bojiste + cisla.png' },
  { id: 'draci_vodopady', name: 'Dračí vodopády', image: 'map_picks/warcraft/draci_vodopady.png', detailImage: 'map_picks/warcraft/draci_vodopady + cisla.png' },
  { id: 'kamenolom', name: 'Kamenolom', image: 'map_picks/warcraft/kamenolom.png', detailImage: 'map_picks/warcraft/kamenolom + cisla.png' },
  { id: 'pavouci_vodopady', name: 'Pavoučí vodopády', image: 'map_picks/warcraft/pavouci_vodopady.png', detailImage: 'map_picks/warcraft/pavouci_vodopady + cisla.png' },
  { id: 'pustiny', name: 'Pustiny', image: 'map_picks/warcraft/pustiny.png', detailImage: 'map_picks/warcraft/pustiny + cisla.png' },
  { id: 'servile', name: 'Servile', image: 'map_picks/warcraft/servile.png', detailImage: 'map_picks/warcraft/servile + cisla.png' },
  { id: 'trh', name: 'Trh', image: 'map_picks/warcraft/trh.png', detailImage: 'map_picks/warcraft/trh + cisla.png' },
  { id: 'valecna_zahrada', name: 'Válečná zahrada', image: 'map_picks/warcraft/valecna_zahrada.png', detailImage: 'map_picks/warcraft/valecna_zahrada + cisla.png' },
];

function getMapImagePath(mapId) {
  const map = WARCRAFT_MAP_POOL.find(m => m.id === mapId);
  return map ? map.image : `map_picks/warcraft/${mapId}.png`;
}

function getMapDetailImagePath(mapId) {
  const map = WARCRAFT_MAP_POOL.find(m => m.id === mapId);
  return map ? (map.detailImage || map.image) : `map_picks/warcraft/${mapId}.png`;
}

// Sekvence kroků pro BO3 (8 map: 2 bany -> 2 picky -> 2 bany -> 1 decider z 2 zbývajících)
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

// Stav pickování
let pickState = {
  currentStepIndex: 0,
  teamA: null,          // 'blue' | 'red'
  teamB: null,          // 'blue' | 'red'
  bannedMapIds: [],     // zabanované mapy
  pickedMaps: [],       // pole vybraných map
  stepResults: {},      // výsledky kroků pro timeline
  pendingDeciderMap: null, // vylosovaný decider čekající na potvrzení
  isCompleted: false,
};

const STORAGE_KEY = 'lanka_pick_warcraft';
const STATE_BACKUP_KEY = 'lanka_warcraft_pick_state_v1';

// =====================================================================
// AUTOMATICKÁ SYNCHRONIZACE S VÝSLEDKEM CS2 ZE SCORE.HTML
// Poražený tým z CS2 má automaticky 1. ban (začíná jako Tým A)
// =====================================================================
function getCS2Winner() {
  let cs2Winner = 0;
  try {
    const raw = localStorage.getItem('lanka_tournament_score');
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.gameWinner) && (data.gameWinner[0] === 1 || data.gameWinner[0] === 2)) {
        cs2Winner = data.gameWinner[0];
      } else if (Array.isArray(data.results) && Array.isArray(data.results[0])) {
        const b = data.results[0].filter(v => v === 1).length;
        const r = data.results[0].filter(v => v === 2).length;
        if (b >= 2) cs2Winner = 1;
        else if (r >= 2) cs2Winner = 2;
      }
    }
  } catch (e) { /* ignore */ }

  try {
    const url = new URL(window.location.href);
    const csWinner = url.searchParams.get('cs2_winner');
    if (csWinner === 'blue') cs2Winner = 1;
    else if (csWinner === 'red') cs2Winner = 2;
  } catch (e) { /* ignore */ }

  return cs2Winner;
}

function syncWithCS2Score() {
  const cs2Winner = getCS2Winner();
  if (cs2Winner === 1) {
    // Modrý tým vyhrál CS2 -> Červený tým prohrál CS2 a má 1. ban (Tým A)
    pickState.teamA = 'red';
    pickState.teamB = 'blue';
    if (pickState.currentStepIndex === 0) {
      pickState.currentStepIndex = 1;
    }
    saveState();
  } else if (cs2Winner === 2) {
    // Červený tým vyhrál CS2 -> Modrý tým prohrál CS2 a má 1. ban (Tým A)
    pickState.teamA = 'blue';
    pickState.teamB = 'red';
    if (pickState.currentStepIndex === 0) {
      pickState.currentStepIndex = 1;
    }
    saveState();
  }
}

// =====================================================================
// NAČTENÍ & ULOŽENÍ STAVU + PŘENOS DO SCORE.HTML
// =====================================================================
function loadState() {
  const saved = localStorage.getItem(STATE_BACKUP_KEY);
  if (saved) {
    try {
      pickState = JSON.parse(saved);
      // Validace, zda uložené mapy odpovídají novému poolu map (jinak resetujeme)
      const validMapIds = new Set(WARCRAFT_MAP_POOL.map(m => m.id));
      const hasInvalidBans = (pickState.bannedMapIds || []).some(id => !validMapIds.has(id));
      const hasInvalidPicks = (pickState.pickedMaps || []).some(p => !validMapIds.has(p.mapId));
      if (hasInvalidBans || hasInvalidPicks) {
        resetState();
      }
    } catch (e) {
      console.error('Chyba při čtení stavu:', e);
      resetState();
    }
  } else {
    resetState();
  }

  // Automaticky zkontrolujeme výsledek CS2
  syncWithCS2Score();
}

function saveState() {
  localStorage.setItem(STATE_BACKUP_KEY, JSON.stringify(pickState));
  saveToScoreStorage();
}

function getScoreData() {
  if (!pickState.pickedMaps || pickState.pickedMaps.length === 0) return null;

  return {
    game: 'warcraft',
    teamA: pickState.teamA,
    teamB: pickState.teamB,
    rounds: pickState.pickedMaps.map((pm, idx) => ({
      round: idx + 1,
      mapId: pm.mapId,
      mapName: pm.mapName,
      mapImage: getMapImagePath(pm.mapId).replace('map_picks/warcraft/', ''),
      metaTop: pm.mapName,
      metaBottom: '', // U Warcraftu se zobrazuje pouze název mapy
      pickedBy: pm.pickedBy,
    })),
  };
}

function getScoreUrl() {
  const data = getScoreData();
  if (!data) return 'score.html?reset_warcraft=1';
  return `score.html?pick_warcraft=${encodeURIComponent(JSON.stringify(data))}`;
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

let isDrawingDecider = false;

function resetState() {
  isDrawingDecider = false;
  pickState = {
    currentStepIndex: 0,
    teamA: null,
    teamB: null,
    bannedMapIds: [],
    pickedMaps: [],
    stepResults: {},
    pendingDeciderMap: null,
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
// TÝMOVÉ POMOCNÉ FUNKCE
// =====================================================================
function getTeamColor(teamCode) {
  if (teamCode === 'A') return pickState.teamA;
  if (teamCode === 'B') return pickState.teamB;
  return teamCode;
}

function getTeamName(teamCode) {
  const color = getTeamColor(teamCode);
  if (color === 'blue') return 'MODRÝ TÝM';
  if (color === 'red') return 'ČERVENÝ TÝM';
  return teamCode === 'A' ? 'TÝM A' : teamCode === 'B' ? 'TÝM B' : 'TÝM';
}

// =====================================================================
// RENDER ČASOVÉ OSY (LEVÝ SLOUPEC)
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

    // Spojovací šipka
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
      else if (step.type === 'decider') teamLabel = '50/50';
    }

    const teamColor = getTeamColor(step.team);
    let teamColorCls = 'team-neutral';
    let banColorCls = 'ban-neutral';
    let frameColorCls = 'frame-neutral';

    if (teamColor === 'blue') {
      teamColorCls = 'team-blue';
      banColorCls = 'ban-blue';
      frameColorCls = 'frame-blue';
    } else if (teamColor === 'red') {
      teamColorCls = 'team-red';
      banColorCls = 'ban-red';
      frameColorCls = 'frame-red';
    }

    const stepResult = pickState.stepResults[idx];

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

    // KROK 0: Poražený z CS2 má 1. ban
    if (step.type === 'rps') {
      const loserTeam = pickState.teamA;
      const loserCls = loserTeam === 'blue' ? 'team-blue' : loserTeam === 'red' ? 'team-red' : '';
      const loserName = loserTeam === 'blue' ? 'MODRÝ' : loserTeam === 'red' ? 'ČERVENÝ' : '';

      if (needsFullBuild) {
        row.innerHTML = `
          <div class="timeline-row-team">
            ${loserTeam ? `<span class="team-mini-label ${loserCls}">${loserName}</span>` : ''}
          </div>
          <div class="timeline-row-action">
            <div class="timeline-cs2loser-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" title="Poražený z CS2 začíná jako Tým A">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="cs2loser-svg">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>PROHRÁVAJÍCÍ ZAČÍNÁ</span>
            </div>
          </div>
        `;
      } else {
        const teamSpan = row.querySelector('.team-mini-label');
        if (teamSpan && loserTeam) {
          teamSpan.className = `team-mini-label ${loserCls}`;
          teamSpan.textContent = loserName;
        }
        const loserNode = row.querySelector('.timeline-cs2loser-node');
        if (loserNode) loserNode.className = `timeline-cs2loser-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;
      }
      return;
    }

    // BANY
    if (step.type === 'ban') {
      if (needsFullBuild) {
        row.innerHTML = `
          <div class="timeline-row-team">
            <span class="team-mini-label ${teamColorCls} ${isActive ? 'is-active-team' : ''}">${teamLabel}</span>
          </div>
          <div class="timeline-row-action">
            <div class="ban-action-centered ${banColorCls} ${isActive ? 'is-active-action' : ''}">
              <svg class="ban-cross-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span class="ban-keyword">BAN</span>
            </div>
          </div>
        `;
      } else {
        const teamSpan = row.querySelector('.team-mini-label');
        if (teamSpan) {
          teamSpan.className = `team-mini-label ${teamColorCls} ${isActive ? 'is-active-team' : ''}`;
          teamSpan.textContent = teamLabel;
        }
        const banDiv = row.querySelector('.ban-action-centered');
        if (banDiv) {
          banDiv.className = `ban-action-centered ${banColorCls} ${isActive ? 'is-active-action' : ''}`;
        }
      }
      return;
    }

    // PICKY A DECIDER
    if (step.type === 'pick' || step.type === 'decider') {
      const isDecider = step.type === 'decider';
      const frameTeamLabel = isDecider ? '50/50' : teamLabel;
      const frameTeamCls = isDecider ? 'team-neutral' : teamColorCls;
      const mapOrderText = `${step.mapNumber}. MAPA`;

      let currentMap = stepResult;
      if (!currentMap && isDecider && pickState.pendingDeciderMap) {
        currentMap = {
          mapId: pickState.pendingDeciderMap.id,
          mapName: pickState.pendingDeciderMap.name,
          pickedBy: 'decider',
        };
      }

      let frameInnerHtml = '';
      let renderKey = '';
      if (currentMap) {
        const imgSrc = getMapImagePath(currentMap.mapId);
        const tagHtml = `<div class="frame-ct-tag">${currentMap.mapName}</div>`;

        renderKey = `map-${currentMap.mapId}-${currentMap.pickedBy || ''}`;
        frameInnerHtml = `
          <img src="${imgSrc}" alt="" class="frame-map-img" draggable="false" onerror="this.src='assets/images/warcraft_logo.png'">
          <div class="frame-bottom-gradient"></div>
          ${tagHtml}
        `;
      } else {
        const activeStatusBadge = isActive ? `<div class="frame-active-status">${isDecider ? 'LOSOVÁNÍ' : 'VÝBĚR'}</div>` : '';
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
            <span class="team-mini-label ${frameTeamCls} ${isActive ? 'is-active-team' : ''}">${frameTeamLabel}</span>
          </div>
          <div class="timeline-row-action">
            <div class="timeline-map-frame ${frameColorCls} ${isActive ? 'is-active' : ''} ${currentMap ? 'has-map is-completed' : ''}" data-render-key="${renderKey}">
              ${frameInnerHtml}
            </div>
          </div>
        `;
      } else {
        const teamSpan = row.querySelector('.team-mini-label');
        if (teamSpan) {
          teamSpan.className = `team-mini-label ${frameTeamCls} ${isActive ? 'is-active-team' : ''}`;
          teamSpan.textContent = frameTeamLabel;
        }
        const frame = row.querySelector('.timeline-map-frame');
        if (frame) {
          frame.className = `timeline-map-frame ${frameColorCls} ${isActive ? 'is-active' : ''} ${currentMap ? 'has-map is-completed' : ''}`;
          if (frame.dataset.renderKey !== renderKey) {
            frame.innerHTML = frameInnerHtml;
            frame.dataset.renderKey = renderKey;
          }
        }
      }
    }
  });
}

// =====================================================================
// RENDER PRACOVNÍ PLOCHY (PRAVÁ ČÁST)
// =====================================================================
function renderWorkspace() {
  const workspace = document.getElementById('workspaceCol');
  if (!workspace) return;

  // 1. DOKONČENO: Souhrn
  if (pickState.isCompleted) {
    workspace.innerHTML = '';
    renderSummaryView(workspace);
    return;
  }

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  if (!currentStep) return;

  // 2. KROK 0: Kámen nůžky papír
  if (currentStep.type === 'rps') {
    workspace.innerHTML = '';
    renderRPSChoice(workspace);
    return;
  }

  // 3. MŘÍŽKA MAP (BAN, PICK, DECIDER)
  renderMapPoolGrid(workspace, currentStep);
}

// ---------------------------------------------------------------------
// KROK: Poražený z CS2 začíná jako Tým A
// ---------------------------------------------------------------------
function renderRPSChoice(container) {
  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">KDO PROHRÁL CS2?</h2>
      <p class="workspace-subtitle">Tým, který prohrál Counter-Strike 2, začíná jako Tým A a má 1. ban ve Warcraftu.</p>
    </div>

    <div class="rps-cards-wrapper">
      <div class="rps-team-card rps-card-blue" id="loserSelectBlue" role="button" tabindex="0">
        <div class="rps-card-title">MODRÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">PROHRÁL CS2 (1. BAN)</div>
      </div>

      <div class="rps-team-card rps-card-red" id="loserSelectRed" role="button" tabindex="0">
        <div class="rps-card-title">ČERVENÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">PROHRÁL CS2 (1. BAN)</div>
      </div>
    </div>
  `;

  document.getElementById('loserSelectBlue')?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      // Modrý tým prohrál CS2 -> začíná jako Tým A
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
      // Červený tým prohrál CS2 -> začíná jako Tým A
      pickState.teamA = 'red';
      pickState.teamB = 'blue';
      pickState.currentStepIndex = 1;
      saveState();
      render();
    }, 130);
  });
}

// ---------------------------------------------------------------------
// KROK: Mřížka map pro BAN, PICK nebo DECIDER
// ---------------------------------------------------------------------
function renderMapPoolGrid(container, step) {
  const isBan = step.type === 'ban';
  const isPick = step.type === 'pick';
  const isDecider = step.type === 'decider';
  const teamColor = getTeamColor(step.team);

  container.className = `workspace-column ${teamColor === 'blue' ? 'active-picker-blue' : teamColor === 'red' ? 'active-picker-red' : ''
    } ${isBan ? 'is-ban-phase' : isPick ? 'is-pick-phase' : 'is-decider-phase'}`;

  const candidateMaps = WARCRAFT_MAP_POOL.filter(
    m => !pickState.bannedMapIds.includes(m.id) && !pickState.pickedMaps.some(pm => pm.mapId === m.id)
  );

  const isDeciderDrawn = isDecider && Boolean(pickState.pendingDeciderMap);

  const existingGrid = document.getElementById('mapsGrid');
  if (existingGrid) {
    WARCRAFT_MAP_POOL.forEach(map => {
      const card = document.getElementById(`mapCard-${map.id}`);
      if (!card) return;

      const isBanned = pickState.bannedMapIds.includes(map.id);
      const pickedInfo = pickState.pickedMaps.find(pm => pm.mapId === map.id);
      const isWinnerDrawn = isDeciderDrawn && pickState.pendingDeciderMap && pickState.pendingDeciderMap.id === map.id;
      const isPicked = Boolean(pickedInfo) || isWinnerDrawn;
      const isCandidate = isDecider && !isDeciderDrawn && candidateMaps.some(cm => cm.id === map.id);
      const isAvailable = !isBanned && !isPicked && !isCandidate;

      card.classList.remove('is-selecting', 'is-flicker-active');

      if (isBanned) {
        card.className = 'map-card is-banned';
        card.querySelector('.map-card-hover-cross')?.remove();
        card.querySelector('.map-card-hover-check')?.remove();
        card.querySelector('.map-card-picked-overlay')?.remove();
        card.classList.remove('is-decider-candidate');

        if (!card.querySelector('.map-card-banned-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'map-card-banned-overlay';
          overlay.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>ZAKÁZÁNO</span>
          `;
          card.prepend(overlay);
        }
        const badge = card.querySelector('.map-card-status-badge');
        if (badge) {
          badge.className = 'map-card-status-badge';
          badge.textContent = 'BAN';
        }
        card.onclick = null;
      } else if (isPicked) {
        card.className = 'map-card is-picked';
        card.querySelector('.map-card-hover-cross')?.remove();
        card.querySelector('.map-card-hover-check')?.remove();
        card.querySelector('.map-card-banned-overlay')?.remove();
        card.classList.remove('is-decider-candidate');

        const roundNum = pickedInfo ? pickedInfo.round : (step.mapNumber || 3);
        let pickedOverlay = card.querySelector('.map-card-picked-overlay');
        if (!pickedOverlay) {
          pickedOverlay = document.createElement('div');
          pickedOverlay.className = 'map-card-picked-overlay';
          pickedOverlay.innerHTML = `
            <div class="picked-check-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="picked-order-title">${roundNum}. MAPA</span>
          `;
          card.prepend(pickedOverlay);
        } else {
          const orderSpan = pickedOverlay.querySelector('.picked-order-title');
          if (orderSpan) orderSpan.textContent = `${roundNum}. MAPA`;
        }
        const badge = card.querySelector('.map-card-status-badge');
        if (badge) {
          badge.className = 'map-card-status-badge status-picked';
          badge.textContent = 'VYBRÁNO';
        }
        card.onclick = null;
      } else if (isCandidate) {
        card.className = 'map-card is-decider-candidate';
        card.querySelector('.map-card-hover-cross')?.remove();
        card.querySelector('.map-card-hover-check')?.remove();
        card.querySelector('.map-card-banned-overlay')?.remove();
        card.querySelector('.map-card-picked-overlay')?.remove();

        const badge = card.querySelector('.map-card-status-badge');
        if (badge) {
          badge.className = 'map-card-status-badge status-decider';
          badge.textContent = 'KANDIDÁT';
        }
        card.onclick = () => {
          triggerDeciderDraw(candidateMaps, step);
        };
      } else if (isAvailable) {
        card.className = 'map-card';
        card.querySelector('.map-card-banned-overlay')?.remove();
        card.querySelector('.map-card-picked-overlay')?.remove();
        card.classList.remove('is-decider-candidate');

        const badge = card.querySelector('.map-card-status-badge');
        if (badge) {
          badge.className = 'map-card-status-badge';
          badge.textContent = 'VOLNÁ';
        }

        const hoverCross = card.querySelector('.map-card-hover-cross');
        const hoverCheck = card.querySelector('.map-card-hover-check');
        if (isBan && !hoverCross) {
          hoverCheck?.remove();
          const hc = document.createElement('div');
          hc.className = 'map-card-hover-cross';
          hc.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          `;
          card.prepend(hc);
        } else if (!isBan && !hoverCheck) {
          hoverCross?.remove();
          const hchk = document.createElement('div');
          hchk.className = 'map-card-hover-check';
          hchk.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `;
          card.prepend(hchk);
        }

        card.onclick = () => {
          handleMapSelection(map, step);
        };
      }
    });

    renderDeciderActionBar(container, step, candidateMaps, isDecider, isDeciderDrawn);
    return;
  }

  // Celková výstavba mřížky s informačními buňkami pravidel dole
  container.innerHTML = `
    <div class="maps-grid-wrapper">
      <div class="maps-grid" id="mapsGrid"></div>
      
      <!-- Informační buňky pravidel turnaje (Zlaté doly a Food cap) -->
      <div class="wc-rules-bar" id="wcRulesBar">
        <div class="wc-rule-card">
          <div class="wc-rule-icon-box">
            <img src="map_picks/warcraft/gold_icon.png" alt="Zlato" class="wc-rule-icon-img" onerror="this.onerror=null; this.src='map_picks/warcraft/gold_coin.png';">
          </div>
          <div class="wc-rule-info">
            <div class="wc-rule-title">ZÁSOBY ZLATA V DOLECH</div>
            <div class="wc-rule-desc">Doly u základen 5 500 zlata, ostatní 8 000 zlata.</div>
          </div>
        </div>

        <div class="wc-rule-card">
          <div class="wc-rule-icon-box">
            <img src="map_picks/warcraft/food.png" alt="Food cap" class="wc-rule-icon-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="wc-rule-icon-fallback" style="display: none;">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div class="wc-rule-info">
            <div class="wc-rule-title">LIMIT JEDNOTEK (FOOD CAP)</div>
            <div class="wc-rule-desc">Limit jídla omezen na 65.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const grid = document.getElementById('mapsGrid');

  WARCRAFT_MAP_POOL.forEach(map => {
    const isBanned = pickState.bannedMapIds.includes(map.id);
    const pickedInfo = pickState.pickedMaps.find(pm => pm.mapId === map.id);
    const isWinnerDrawn = isDeciderDrawn && pickState.pendingDeciderMap && pickState.pendingDeciderMap.id === map.id;
    const isPicked = Boolean(pickedInfo) || isWinnerDrawn;
    const isCandidate = isDecider && !isDeciderDrawn && candidateMaps.some(cm => cm.id === map.id);
    const isAvailable = !isBanned && !isPicked && !isCandidate;

    const card = document.createElement('div');
    card.className = `map-card ${isBanned ? 'is-banned' : ''} ${isPicked ? 'is-picked' : ''} ${isCandidate ? 'is-decider-candidate' : ''}`;
    card.id = `mapCard-${map.id}`;

    let overlayHtml = '';
    if (isBanned) {
      overlayHtml = `
        <div class="map-card-banned-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <span>ZAKÁZÁNO</span>
        </div>
      `;
    } else if (isPicked) {
      const roundNum = pickedInfo ? pickedInfo.round : (step.mapNumber || 3);
      overlayHtml = `
        <div class="map-card-picked-overlay">
          <div class="picked-check-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="picked-order-title">${roundNum}. MAPA</span>
        </div>
      `;
    }

    let hoverHtml = '';
    if (isAvailable) {
      if (isBan) {
        hoverHtml = `
          <div class="map-card-hover-cross">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        `;
      } else {
        hoverHtml = `
          <div class="map-card-hover-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        `;
      }
    }

    const badgeCls = isPicked ? 'status-picked' : isCandidate ? 'status-decider' : '';
    const badgeText = isBanned ? 'BAN' : isPicked ? 'VYBRÁNO' : isCandidate ? 'KANDIDÁT' : 'VOLNÁ';

    card.innerHTML = `
      ${overlayHtml}
      ${hoverHtml}
      <div class="map-card-image-box">
        <img src="${map.image}" alt="${map.name}" class="map-card-img" draggable="false" onerror="this.src='assets/images/warcraft_logo.png'">
        <button type="button" class="map-detail-btn" title="Ukázat detail mapy" data-map-id="${map.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y1="11"/>
          </svg>
          <span>DETAIL</span>
        </button>
      </div>
      <div class="map-card-footer">
        <div class="map-card-title">${map.name}</div>
        <div class="map-card-status-badge ${badgeCls}">
          ${badgeText}
        </div>
      </div>
    `;

    card.querySelector('.map-detail-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openMapDetailModal(map.id);
    });

    if (isCandidate) {
      card.onclick = () => {
        triggerDeciderDraw(candidateMaps, step);
      };
    } else if (isAvailable) {
      card.onclick = () => {
        handleMapSelection(map, step);
      };
    }

    grid.appendChild(card);
  });

  renderDeciderActionBar(container, step, candidateMaps, isDecider, isDeciderDrawn);
}

// ---------------------------------------------------------------------
// Akční lišta pro Decider (Losování nebo Pokračovat)
// ---------------------------------------------------------------------
function renderDeciderActionBar(container, step, candidateMaps, isDecider, isDeciderDrawn) {
  let actionBar = document.getElementById('deciderActionBar');

  if (!isDecider) {
    if (actionBar) actionBar.remove();
    return;
  }

  const wrapper = container.querySelector('.maps-grid-wrapper') || container;
  const rulesBar = document.getElementById('wcRulesBar');
  if (!actionBar) {
    actionBar = document.createElement('div');
    actionBar.id = 'deciderActionBar';
    actionBar.className = 'decider-action-bar';
    if (rulesBar && rulesBar.parentNode === wrapper) {
      wrapper.insertBefore(actionBar, rulesBar);
    } else {
      wrapper.appendChild(actionBar);
    }
  }

  if (!isDeciderDrawn) {
    actionBar.innerHTML = `
      <button class="decider-draw-btn" id="deciderDrawBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
        <span>NÁHODNĚ VYLOSOVAT POSLEDNÍ MAPU</span>
      </button>
    `;
    document.getElementById('deciderDrawBtn')?.addEventListener('click', () => {
      triggerDeciderDraw(candidateMaps, step);
    });
  } else {
    actionBar.innerHTML = `
      <button class="decider-proceed-btn" id="deciderProceedBtn">
        <span>POKRAČOVAT</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    `;
    document.getElementById('deciderProceedBtn')?.addEventListener('click', () => {
      finalizeAndCompleteDecider(step);
    });
  }
}

// ---------------------------------------------------------------------
// Zpracování kliknutí na mapu (BAN nebo PICK)
// ---------------------------------------------------------------------
function handleMapSelection(map, step) {
  const card = document.getElementById(`mapCard-${map.id}`);
  if (card) {
    card.classList.add('is-selecting');
  }

  setTimeout(() => {
    if (step.type === 'ban') {
      pickState.bannedMapIds.push(map.id);
      pickState.stepResults[pickState.currentStepIndex] = {
        mapId: map.id,
        mapName: map.name,
      };
      pickState.currentStepIndex++;
      saveState();
      render();
    } else if (step.type === 'pick') {
      // Ve Warcraftu není volba CT/T stran — mapa se okamžitě vybere pro tým
      const teamColor = getTeamColor(step.team);
      const pickedRecord = {
        round: step.mapNumber,
        mapId: map.id,
        mapName: map.name,
        mapImage: getMapImagePath(map.id).replace('map_picks/warcraft/', ''),
        pickedBy: teamColor,
      };

      pickState.pickedMaps.push(pickedRecord);
      pickState.stepResults[pickState.currentStepIndex] = {
        mapId: map.id,
        mapName: map.name,
        mapImage: getMapImagePath(map.id),
        pickedBy: teamColor,
      };

      pickState.currentStepIndex++;
      saveState();
      render();
    }
  }, 130);
}

// ---------------------------------------------------------------------
// Animované vylosování decider mapy ze zbývajících 2 kandidátů
// ---------------------------------------------------------------------
function triggerDeciderDraw(candidates, step) {
  if (isDrawingDecider) return;
  if (!candidates || candidates.length === 0) return;

  isDrawingDecider = true;

  const drawBtn = document.getElementById('deciderDrawBtn');
  if (drawBtn) {
    drawBtn.disabled = true;
    drawBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      <span>LOSOVÁNÍ MAPY...</span>
    `;
  }

  candidates.forEach(m => {
    const card = document.getElementById(`mapCard-${m.id}`);
    if (card) card.onclick = null;
  });

  const winnerIdx = Math.floor(Math.random() * candidates.length);
  const winner = candidates[winnerIdx];
  const losers = candidates.filter(m => m.id !== winner.id);

  const totalHops = 22;
  const flickerSequence = [];
  for (let i = 0; i < totalHops; i++) {
    const offset = (winnerIdx - (totalHops - 1 - i)) % candidates.length;
    const idx = (offset + candidates.length * 100) % candidates.length;
    flickerSequence.push(candidates[idx]);
  }

  function getHopDelay(hopIndex) {
    const remaining = totalHops - 1 - hopIndex;
    if (remaining > 9) return 75;
    if (remaining > 5) return 120;
    if (remaining > 2) return 200;
    if (remaining === 2) return 280;
    if (remaining === 1) return 360;
    return 480;
  }

  function runHop(hopIndex) {
    candidates.forEach(m => {
      document.getElementById(`mapCard-${m.id}`)?.classList.remove('is-flicker-active');
    });

    const activeMap = flickerSequence[hopIndex];
    document.getElementById(`mapCard-${activeMap.id}`)?.classList.add('is-flicker-active');

    if (hopIndex < totalHops - 1) {
      setTimeout(() => {
        runHop(hopIndex + 1);
      }, getHopDelay(hopIndex));
    } else {
      setTimeout(() => {
        finalizeDeciderDraw(winner, losers, step);
      }, getHopDelay(hopIndex));
    }
  }

  function finalizeDeciderDraw(winnerMap, loserMaps, currentStep) {
    candidates.forEach(m => {
      const card = document.getElementById(`mapCard-${m.id}`);
      if (card) {
        card.classList.remove('is-flicker-active');
        card.classList.remove('is-decider-candidate');
      }
    });

    loserMaps.forEach(loser => {
      if (!pickState.bannedMapIds.includes(loser.id)) {
        pickState.bannedMapIds.push(loser.id);
      }
      const card = document.getElementById(`mapCard-${loser.id}`);
      if (card) {
        card.className = 'map-card is-banned';
        card.querySelector('.map-card-hover-cross')?.remove();
        card.querySelector('.map-card-hover-check')?.remove();
        if (!card.querySelector('.map-card-banned-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'map-card-banned-overlay';
          overlay.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>ZAKÁZÁNO</span>
          `;
          card.prepend(overlay);
        }
        const badge = card.querySelector('.map-card-status-badge');
        if (badge) {
          badge.className = 'map-card-status-badge';
          badge.textContent = 'BAN';
        }
      }
    });

    pickState.pendingDeciderMap = winnerMap;
    pickState.stepResults[pickState.currentStepIndex] = {
      mapId: winnerMap.id,
      mapName: winnerMap.name,
      mapImage: getMapImagePath(winnerMap.id),
      pickedBy: 'decider',
    };

    const winnerCard = document.getElementById(`mapCard-${winnerMap.id}`);
    if (winnerCard) {
      winnerCard.className = 'map-card is-picked';
      winnerCard.querySelector('.map-card-hover-cross')?.remove();
      winnerCard.querySelector('.map-card-hover-check')?.remove();
      if (!winnerCard.querySelector('.map-card-picked-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'map-card-picked-overlay';
        overlay.innerHTML = `
          <div class="picked-check-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="picked-order-title">${currentStep.mapNumber}. MAPA</span>
        `;
        winnerCard.prepend(overlay);
      }
      const badge = winnerCard.querySelector('.map-card-status-badge');
      if (badge) {
        badge.className = 'map-card-status-badge status-picked';
        badge.textContent = 'VYBRÁNO';
      }
    }

    renderTimeline();
    saveState();
    isDrawingDecider = false;

    // Zobrazíme neutrální tlačítko Pokračovat
    const actionBar = document.getElementById('deciderActionBar');
    if (actionBar) {
      actionBar.innerHTML = `
        <button class="decider-proceed-btn" id="deciderProceedBtn">
          <span>POKRAČOVAT</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      `;
      document.getElementById('deciderProceedBtn')?.addEventListener('click', () => {
        finalizeAndCompleteDecider(step);
      });
    }
  }

  runHop(0);
}

function finalizeAndCompleteDecider(step) {
  const winnerMap = pickState.pendingDeciderMap;
  if (winnerMap) {
    const pickedRecord = {
      round: step.mapNumber,
      mapId: winnerMap.id,
      mapName: winnerMap.name,
      mapImage: getMapImagePath(winnerMap.id).replace('map_picks/warcraft/', ''),
      pickedBy: 'decider',
    };
    pickState.pickedMaps.push(pickedRecord);
  }

  pickState.pendingDeciderMap = null;
  pickState.currentStepIndex++;
  pickState.isCompleted = true;

  saveState();
  render();
}

// ---------------------------------------------------------------------
// KROK: Dokončeno (Souhrn vybraných map)
// ---------------------------------------------------------------------
function renderSummaryView(container) {
  container.className = 'workspace-column';
  container.innerHTML = `
    <div class="summary-wrapper">
      <h2 class="summary-title">PICKOVÁNÍ DOKONČENO</h2>

      <div class="summary-maps-grid" id="summaryGrid"></div>

      <a href="${getScoreUrl()}" class="summary-go-score-btn" id="summaryGoScoreBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span>PŘEJÍT NA TURNAJOVÉ SKÓRE</span>
      </a>
    </div>
  `;

  const grid = document.getElementById('summaryGrid');
  pickState.pickedMaps.forEach(pm => {
    const card = document.createElement('div');
    card.className = 'summary-map-card';

    card.innerHTML = `
      <div class="summary-map-order">${pm.round}. MAPA</div>
      <div class="summary-map-image-box">
        <img src="${getMapImagePath(pm.mapId)}" alt="${pm.mapName}" class="summary-map-img" draggable="false" onerror="this.src='assets/images/warcraft_logo.png'">
        <button type="button" class="map-detail-btn" title="Ukázat detail mapy" data-map-id="${pm.mapId}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y1="11"/>
          </svg>
          <span>DETAIL</span>
        </button>
      </div>
      <div class="summary-map-details">
        <div class="summary-map-name">${pm.mapName}</div>
      </div>
    `;

    card.querySelector('.map-detail-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openMapDetailModal(pm.mapId);
    });
    grid.appendChild(card);
  });
}

// =====================================================================
// INDIKÁTOR TÝMU NA ŘADĚ
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
  if (!currentStep || currentStep.type === 'rps' || currentStep.type === 'decider') {
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
// HLAVNÍ RENDER CYKLUS
// =====================================================================
function render() {
  updateTopTurnDisplay();
  renderTimeline();
  renderWorkspace();
  updateScoreLinks();
}

// =====================================================================
// DETAIL MAPY NA CELOU OBRAZOVKU (LIGHTBOX SE ZAČERNĚNÝM POZADÍM)
// =====================================================================
let currentDetailMapId = null;
let showCreepNumbers = false; // Výchozí: s čísly kempů

function openMapDetailModal(mapId) {
  const map = WARCRAFT_MAP_POOL.find(m => m.id === mapId);
  if (!map) return;
  currentDetailMapId = mapId;

  const modal = document.getElementById('mapModalBackdrop');
  const titleEl = document.getElementById('mapModalTitle');
  const toggleBtn = document.getElementById('mapModalToggleNumbersBtn');

  if (titleEl) titleEl.textContent = map.name;

  const hasNumbersVariant = Boolean(map.detailImage && map.detailImage !== map.image);
  if (toggleBtn) {
    toggleBtn.style.display = hasNumbersVariant ? 'inline-flex' : 'none';
  }

  updateModalImage();

  if (modal) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function updateModalImage() {
  const map = WARCRAFT_MAP_POOL.find(m => m.id === currentDetailMapId);
  if (!map) return;
  const imgEl = document.getElementById('mapModalImg');
  const toggleBtn = document.getElementById('mapModalToggleNumbersBtn');
  const toggleLabel = document.getElementById('mapModalToggleNumbersLabel');

  const src = (showCreepNumbers && map.detailImage) ? map.detailImage : map.image;
  if (imgEl) {
    imgEl.src = src;
    imgEl.alt = map.name;
  }

  if (toggleBtn && toggleLabel) {
    if (showCreepNumbers) {
      toggleBtn.classList.add('is-active');
      toggleLabel.textContent = 'ČÍSLA KEMPŮ: ZAP';
    } else {
      toggleBtn.classList.remove('is-active');
      toggleLabel.textContent = 'ČÍSLA KEMPŮ: VYP';
    }
  }
}

function closeMapDetailModal() {
  const modal = document.getElementById('mapModalBackdrop');
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
  currentDetailMapId = null;
}

let modalListenersInitialized = false;
function initModalListeners() {
  if (modalListenersInitialized) return;
  modalListenersInitialized = true;
  document.getElementById('mapModalCloseBtn')?.addEventListener('click', closeMapDetailModal);
  document.getElementById('mapModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'mapModalBackdrop') closeMapDetailModal();
  });
  document.getElementById('mapModalToggleNumbersBtn')?.addEventListener('click', () => {
    showCreepNumbers = !showCreepNumbers;
    updateModalImage();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMapDetailModal();
  });
}

  window.LankaPickModules.warcraft = {
    id: 'warcraft',
    name: 'Warcraft III',
    mount() {
      initModalListeners();
      loadState();
      syncWithCS2Score();
      render();
    },
    unmount() {
      closeMapDetailModal();
      const ws = document.getElementById('workspaceCol');
      if (ws) ws.innerHTML = '';
      const tl = document.getElementById('timelineContainer');
      if (tl) tl.innerHTML = '';
      const turn = document.getElementById('topTurnDisplay');
      if (turn) { turn.className = 'top-turn-display is-hidden'; turn.innerHTML = ''; }
    },
    reset(silent = false) {
      if (silent || confirm('Opravdu chcete resetovat celé pickování Warcraft III a začít znovu?')) {
        resetState();
        syncWithCS2Score();
        render();
      }
    }
  };

  if (!window.LankaSPA) {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.LankaMusic) {
        window.LankaMusic.bindUI();
        window.LankaMusic.playGame('warcraft');
      }
      window.LankaPickModules.warcraft.mount();
      document.getElementById('resetPickBtn')?.addEventListener('click', () => {
        window.LankaPickModules.warcraft.reset();
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

