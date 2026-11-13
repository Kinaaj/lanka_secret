// =====================================================================
// CS2 MAP PICKING ENGINE
// =====================================================================

// Mapový pool (8 map)
const CS_MAP_POOL = [
  { id: 'ancient', name: 'Ancient', image: 'map_picks/cs2/ancient.jpg' },
  { id: 'anubis', name: 'Anubis', image: 'map_picks/cs2/anubis.jpg' },
  { id: 'cache', name: 'Cache', image: 'map_picks/cs2/cache.webp' },
  { id: 'dust2', name: 'Dust II', image: 'map_picks/cs2/dust2.jpg' },
  { id: 'inferno', name: 'Inferno', image: 'map_picks/cs2/inferno.jpg' },
  { id: 'mirage', name: 'Mirage', image: 'map_picks/cs2/mirage.jpg' },
  { id: 'overpass', name: 'Overpass', image: 'map_picks/cs2/overpass.jpg' },
  { id: 'train', name: 'Train', image: 'map_picks/cs2/train.jpg' },
];

function getMapImagePath(mapId) {
  const map = CS_MAP_POOL.find(m => m.id === mapId);
  return map ? map.image : `map_picks/cs2/${mapId}.jpg`;
}

// Obecně konfigurovatelná sekvence kroků
// - type: 'rps' | 'ban' | 'pick' | 'decider'
// - team: 'A' | 'B' (kdo provádí výběr/ban)
// - mapNumber: číslo mapy (1, 2, 3...)
// - sideChooser: 'A' | 'B' (kdo vybírá stranu CT/T pro danou mapu)
const PICK_SEQUENCE = [
  { id: 'step-0', type: 'rps' },
  { id: 'step-1', type: 'ban', team: 'A' },
  { id: 'step-2', type: 'ban', team: 'B' },
  { id: 'step-3', type: 'pick', team: 'A', mapNumber: 1, sideChooser: 'B' },
  { id: 'step-4', type: 'pick', team: 'B', mapNumber: 2, sideChooser: 'A' },
  { id: 'step-5', type: 'ban', team: 'A' },
  { id: 'step-6', type: 'ban', team: 'B' },
  { id: 'step-7', type: 'decider', mapNumber: 3 },
];

// Stav pickování
let pickState = {
  currentStepIndex: 0,
  teamA: null,          // 'blue' | 'red'
  teamB: null,          // 'blue' | 'red'
  stepResults: {},      // výsledky kroků pro zobrazení v timeline
  isSideSelecting: false, // probíhá volba CT/T pro vybranou mapu
  pendingMap: null,     // mapa čekající na volbu strany
  pendingSides: null,   // vylosované strany pro decider
  isCompleted: false,
};

const STORAGE_KEY = 'lanka_pick_cs2';
const STATE_BACKUP_KEY = 'lanka_cs_pick_state_v1';

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
    game: 'cs2',
    teamA: pickState.teamA,
    teamB: pickState.teamB,
    rounds: pickState.pickedMaps.map((pm, idx) => ({
      round: idx + 1,
      mapId: pm.mapId,
      mapName: pm.mapName,
      mapImage: getMapImagePath(pm.mapId).replace('map_picks/cs2/', ''),
      metaTop: pm.mapName,
      metaBottom: pm.ctTeam ? `CT: ${pm.ctTeam === 'blue' ? 'Modří' : 'Červení'}` : '',
      ctTeam: pm.ctTeam,
      pickedBy: pm.pickedBy,
    })),
  };
}

function getScoreUrl() {
  const data = getScoreData();
  if (!data) return 'score.html?reset_cs2=1';
  return `score.html?pick_cs2=${encodeURIComponent(JSON.stringify(data))}`;
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
let isDrawingSide = false;

function resetState() {
  isDrawingDecider = false;
  isDrawingSide = false;
  pickState = {
    currentStepIndex: 0,
    teamA: null,
    teamB: null,
    bannedMapIds: [],
    pickedMaps: [],
    stepResults: {},
    isSideSelecting: false,
    pendingMap: null,
    pendingSides: null,
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

function getTeamClass(teamCode) {
  const color = getTeamColor(teamCode);
  if (color === 'blue') return 'team-blue';
  if (color === 'red') return 'team-red';
  return 'team-neutral';
}

// =====================================================================
// RENDER ČASOVÉ OSY (LEVÝ SLOUPEC)
// - Tým je oddělen doleva od akce
// - Rámečky pouze pro picknuté mapy s vloženým obrázkem
// - Texty zarovnány na střed
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
      else if (step.type === 'decider') teamLabel = '50/50';
    }

    const teamColor = getTeamColor(step.team); // 'blue' | 'red' | null
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

    // 1. Krok: Kámen Nůžky Papír (ikony: kámen, papír i nůžky vedle sebe)
    if (step.type === 'rps') {
      if (needsFullBuild) {
        row.innerHTML = `
          <div class="timeline-row-team"></div>
          <div class="timeline-row-action">
            <div class="timeline-rps-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" title="Kámen Nůžky Papír">
              <div class="rps-icons-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rps-svg" title="Kámen">
                  <path d="M6 10l3-5 6 1 4 5-1 7-7 3-6-3z"/>
                </svg>

                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rps-svg" title="Nůžky">
                  <circle cx="6" cy="6" r="3"/>
                  <circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                  <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                  <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                </svg>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rps-svg" title="Papír">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
            </div>
          </div>
        `;
      } else {
        const rpsNode = row.querySelector('.timeline-rps-node');
        if (rpsNode) rpsNode.className = `timeline-rps-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;
      }
      return;
    }

    // BANY: Tým vlevo (před rozstřelem) / po rozstřelu pouze barevný křížek a barevné BAN
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

    // PICKY (1. Mapa, 2. Mapa, 3. Mapa): Rámeček stejný jako ve výběru
    if (step.type === 'pick' || step.type === 'decider') {
      const isDecider = step.type === 'decider';
      const frameTeamLabel = isDecider ? '50/50' : teamLabel;
      const frameTeamCls = isDecider ? 'team-neutral' : teamColorCls;
      const mapOrderText = `${step.mapNumber}. MAPA`;

      let currentMap = stepResult;
      if (!currentMap && isActive && pickState.isSideSelecting && pickState.pendingMap) {
        currentMap = {
          mapId: pickState.pendingMap.id,
          mapName: pickState.pendingMap.name,
          ctTeam: null,
        };
      }

      let frameInnerHtml = '';
      let renderKey = '';
      if (currentMap) {
        const imgSrc = getMapImagePath(currentMap.mapId);
        let ctLabelHtml = '';
        if (currentMap.ctTeam) {
          const ctTeamLabel = currentMap.ctTeam === 'blue' ? 'Modří' : 'Červení';
          ctLabelHtml = `<div class="frame-ct-tag">${currentMap.mapName}, CT: ${ctTeamLabel}</div>`;
        } else if (isActive) {
          ctLabelHtml = `<div class="frame-ct-tag frame-ct-selecting">VOLBA STRANY...</div>`;
        }

        renderKey = `map-${currentMap.mapId}-${currentMap.ctTeam || 'selecting'}`;
        frameInnerHtml = `
          <img src="${imgSrc}" alt="" class="frame-map-img" draggable="false">
          <div class="frame-bottom-gradient"></div>
          ${ctLabelHtml}
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

  // 1. DOKONČENO: Zobrazit souhrn vybraných map
  if (pickState.isCompleted) {
    workspace.innerHTML = '';
    renderSummaryView(workspace);
    return;
  }

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  if (!currentStep) return;

  // 2. KROK 0: Kámen nůžky papír (volba, kdo začíná jako Tým A)
  if (currentStep.type === 'rps') {
    workspace.innerHTML = '';
    renderRPSChoice(workspace);
    return;
  }

  // 3. VOLBA ZAČÍNAJÍCÍ STRANY (CT vs T) PRO PRÁVĚ VYBRANOU MAPU
  if (pickState.isSideSelecting && pickState.pendingMap) {
    workspace.innerHTML = '';
    renderSideSelection(workspace, currentStep);
    return;
  }

  // 4. MŘÍŽKA MAP: BAN, PICK NEBO DECIDER (NÁHODNÉ LOSOVÁNÍ ZE ZBÝVAJÍCÍCH MAP)
  // Ponecháváme existující DOM mřížky bez promazání pro plynulé zobrazení
  renderMapPoolGrid(workspace, currentStep);
}

// ---------------------------------------------------------------------
// KROK: Kámen Nůžky Papír (dvě karty ve stylu vítěze turnaje)
// ---------------------------------------------------------------------
function renderRPSChoice(container) {
  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">KDO VYHRÁL KÁMEN-NŮŽKY-PAPÍR?</h2>
      <p class="workspace-subtitle">Tým, který vyhrál rozstřel, začne jako Tým A a má první ban</p>
    </div>

    <div class="rps-cards-wrapper">
      <div class="rps-team-card rps-card-blue" id="rpsSelectBlue" role="button" tabindex="0">
        <div class="rps-card-title">MODRÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">ZAČÍT JAKO TÝM A</div>
      </div>

      <div class="rps-team-card rps-card-red" id="rpsSelectRed" role="button" tabindex="0">
        <div class="rps-card-title">ČERVENÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">ZAČÍT JAKO TÝM A</div>
      </div>
    </div>
  `;

  document.getElementById('rpsSelectBlue')?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      pickState.teamA = 'blue';
      pickState.teamB = 'red';
      pickState.currentStepIndex = 1;
      saveState();
      render();
    }, 130);
  });

  document.getElementById('rpsSelectRed')?.addEventListener('click', (e) => {
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
// KROK: Mřížka map pro BAN, PICK nebo DECIDER
// ---------------------------------------------------------------------
function renderMapPoolGrid(container, step) {
  const isBan = step.type === 'ban';
  const isPick = step.type === 'pick';
  const isDecider = step.type === 'decider';
  const teamColor = getTeamColor(step.team);

  // Nastavíme třídy na kontejner: bez nadpisu, pouze mřížka map
  container.className = `workspace-column ${teamColor === 'blue' ? 'active-picker-blue' : teamColor === 'red' ? 'active-picker-red' : ''
    } ${isBan ? 'is-ban-phase' : isPick ? 'is-pick-phase' : 'is-decider-phase'}`;

  // Zbývající kandidáti v poolu (ani zabanované, ani vybrané)
  const candidateMaps = CS_MAP_POOL.filter(
    m => !pickState.bannedMapIds.includes(m.id) && !pickState.pickedMaps.some(pm => pm.mapId === m.id)
  );

  // V decideru: zda už proběhlo losování a čeká se na volbu CT/T
  const isDeciderDrawn = isDecider && Boolean(pickState.pendingMap);

  const existingGrid = document.getElementById('mapsGrid');
  if (existingGrid) {
    // Plynulá aktualizace existujících karet bez přebliknutí mřížky
    CS_MAP_POOL.forEach(map => {
      const card = document.getElementById(`mapCard-${map.id}`);
      if (!card) return;

      const isBanned = pickState.bannedMapIds.includes(map.id);
      const pickedInfo = pickState.pickedMaps.find(pm => pm.mapId === map.id);
      const isWinnerDrawn = isDeciderDrawn && pickState.pendingMap && pickState.pendingMap.id === map.id;
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

        // Zkontrolujeme a přepneme hover ikonu podle fáze
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

  // Úplná výstavba mřížky pokud ještě neexistuje
  container.innerHTML = `
    <div class="maps-grid-wrapper">
      <div class="maps-grid" id="mapsGrid"></div>
    </div>
  `;

  const grid = document.getElementById('mapsGrid');

  CS_MAP_POOL.forEach(map => {
    const isBanned = pickState.bannedMapIds.includes(map.id);
    const pickedInfo = pickState.pickedMaps.find(pm => pm.mapId === map.id);
    const isWinnerDrawn = isDeciderDrawn && pickState.pendingMap && pickState.pendingMap.id === map.id;
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
        <img src="${map.image}" alt="${map.name}" class="map-card-img" draggable="false">
      </div>
      <div class="map-card-footer">
        <div class="map-card-title">${map.name}</div>
        <div class="map-card-status-badge ${badgeCls}">
          ${badgeText}
        </div>
      </div>
    `;

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
// Spodní akční lišta pro Decider (Losování nebo Volba stran)
// ---------------------------------------------------------------------
function renderDeciderActionBar(container, step, candidateMaps, isDecider, isDeciderDrawn) {
  let actionBar = document.getElementById('deciderActionBar');

  if (!isDecider) {
    if (actionBar) actionBar.remove();
    return;
  }

  const wrapper = container.querySelector('.maps-grid-wrapper') || container;
  if (!actionBar) {
    actionBar = document.createElement('div');
    actionBar.id = 'deciderActionBar';
    actionBar.className = 'decider-action-bar';
    wrapper.appendChild(actionBar);
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
        <span>VYLOSOVAT CT A T STRANU</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    `;
    document.getElementById('deciderProceedBtn')?.addEventListener('click', () => {
      pickState.isSideSelecting = true;
      saveState();
      render();
    });
  }
}

// ---------------------------------------------------------------------
// Animované vylosování decider mapy ze zbývajících kandidátů
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

  // Deaktivujeme kliky na kartách během animace
  candidates.forEach(m => {
    const card = document.getElementById(`mapCard-${m.id}`);
    if (card) card.onclick = null;
  });

  // Náhodný výběr jedné vítězné mapy
  const winnerIdx = Math.floor(Math.random() * candidates.length);
  const winner = candidates[winnerIdx];
  const losers = candidates.filter(m => m.id !== winner.id);

  // Sestavení delší sekvence pro losování (cca 2.4s s postupným zpomalováním)
  const totalHops = 22;
  const flickerSequence = [];
  for (let i = 0; i < totalHops; i++) {
    const offset = (winnerIdx - (totalHops - 1 - i)) % candidates.length;
    const idx = (offset + candidates.length * 100) % candidates.length;
    flickerSequence.push(candidates[idx]);
  }

  function getHopDelay(hopIndex) {
    const remaining = totalHops - 1 - hopIndex;
    if (remaining > 9) return 75;   // Rychlý rozjezd
    if (remaining > 5) return 120;  // Mírné zpomalení
    if (remaining > 2) return 200;  // Zpomalování
    if (remaining === 2) return 280; // Dramatické napětí
    if (remaining === 1) return 360; // Poslední krok před vítězem
    return 480;                     // Zastavení na vítězné mapě
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
      // Zastaveno na vítězi — chvíli necháme zvýrazněno (napětí), poté potvrdíme výsledek
      setTimeout(() => {
        finalizeDecider(winner, losers, step);
      }, getHopDelay(hopIndex));
    }
  }

  function finalizeDecider(winnerMap, loserMaps, currentStep) {
    // Zastavíme animaci a vyčistíme kandidátní stavy
    candidates.forEach(m => {
      const card = document.getElementById(`mapCard-${m.id}`);
      if (card) {
        card.classList.remove('is-flicker-active');
        card.classList.remove('is-decider-candidate');
      }
    });

    // 1. Všechny poražené zbývající mapy zešednou a zakřížkují se (přidány do banů)
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

    // 2. Vítězná mapa se označí jako vybraná (zelená fajfka a pořadové číslo mapy)
    pickState.pendingMap = winnerMap;
    pickState.stepResults[pickState.currentStepIndex] = {
      mapId: winnerMap.id,
      mapName: winnerMap.name,
      mapImage: getMapImagePath(winnerMap.id),
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

    // 3. Okamžitě aktualizujeme časovou osu vlevo s obrázkem vylosované mapy
    renderTimeline();

    // Uložíme aktuální stav
    saveState();
    isDrawingDecider = false;

    // 4. Zobrazíme tlačítko pro výběr CT a T strany
    const actionBar = document.getElementById('deciderActionBar');
    if (actionBar) {
      actionBar.innerHTML = `
        <button class="decider-proceed-btn" id="deciderProceedBtn">
          <span>VYLOSOVAT CT A T STRANU</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      `;
      document.getElementById('deciderProceedBtn')?.addEventListener('click', () => {
        pickState.isSideSelecting = true;
        saveState();
        render();
      });
    }
  }

  // Spuštění animace
  runHop(0);
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
      // Mapy zmizí a zobrazí se volba začínající strany pro tým, který mapu nevybíral
      pickState.isSideSelecting = true;
      pickState.pendingMap = map;
      saveState();
      render();
    }
  }, 130);
}

// ---------------------------------------------------------------------
// KROK: Volba začínající strany (CT nebo T)
// ---------------------------------------------------------------------
function renderSideSelection(container, step) {
  const isDecider = step.type === 'decider';
  const chooserTeamCode = step.sideChooser; // obvykle 'B' když vybíral 'A'
  const chooserTeamColor = chooserTeamCode ? getTeamColor(chooserTeamCode) : null;
  const map = pickState.pendingMap;

  container.className = 'workspace-column';

  if (!isDecider) {
    container.innerHTML = `
      <div class="side-selection-wrapper">
        <!-- Obdélník vybrané mapy, pro kterou se volí strana -->
        <div class="side-map-card">
          <div class="side-map-image-box">
            <img src="${map.image}" alt="${map.name}" class="side-map-img" draggable="false">
            <div class="side-map-order-badge">${step.mapNumber}. MAPA</div>
          </div>
          <div class="side-map-footer">
            <div class="side-map-title">${map.name}</div>
            <div class="side-map-status-badge">VYBRÁNO</div>
          </div>
        </div>

        <div class="side-cards-container">
          <!-- CT Karta -->
          <div class="side-choice-card card-ct" id="sideSelectCT" role="button" tabindex="0">
            <div class="side-badge-logo">CT</div>
            <div class="side-name-title">COUNTER-TERRORISTS</div>
            <div class="side-sub-desc">ZAČÍT V OBRANĚ</div>
          </div>

          <!-- T Karta -->
          <div class="side-choice-card card-t" id="sideSelectT" role="button" tabindex="0">
            <div class="side-badge-logo">T</div>
            <div class="side-name-title">TERRORISTS</div>
            <div class="side-sub-desc">ZAČÍT V ÚTOKU</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('sideSelectCT')?.addEventListener('click', (e) => {
      e.currentTarget.classList.add('is-selecting');
      setTimeout(() => {
        // Volící tým má CT, druhý tým má T
        applySideChoice(chooserTeamColor, chooserTeamColor === 'blue' ? 'red' : 'blue', step);
      }, 130);
    });

    document.getElementById('sideSelectT')?.addEventListener('click', (e) => {
      e.currentTarget.classList.add('is-selecting');
      setTimeout(() => {
        // Volící tým má T, druhý tým má CT
        const ctColor = chooserTeamColor === 'blue' ? 'red' : 'blue';
        applySideChoice(ctColor, chooserTeamColor, step);
      }, 130);
    });
  } else {
    // DECIDER: Strany se nevolí ručně, ale náhodně se losují tlačítkem
    const isDeciderSidesDrawn = Boolean(pickState.pendingSides);
    const ctTeam = isDeciderSidesDrawn ? pickState.pendingSides.ctTeam : null;
    const tTeam = isDeciderSidesDrawn ? pickState.pendingSides.tTeam : null;

    container.innerHTML = `
      <div class="side-selection-wrapper">
        <!-- Obdélník vybrané decider mapy -->
        <div class="side-map-card">
          <div class="side-map-image-box">
            <img src="${map.image}" alt="${map.name}" class="side-map-img" draggable="false">
            <div class="side-map-order-badge">${step.mapNumber}. MAPA — DECIDER</div>
          </div>
          <div class="side-map-footer">
            <div class="side-map-title">${map.name}</div>
            <div class="side-map-status-badge">VYBRÁNO</div>
          </div>
        </div>

        <div class="side-cards-container">
          <!-- CT Karta -->
          <div class="side-choice-card card-ct is-decider-side ${ctTeam ? `is-assigned-${ctTeam}` : ''}" id="sideCardCT">
            <div class="side-badge-logo">CT</div>
            <div class="side-name-title">COUNTER-TERRORISTS</div>
            <div class="side-sub-desc">ZAČÁTEK V OBRANĚ</div>
            <div class="side-slot-placeholder" id="sideSlotCT">
              ${ctTeam ? `<div class="side-assigned-pill pill-${ctTeam}">${ctTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM'}</div>` : ''}
            </div>
          </div>

          <!-- T Karta -->
          <div class="side-choice-card card-t is-decider-side ${tTeam ? `is-assigned-${tTeam}` : ''}" id="sideCardT">
            <div class="side-badge-logo">T</div>
            <div class="side-name-title">TERRORISTS</div>
            <div class="side-sub-desc">ZAČÁTEK V ÚTOKU</div>
            <div class="side-slot-placeholder" id="sideSlotT">
              ${tTeam ? `<div class="side-assigned-pill pill-${tTeam}">${tTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM'}</div>` : ''}
            </div>
          </div>
        </div>

        ${!isDeciderSidesDrawn ? `
          <button class="side-draw-btn" id="sideDrawBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            <span>NÁHODNĚ VYLOSOVAT STRANY</span>
          </button>
        ` : `
          <button class="side-proceed-btn" id="sideProceedBtn">
            <span>POKRAČOVAT</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        `}
      </div>
    `;

    if (!isDeciderSidesDrawn) {
      document.getElementById('sideDrawBtn')?.addEventListener('click', () => {
        triggerSideDraw(step);
      });
    } else {
      document.getElementById('sideProceedBtn')?.addEventListener('click', () => {
        const { ctTeam: savedCt, tTeam: savedT } = pickState.pendingSides;
        delete pickState.pendingSides;
        applySideChoice(savedCt, savedT, step);
      });
    }
  }
}

// ---------------------------------------------------------------------
// Náhodné vylosování stran CT a T pro Decider
// ---------------------------------------------------------------------
function triggerSideDraw(step) {
  if (isDrawingSide) return;
  isDrawingSide = true;

  const btn = document.getElementById('sideDrawBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      <span>LOSOVÁNÍ STRAN...</span>
    `;
  }

  const ctCard = document.getElementById('sideCardCT');
  const tCard = document.getElementById('sideCardT');

  // Náhodný hod: kdo dostane CT (50% Modrý, 50% Červený)
  const ctTeam = Math.random() < 0.5 ? 'blue' : 'red';
  const tTeam = ctTeam === 'blue' ? 'red' : 'blue';

  const totalHops = 16;
  let hop = 0;

  function runSideHop() {
    ctCard?.classList.remove('is-flicker-active');
    tCard?.classList.remove('is-flicker-active');

    if (hop % 2 === 0) {
      ctCard?.classList.add('is-flicker-active');
    } else {
      tCard?.classList.add('is-flicker-active');
    }

    hop++;

    if (hop < totalHops) {
      const remaining = totalHops - hop;
      let delay = 80;
      if (remaining <= 3) delay = 260;
      else if (remaining <= 6) delay = 160;
      else if (remaining <= 9) delay = 110;
      setTimeout(runSideHop, delay);
    } else {
      ctCard?.classList.remove('is-flicker-active');
      tCard?.classList.remove('is-flicker-active');

      // Zvýrazníme přiřazené týmy
      if (ctCard) {
        ctCard.classList.add(`is-assigned-${ctTeam}`);
        const slot = document.getElementById('sideSlotCT');
        if (slot) {
          slot.innerHTML = `<div class="side-assigned-pill pill-${ctTeam}">${ctTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM'}</div>`;
        }
      }

      if (tCard) {
        tCard.classList.add(`is-assigned-${tTeam}`);
        const slot = document.getElementById('sideSlotT');
        if (slot) {
          slot.innerHTML = `<div class="side-assigned-pill pill-${tTeam}">${tTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM'}</div>`;
        }
      }

      pickState.pendingSides = { ctTeam, tTeam };
      saveState();
      isDrawingSide = false;

      // Zobrazíme neutrální tlačítko Pokračovat
      if (btn) {
        btn.outerHTML = `
          <button class="side-proceed-btn" id="sideProceedBtn">
            <span>POKRAČOVAT</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        `;
        document.getElementById('sideProceedBtn')?.addEventListener('click', () => {
          delete pickState.pendingSides;
          applySideChoice(ctTeam, tTeam, step);
        });
      }
    }
  }

  runSideHop();
}

function applySideChoice(ctColor, tColor, step) {
  const map = pickState.pendingMap;
  const imageFileName = getMapImagePath(map.id).replace('map_picks/cs2/', '');

  const pickedRecord = {
    round: step.mapNumber,
    mapId: map.id,
    mapName: map.name,
    mapImage: imageFileName,
    ctTeam: ctColor,
    tTeam: tColor,
    pickedBy: step.team ? getTeamColor(step.team) : 'decider',
  };

  pickState.pickedMaps.push(pickedRecord);
  pickState.stepResults[pickState.currentStepIndex] = {
    mapId: map.id,
    mapName: map.name,
    mapImage: getMapImagePath(map.id),
    ctTeam: ctColor,
  };

  pickState.isSideSelecting = false;
  pickState.pendingMap = null;
  pickState.currentStepIndex++;

  // Pokud jsme dokončili všechny kroky
  if (pickState.currentStepIndex >= PICK_SEQUENCE.length) {
    pickState.isCompleted = true;
  }

  saveState();
  render();
}

// ---------------------------------------------------------------------
// KROK: Dokončeno (Souhrn a tlačítko na skóre)
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
    const ctCls = pm.ctTeam === 'blue' ? 'ct-blue' : 'ct-red';
    const ctName = pm.ctTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM';

    card.innerHTML = `
      <div class="summary-map-order">${pm.round}. MAPA</div>
      <div class="summary-map-image-box">
        <img src="${getMapImagePath(pm.mapId)}" alt="${pm.mapName}" class="summary-map-img" draggable="false">
      </div>
      <div class="summary-map-details">
        <div class="summary-map-name">${pm.mapName}</div>
        <div class="summary-map-side ${ctCls}">CT: ${ctName}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// =====================================================================
// INDIKÁTOR TÝMU NA ŘADĚ & DYNAMICKÉ POSTRANNÍ BARVY
// =====================================================================
function updateTopTurnDisplay() {
  const display = document.getElementById('topTurnDisplay');
  if (!display) return;

  // Odstraníme barevné třídy z body
  document.body.classList.remove('turn-active-blue', 'turn-active-red');

  if (pickState.isCompleted) {
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
    return;
  }

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  if (!currentStep || currentStep.type === 'rps' || currentStep.type === 'decider') {
    // V úvodním rozstřelu ani v decideru (kde probíhá náhodný výběr mapy i stran) kartu nahoře nezobrazujeme
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
    return;
  }

  // Zjistíme, kdo je právě na řadě
  let activeTeamCode = currentStep.team;
  if (pickState.isSideSelecting && currentStep.sideChooser) {
    activeTeamCode = currentStep.sideChooser;
  }

  const teamColor = getTeamColor(activeTeamCode);

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
// INICIALIZACE A TLAČÍTKA
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.LankaMusic) {
    window.LankaMusic.bindUI();
    window.LankaMusic.playGame('cs2');
  }

  loadState();
  render();

  // Reset picku
  document.getElementById('resetPickBtn')?.addEventListener('click', () => {
    if (confirm('Opravdu chcete resetovat celé pickování CS2 a začít znovu?')) {
      resetState();
      render();
    }
  });

  // Fullscreen
  document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  });
});
