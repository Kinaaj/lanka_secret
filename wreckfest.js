// =====================================================================
// WRECKFEST MAP & TRACK PICKING ENGINE (Bo5)
// Pořadí: ZÁVOD -> ZÁVOD -> DERBY -> DERBY -> ZÁVOD (50/50 Random)
// =====================================================================

const CAPTAIN_BLUE = {
  id: 'captain-blue',
  name: 'KODA',
  realName: 'Brácha',
  photo: 'assets/images/players/koda.png',
  isCaptain: true,
};

const CAPTAIN_RED = {
  id: 'captain-red',
  name: 'KINAJ',
  realName: 'Kinaj',
  photo: 'assets/images/players/kinaj.png',
  isCaptain: true,
};

// Sekvence kroků Bo5
const PICK_SEQUENCE = [
  { id: 'step-0', type: 'rps' },
  { id: 'step-1', type: 'pick', mode: 'race', team: 'A', mapNumber: 1, label: '1. ZÁVOD' },
  { id: 'step-2', type: 'pick', mode: 'race', team: 'B', mapNumber: 2, label: '2. ZÁVOD' },
  { id: 'step-3', type: 'pick', mode: 'derby', team: 'A', mapNumber: 3, label: '1. DERBY' },
  { id: 'step-4', type: 'pick', mode: 'derby', team: 'B', mapNumber: 4, label: '2. DERBY' },
  { id: 'step-5', type: 'decider', mode: 'race', mapNumber: 5, label: '3. ZÁVOD' },
];

let pickState = {
  currentStepIndex: 0,
  teamA: null,          // 'blue' | 'red'
  teamB: null,          // 'blue' | 'red'
  pickedItems: [],      // vybrané tratě/arény { stepIndex, mapId, mapName, trackId, trackName, isReverse, mapImage, trackImage, mode, length, size, surface, carClass }
  pendingDecider: null, // vylosovaný decider čekající na potvrzení
  isCarSelecting: false, // probíhá volba třídy aut pro právě vybranou trať
  pendingItem: null,    // { step, map, track, isRev } čekající na potvrzení auta
  stepResults: {},      // mapováno indexem kroku
  isCompleted: false,
};

const STORAGE_KEY = 'lanka_pick_wreckfest';
const SCORE_STORAGE_KEY = 'lanka_pick_wreckfest';

// Stav přepínačů "Reverse" pro jednotlivé tratě na obrazovce
const reverseState = {};

// ---------------------------------------------------------------------
// POMOCNÉ FUNKCE PRO ZÍSKÁNÍ TRATÍ A PÁROVÁNÍ REVERSE
// ---------------------------------------------------------------------
function findReverseTrack(allTracks, baseTrack) {
  const baseName = baseTrack.name.toLowerCase().trim();
  return allTracks.find(t => {
    const n = t.name.toLowerCase().trim();
    return n.includes('reverse') && (
      n.replace('reverse', '').trim() === baseName ||
      n === baseName + ' reverse' ||
      baseName.startsWith(n.replace('reverse', '').trim())
    );
  }) || null;
}

// ---------------------------------------------------------------------
// SYNCHRONIZACE SE SCORE.HTML
// ---------------------------------------------------------------------
function getScoreData() {
  if (!pickState.pickedItems || pickState.pickedItems.length === 0) return null;

  return {
    game: 'wreckfest',
    teamA: pickState.teamA,
    teamB: pickState.teamB,
    rounds: pickState.pickedItems.map((item, idx) => {
      const revTag = item.isReverse ? ' [REV]' : '';
      const carTag = item.carClass ? ` • ${item.carClass}` : '';
      return {
        round: idx + 1,
        mapId: item.mapId,
        mapName: item.mapName,
        mapImage: item.mapImage, // Čistý obrázek mapy, nikoliv layout tratě/arény
        trackId: item.trackId,
        trackName: item.trackName + revTag,
        metaTop: item.mapName,
        metaBottom: `${item.trackName}${revTag}${carTag}`,
        carClass: item.carClass || '',
        mode: item.mode,
      };
    }),
  };
}

function getScoreUrl() {
  const data = getScoreData();
  if (!data) return 'score.html?reset_wreckfest=1';
  return `score.html?pick_wreckfest=${encodeURIComponent(JSON.stringify(data))}`;
}

function updateScoreLinks() {
  const scoreUrl = getScoreUrl();
  const topScoreBtn = document.getElementById('headerScoreBtn');
  if (topScoreBtn) topScoreBtn.href = scoreUrl;
  const summaryBtn = document.getElementById('summaryGoScoreBtn');
  if (summaryBtn) summaryBtn.href = scoreUrl;
}

// ---------------------------------------------------------------------
// UKLÁDÁNÍ A NAČÍTÁNÍ STAVU
// ---------------------------------------------------------------------
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pickState));
    const scoreData = getScoreData();
    if (scoreData) {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scoreData));
    } else {
      localStorage.removeItem(SCORE_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Chyba při ukládání stavu:', e);
  }
  updateScoreLinks();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.currentStepIndex === 'number') {
        pickState = Object.assign(pickState, parsed);
        return true;
      }
    }
  } catch (e) {
    console.error('Chyba při načítání stavu:', e);
  }
  return false;
}

function resetPick() {
  if (confirm('Opravdu chceš resetovat celý pick Wreckfestu?')) {
    localStorage.removeItem(STORAGE_KEY);
    pickState = {
      currentStepIndex: 0,
      teamA: null,
      teamB: null,
      pickedItems: [],
      pendingDecider: null,
      isCarSelecting: false,
      pendingItem: null,
      stepResults: {},
      isCompleted: false,
    };
    render();
  }
}

// ---------------------------------------------------------------------
// KONTROLA ZDA JE TRAŤ/ARÉNA JIŽ VYBRANÁ
// ---------------------------------------------------------------------
function isItemPicked(trackId) {
  return pickState.pickedItems.some(item => item.trackId === trackId);
}

// ---------------------------------------------------------------------
// TIMELINE (OSNOVA VLEVO)
// ---------------------------------------------------------------------
function renderTimeline() {
  const container = document.getElementById('timelineContainer');
  if (!container) return;

  const isTeamsChosen = Boolean(pickState.teamA && pickState.teamB);
  container.className = isTeamsChosen ? 'timeline-container teams-chosen' : 'timeline-container';

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  const isAllDone = pickState.isCompleted;

  let html = '';

  PICK_SEQUENCE.forEach((step, idx) => {
    const isPast = idx < pickState.currentStepIndex || isAllDone;
    const isActive = idx === pickState.currentStepIndex && !isAllDone;

    // Šipka mezi řádky
    if (idx > 0) {
      html += `
        <div class="timeline-arrow-row ${isPast ? 'is-passed' : ''} ${isActive ? 'is-next-active' : ''}">
          <div class="timeline-row-team-spacer"></div>
          <div class="timeline-arrow-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4v14"/>
              <path d="m18 13-6 6-6-6"/>
            </svg>
          </div>
        </div>
      `;
    }

    // Krok 0: Kámen Nůžky Papír
    if (step.type === 'rps') {
      html += `
        <div class="timeline-row ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" id="timelineRow-${idx}">
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
        </div>
      `;
      return;
    }

    // Picky (Krok 1 - 5)
    const isDecider = step.type === 'decider';
    const teamRole = step.team;
    const teamColor = teamRole === 'A' ? pickState.teamA : (teamRole === 'B' ? pickState.teamB : null);
    
    let teamLabel = isDecider ? 'RANDOM' : ('TÝM ' + (teamRole || ''));
    let teamColorCls = 'team-neutral';
    let frameColorCls = 'frame-neutral';

    if (teamColor === 'blue') {
      teamLabel = 'MODRÝ';
      teamColorCls = 'team-blue';
      frameColorCls = 'frame-blue';
    } else if (teamColor === 'red') {
      teamLabel = 'ČERVENÝ';
      teamColorCls = 'team-red';
      frameColorCls = 'frame-red';
    }

    const frameTeamLabel = isDecider ? 'RANDOM' : teamLabel;
    const frameTeamCls = isDecider ? 'team-neutral' : teamColorCls;

    const mapOrderText = `${step.mapNumber}. MAPA`;
    const modeBadge = step.mode === 'derby' ? 'DEMOLICE' : 'ZÁVOD';

    let currentItem = pickState.stepResults[idx];
    if (!currentItem && isDecider && pickState.pendingDecider) {
      currentItem = pickState.pendingDecider;
    }
    if (!currentItem && isActive && pickState.isCarSelecting && pickState.pendingItem) {
      currentItem = pickState.pendingItem;
    }

    let frameInnerHtml = '';
    if (currentItem) {
      const revTag = currentItem.isReverse ? ' [REV]' : '';
      const isSelectingCarThis = isActive && pickState.isCarSelecting && !currentItem.carClass;
      frameInnerHtml = `
        <div class="wf-timeline-picked-frame">
          <img src="${currentItem.mapImage}" alt="" class="wf-timeline-bg-map" onerror="this.src='assets/images/wreckfest_icon.webp'">
          <img src="${currentItem.trackImage}" alt="" class="wf-timeline-layout-mini">
          <div class="wf-timeline-frame-tag" title="${currentItem.mapName} - ${currentItem.trackName}${revTag}">
            <div class="wf-timeline-tag-title">${currentItem.mapName} - ${currentItem.trackName}${revTag}</div>
            ${currentItem.carClass ? `<div class="wf-timeline-car-tag">${currentItem.carClass}</div>` : (isSelectingCarThis ? '<div class="wf-timeline-car-tag is-pending">VÝBĚR AUTA...</div>' : '')}
          </div>
        </div>
      `;
    } else {
      frameInnerHtml = `
        <div class="frame-prepick-content">
          <div class="frame-order-title">${modeBadge}</div>
          ${isActive ? `<div class="frame-active-status">${isDecider ? 'LOSOVÁNÍ' : 'VÝBĚR'}</div>` : ''}
        </div>
      `;
    }

    html += `
      <div class="timeline-row ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" id="timelineRow-${idx}">
        <div class="timeline-row-team">
          <span class="team-mini-label ${frameTeamCls} ${isActive ? 'is-active-team' : ''}">${frameTeamLabel}</span>
        </div>
        <div class="timeline-row-action">
          <div class="timeline-map-frame ${frameColorCls} ${isActive ? 'is-active' : ''} ${currentItem ? 'has-map is-completed' : ''}">
            ${frameInnerHtml}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ---------------------------------------------------------------------
// PRACOVNÍ PLOCHA (WORKSPACE VPRAVO)
// ---------------------------------------------------------------------
function renderWorkspace() {
  const container = document.getElementById('workspaceCol');
  if (!container) return;

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];

  // 1. DOKONČENO -> FINÁLNÍ SOUHRN BO5
  if (pickState.isCompleted) {
    renderSummary(container);
    return;
  }

  // 2. KROK 0: KÁMEN NŮŽKY PAPÍR
  if (currentStep.type === 'rps') {
    renderRPSChoice(container);
    return;
  }

  // 3. VÝBĚR TŘÍDY AUTA PRO PRÁVĚ VYBRANOU TRAŤ / ARÉNU (KROKY 1 - 4)
  if (pickState.isCarSelecting && pickState.pendingItem && currentStep.type !== 'decider') {
    renderCarSelection(container, currentStep);
    return;
  }

  // 4. KROK 5: 50/50 RANDOM DECIDER
  if (currentStep.type === 'decider') {
    renderDecider(container, currentStep);
    return;
  }

  // 5. KROK 1 - 4: VÝBĚR ZÁVODU NEBO DERBY
  renderPickGrid(container, currentStep);
}

// ---------------------------------------------------------------------
// KROK 0: VÝBĚR VÍTĚZE ROZSTŘELU (STEJNÝ STYL JAKO CS2)
// ---------------------------------------------------------------------
function renderRPSChoice(container) {
  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">KDO VYHRÁL KÁMEN-NŮŽKY-PAPÍR?</h2>
      <p class="workspace-subtitle">Tým, který vyhrál rozstřel, začne jako Tým A a má první výběr</p>
    </div>

    <div class="rps-cards-wrapper">
      <div class="rps-team-card rps-card-blue" id="rpsSelectBlue" role="button" tabindex="0">
        <div class="rps-card-title">MODRÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">ZAČÍNÁ</div>
      </div>

      <div class="rps-team-card rps-card-red" id="rpsSelectRed" role="button" tabindex="0">
        <div class="rps-card-title">ČERVENÝ<br>TÝM</div>
        <div class="rps-card-btn-hint">ZAČÍNÁ</div>
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
// VÝBĚR MAPY / TRATĚ V MŘÍŽCE PODLE KATEGORIÍ
// ---------------------------------------------------------------------
function renderPickGrid(container, step) {
  const isDerby = step.mode === 'derby';
  const modeTitle = isDerby ? 'DERBY (DEMOLICE)' : 'ZÁVOD (TRATĚ)';
  const teamColor = step.team === 'A' ? pickState.teamA : pickState.teamB;
  const teamName = teamColor === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM';
  const hoverTeamCls = teamColor === 'blue' ? 'hover-blue' : 'hover-red';

  let html = `
    <div class="workspace-header">
      <div class="workspace-step-tag">${step.mapNumber}. MAPA — ${modeTitle}</div>
      <h2 class="workspace-title">${modeTitle}</h2>
    </div>
    <div class="wf-workspace-content">
  `;

  WRECKFEST_MAP_CATEGORIES.forEach(category => {
    const mapsInCategory = getWreckfestMapsByCategory(category);
    // Filtrovat mapy které mají pro daný mód aspoň 1 položku
    const relevantMaps = mapsInCategory.filter(m => isDerby ? (m.arenas && m.arenas.length > 0) : (m.tracks && m.tracks.length > 0));

    if (relevantMaps.length === 0) return;

    html += `
      <div class="wf-category-block">
        <div class="wf-category-title">${category}</div>
        <div class="wf-map-rows-group">
    `;

    relevantMaps.forEach(map => {
      html += `
        <div class="wf-map-row">
          <div class="wf-map-poster">
            <img src="${map.image}" alt="${map.name}" loading="lazy" onerror="this.src='assets/images/wreckfest_icon.webp'">
            <div class="wf-map-poster-name">${map.name}</div>
          </div>
          <div class="wf-tracks-tracklist">
      `;

      if (isDerby) {
        // Areny
        map.arenas.forEach(arena => {
          const picked = isItemPicked(arena.id);
          html += `
            <div class="wf-track-card ${hoverTeamCls} ${picked ? 'is-picked' : ''}" 
                 data-type="arena" 
                 data-map-id="${map.id}" 
                 data-arena-id="${arena.id}">
              <img src="${arena.image}" alt="" class="wf-track-layout-img">
              <div class="wf-track-overlay-grad"></div>
              <div class="wf-track-info">
                <div class="wf-track-name" title="${arena.name}">${arena.name}</div>
                <div class="wf-track-meta">
                  <span>${arena.size || ''}</span>
                  ${arena.size && arena.surface ? '•' : ''}
                  <span>${arena.surface || ''}</span>
                </div>
              </div>
            </div>
          `;
        });
      } else {
        // Tratě (s tlačítkem Reverse)
        // Shromáždíme unikátní base tratě (bez 'reverse' v názvu)
        const baseTracks = map.tracks.filter(t => !t.name.toLowerCase().includes('reverse'));
        
        baseTracks.forEach(baseTrack => {
          const revTrack = findReverseTrack(map.tracks, baseTrack);
          const hasReverse = !!revTrack;
          const isRevActive = !!reverseState[baseTrack.id];

          const activeTrack = (isRevActive && revTrack) ? revTrack : baseTrack;
          const picked = isItemPicked(activeTrack.id);

          html += `
            <div class="wf-track-card ${hoverTeamCls} ${picked ? 'is-picked' : ''}" 
                 data-type="track" 
                 data-map-id="${map.id}" 
                 data-base-track-id="${baseTrack.id}"
                 data-active-track-id="${activeTrack.id}">
              
              ${hasReverse ? `
                <button type="button" class="wf-reverse-toggle-btn ${isRevActive ? 'is-active' : ''}" 
                        title="${isRevActive ? 'Přepnout na normální směr' : 'Přepnout na REVERSE'}"
                        data-reverse-toggle="${baseTrack.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                </button>
              ` : ''}

              <img src="${activeTrack.image}" alt="" class="wf-track-layout-img">
              <div class="wf-track-overlay-grad"></div>
              <div class="wf-track-info">
                <div class="wf-track-name" title="${activeTrack.name}">
                  ${baseTrack.name}${isRevActive ? ' <span style="color:#f59e0b;font-size:0.7rem;">[REV]</span>' : ''}
                </div>
                <div class="wf-track-meta">
                  <span>${activeTrack.length || ''}</span>
                  ${activeTrack.length && activeTrack.surface ? '•' : ''}
                  <span>${activeTrack.surface || ''}</span>
                </div>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  // Event listenery pro tlačítka Reverse
  container.querySelectorAll('[data-reverse-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const baseId = btn.getAttribute('data-reverse-toggle');
      reverseState[baseId] = !reverseState[baseId];
      renderWorkspace();
    });
  });

  // Event listenery pro výběr trati / arény
  container.querySelectorAll('.wf-track-card:not(.is-picked)').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-type');
      const mapId = card.getAttribute('data-map-id');
      const map = getWreckfestMapById(mapId);
      if (!map) return;

      let pickedTrack = null;
      let isRev = false;

      if (type === 'arena') {
        const arenaId = card.getAttribute('data-arena-id');
        pickedTrack = map.arenas.find(a => a.id === arenaId);
      } else {
        const activeTrackId = card.getAttribute('data-active-track-id');
        pickedTrack = map.tracks.find(t => t.id === activeTrackId);
        isRev = pickedTrack && pickedTrack.name.toLowerCase().includes('reverse');
      }

      if (!pickedTrack) return;

      startCarSelection(step, map, pickedTrack, isRev);
    });
  });
}

// ---------------------------------------------------------------------
// KROK: VÝBĚR TŘÍDY AUTA PRO VYBRANOU TRAŤ / ARÉNU
// ---------------------------------------------------------------------
function startCarSelection(step, map, trackOrArena, isReverse) {
  pickState.pendingItem = {
    stepIndex: pickState.currentStepIndex,
    mapNumber: step.mapNumber,
    mode: step.mode,
    team: step.team,
    mapId: map.id,
    mapName: map.name,
    mapImage: map.image,
    trackId: trackOrArena.id,
    trackName: trackOrArena.name,
    trackImage: trackOrArena.image,
    isReverse: isReverse,
    length: trackOrArena.length || trackOrArena.size || '',
    surface: trackOrArena.surface || '',
  };
  pickState.isCarSelecting = true;
  saveState();
  render();
}

function cancelCarSelection() {
  pickState.pendingItem = null;
  pickState.isCarSelecting = false;
  saveState();
  render();
}

function confirmCarChoice(carClass) {
  if (!pickState.pendingItem) return;

  const item = {
    ...pickState.pendingItem,
    carClass: carClass, // 'Max A' | 'Max B' | 'Max C' | 'Konkrétní auto'
  };

  pickState.pickedItems.push(item);
  pickState.stepResults[pickState.currentStepIndex] = item;
  pickState.pendingItem = null;
  pickState.isCarSelecting = false;
  pickState.currentStepIndex++;

  if (pickState.currentStepIndex >= PICK_SEQUENCE.length) {
    pickState.isCompleted = true;
  }

  saveState();
  render();
}

function renderCarSelection(container, step) {
  const item = pickState.pendingItem;
  if (!item) return;

  const isDecider = step.type === 'decider';
  const teamRole = step.team;
  const teamColor = teamRole === 'A' ? pickState.teamA : (teamRole === 'B' ? pickState.teamB : null);

  let teamName = isDecider ? 'ROZHODUJÍCÍ KOLO (RANDOM)' : 'VÝBĚR TÝMU';
  let teamClass = 'team-neutral';
  if (teamColor === 'blue') {
    teamName = 'MODRÝ TÝM';
    teamClass = 'team-blue';
  } else if (teamColor === 'red') {
    teamName = 'ČERVENÝ TÝM';
    teamClass = 'team-red';
  }

  const modeBadge = item.mode === 'derby' ? 'DEMOLICE' : 'ZÁVOD';
  const revTag = item.isReverse ? ' [REV]' : '';

  container.innerHTML = `
    <div class="wf-car-selection-wrapper">
      <div class="workspace-header" style="margin-bottom: 1.25rem;">
        <div class="workspace-step-tag ${teamClass}">
          ${step.mapNumber}. KOLO — ${teamName}
        </div>
        <h2 class="workspace-title">VÝBĚR POVOLENÝCH AUT</h2>
        <p class="workspace-subtitle">
          Zvol povolenou třídu vozidel pro tuto ${item.mode === 'derby' ? 'arénu' : 'trať'}, nebo zvolte konkrétní auto v lobby hry.
        </p>
      </div>

      <!-- Náhled vybrané tratě/arény -->
      <div class="wf-car-preview-row">
        <div class="wf-car-preview-card">
          <img src="${item.mapImage}" alt="" class="wf-car-prev-bg" onerror="this.src='assets/images/wreckfest_icon.webp'">
          <img src="${item.trackImage}" alt="" class="wf-car-prev-layout">
          <div class="wf-car-prev-overlay"></div>
          <div class="wf-car-prev-content">
            <div class="wf-car-prev-tag">${step.mapNumber}. KOLO • ${modeBadge}</div>
            <div class="wf-car-prev-name">${item.mapName} — ${item.trackName}${revTag}</div>
            <div class="wf-car-prev-meta">
              <span>${item.length || ''}</span>
              ${item.length && item.surface ? '•' : ''}
              <span>${item.surface || ''}</span>
            </div>
          </div>
        </div>

        <button type="button" class="wf-car-back-btn" id="wfCarBackBtn" title="Zvolit jinou trať nebo arénu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>ZMĚNIT TRAŤ</span>
        </button>
      </div>

      <!-- 4 karty výběru aut -->
      <div class="wf-car-cards-grid">
        <!-- MAX A -->
        <div class="wf-car-card card-max-a" data-car="Max A" role="button" tabindex="0">
          <div class="wf-car-badge">A</div>
          <div class="wf-car-title">MAX A</div>
          <div class="wf-car-sub">Třída A</div>
          <div class="wf-car-desc">Nejrychlejší speciály, plný tuning motoru a maximální rychlost bez omezení.</div>
          <div class="wf-car-pill">BEZ LIMITU</div>
        </div>

        <!-- MAX B -->
        <div class="wf-car-card card-max-b" data-car="Max B" role="button" tabindex="0">
          <div class="wf-car-badge">B</div>
          <div class="wf-car-title">MAX B</div>
          <div class="wf-car-sub">Třída B</div>
          <div class="wf-car-desc">Závodní střední třída, vyvážený poměr akcelerace a ovladatelnosti vozu.</div>
          <div class="wf-car-pill">INDEX DO B</div>
        </div>

        <!-- MAX C -->
        <div class="wf-car-card card-max-c" data-car="Max C" role="button" tabindex="0">
          <div class="wf-car-badge">C</div>
          <div class="wf-car-title">MAX C</div>
          <div class="wf-car-sub">Třída C</div>
          <div class="wf-car-desc">Pomalé vraky a plechovky, ideální pro tvrdé a nejtěsnější kontaktní souboje.</div>
          <div class="wf-car-pill">INDEX DO C</div>
        </div>

        <!-- KONKRÉTNÍ AUTO -->
        <div class="wf-car-card card-custom" data-car="Konkrétní auto" role="button" tabindex="0">
          <div class="wf-car-badge wf-badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="wf-car-title">KONKRÉTNÍ AUTO</div>
          <div class="wf-car-sub">Volba v lobby</div>
          <div class="wf-car-desc">Tým zvolí jeden konkrétní model přímo v lobby hry. Všichni jedou stejné auto.</div>
          <div class="wf-car-pill">VOLBA V LOBBY</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('wfCarBackBtn')?.addEventListener('click', () => {
    cancelCarSelection();
  });

  container.querySelectorAll('.wf-car-card').forEach(card => {
    card.addEventListener('click', () => {
      const car = card.getAttribute('data-car');
      card.classList.add('is-selecting');
      setTimeout(() => {
        confirmCarChoice(car);
      }, 140);
    });
  });
}

// ---------------------------------------------------------------------
// KROK 5: 50/50 RANDOM DECIDER PRO 3. ZÁVOD (LOSOVÁNÍ TRATĚ I TŘÍDY AUTA)
// ---------------------------------------------------------------------
const DECIDER_CAR_OPTIONS = [
  { id: 'Max A', label: 'MAX A', badgeCls: 'badge-a' },
  { id: 'Max B', label: 'MAX B', badgeCls: 'badge-b' },
  { id: 'Max C', label: 'MAX C', badgeCls: 'badge-c' },
  { id: 'Konkrétní auto', label: 'KONKRÉTNÍ AUTO', badgeCls: 'badge-custom' },
];

function renderDecider(container, step) {
  // Shromáždit všechny zbývající nezvolené závodní tratě
  const allTracks = getAllWreckfestTracks().filter(t => !isItemPicked(t.id));

  container.innerHTML = `
    <div class="workspace-header">
      <div class="workspace-step-tag">ROZHODUJÍCÍ 5. KOLO</div>
      <h2 class="workspace-title">3. ZÁVOD — NÁHODNÝ LOS (RANDOM)</h2>
      <p class="workspace-subtitle">Náhodný výběr tratě i povolené třídy aut ze všech zbývajících možností Wreckfestu.</p>
    </div>

    <div class="wf-roulette-container">
      <div class="wf-roulette-display" id="rouletteDisplay">
        <div style="font-family:'Chakra Petch',sans-serif; color:#94a3b8; font-size:1.1rem; font-weight:700;">
          PŘIPRAVENO K LOSOVÁNÍ
        </div>
      </div>

      <div class="wf-roulette-car-box" id="rouletteCarBox">
        <span class="wf-roulette-car-label" id="rouletteCarLabel">POVOLENÁ AUTA:</span>
        <span class="wf-roulette-car-badge" id="rouletteCarBadge">ČEKÁ NA LOS</span>
      </div>

      <button class="hud-action-btn" id="startRouletteBtn" style="padding: 14px 32px; font-size: 1.05rem; font-weight: 800; border-color: #ffffff;">
        SPUSTIT NÁHODNÝ LOS
      </button>
    </div>
  `;

  document.getElementById('startRouletteBtn')?.addEventListener('click', () => {
    runRoulette(allTracks, step);
  });
}

function runRoulette(availableTracks, step) {
  const display = document.getElementById('rouletteDisplay');
  const carBox = document.getElementById('rouletteCarBox');
  const carLabel = document.getElementById('rouletteCarLabel');
  const carBadge = document.getElementById('rouletteCarBadge');
  const btn = document.getElementById('startRouletteBtn');
  if (btn) btn.style.display = 'none';

  if (!availableTracks || availableTracks.length === 0) {
    alert('Není dostupná žádná další volná trať!');
    return;
  }

  // --- FÁZE 1: LOSOVÁNÍ TRATĚ ---
  let trackCounter = 0;
  const totalTrackTicks = 24;
  let trackSpeed = 60;

  if (carLabel) carLabel.textContent = 'POVOLENÁ AUTA:';
  if (carBadge) {
    carBadge.className = 'wf-roulette-car-badge';
    carBadge.textContent = 'LOSOVÁNÍ TRATĚ...';
  }

  function tickTrack() {
    trackCounter++;
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    const map = getWreckfestMapById(randomTrack.mapId);

    display.innerHTML = `
      <img src="${map ? map.image : ''}" alt="" class="wf-roulette-img">
      <img src="${randomTrack.image}" alt="" class="wf-roulette-layout">
      <div class="wf-roulette-info">${randomTrack.mapName} — ${randomTrack.name}</div>
    `;

    if (trackCounter < totalTrackTicks) {
      if (trackCounter > 15) trackSpeed += 22;
      setTimeout(tickTrack, trackSpeed);
    } else {
      // Trať je vylosována!
      const finalTrack = randomTrack;
      const finalMap = map;
      const isRev = finalTrack.name.toLowerCase().includes('reverse');
      const revTag = isRev ? ' [REV]' : '';

      display.innerHTML = `
        <img src="${finalMap ? finalMap.image : ''}" alt="" class="wf-roulette-img">
        <img src="${finalTrack.image}" alt="" class="wf-roulette-layout">
        <div class="wf-roulette-info">${finalTrack.mapName} — ${finalTrack.name}${revTag}</div>
      `;

      // Po krátké pauze spustíme FÁZI 2: LOSOVÁNÍ TŘÍDY AUTA
      setTimeout(() => {
        runCarRoulette(finalMap, finalTrack, isRev, step);
      }, 400);
    }
  }

  tickTrack();
}

function runCarRoulette(finalMap, finalTrack, isRev, step) {
  const carBox = document.getElementById('rouletteCarBox');
  const carLabel = document.getElementById('rouletteCarLabel');
  const carBadge = document.getElementById('rouletteCarBadge');

  if (carBox) carBox.className = 'wf-roulette-car-box is-rolling';
  if (carLabel) carLabel.textContent = 'LOSOVÁNÍ AUTA:';

  let carCounter = 0;
  const totalCarTicks = 18;
  let carSpeed = 60;

  function tickCar() {
    carCounter++;
    const opt = DECIDER_CAR_OPTIONS[Math.floor(Math.random() * DECIDER_CAR_OPTIONS.length)];

    if (carBadge) {
      carBadge.className = `wf-roulette-car-badge ${opt.badgeCls}`;
      carBadge.textContent = opt.label;
    }

    if (carCounter < totalCarTicks) {
      if (carCounter > 10) carSpeed += 30;
      setTimeout(tickCar, carSpeed);
    } else {
      // Finální vylosovaná třída auta
      const winningOption = opt;

      if (carBox) carBox.className = 'wf-roulette-car-box is-locked';
      if (carLabel) carLabel.textContent = 'VYLOSOVANÁ TŘÍDA:';
      if (carBadge) {
        carBadge.className = `wf-roulette-car-badge ${winningOption.badgeCls}`;
        carBadge.textContent = winningOption.label;
      }

      // Dokončení picku a uložení
      setTimeout(() => {
        const item = {
          stepIndex: pickState.currentStepIndex,
          mapNumber: step.mapNumber,
          mode: step.mode,
          team: null,
          mapId: finalMap.id,
          mapName: finalMap.name,
          mapImage: finalMap.image,
          trackId: finalTrack.id,
          trackName: finalTrack.name,
          trackImage: finalTrack.image,
          isReverse: isRev,
          length: finalTrack.length || finalTrack.size || '',
          surface: finalTrack.surface || '',
          carClass: winningOption.id,
        };

        pickState.pickedItems.push(item);
        pickState.stepResults[pickState.currentStepIndex] = item;
        pickState.pendingItem = null;
        pickState.isCarSelecting = false;
        pickState.currentStepIndex++;
        pickState.isCompleted = true;

        saveState();
        render();
      }, 1200);
    }
  }

  tickCar();
}

// ---------------------------------------------------------------------
// FINÁLNÍ SOUHRN (VŠECH 5 MAP NEUTRÁLNĚ)
// ---------------------------------------------------------------------
function renderSummary(container) {
  let cardsHtml = '';

  pickState.pickedItems.forEach((item, i) => {
    const orderText = `${i + 1}. HRA`;
    const modeText = item.mode === 'derby' ? 'DEMOLICE' : 'ZÁVOD';
    const revTag = item.isReverse ? ' [REV]' : '';

    cardsHtml += `
      <div class="wf-summary-card">
        <div class="wf-summary-visual">
          <img src="${item.mapImage}" alt="${item.mapName}" class="wf-summary-bg-img">
          <img src="${item.trackImage}" alt="${item.trackName}" class="wf-summary-layout-img">
          <div class="wf-summary-order-badge">${orderText}</div>
        </div>
        <div class="wf-summary-details">
          <div class="wf-summary-map-name">${item.mapName}</div>
          <div class="wf-summary-track-name">${item.trackName}${revTag}</div>
          <div class="wf-summary-tags-row">
            <div class="wf-summary-mode-tag">${modeText}</div>
            <div class="wf-summary-car-tag">${item.carClass || 'Max A'}</div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="workspace-header">
      <div class="workspace-step-tag">VÝBĚR DOKONČEN</div>
      <h2 class="workspace-title">POŘADÍ TRATÍ A ARÉN (BO5)</h2>
      <p class="workspace-subtitle">Kompletní sled kol pro Wreckfest v turnaji Lanka 2027.</p>
    </div>
    <div class="wf-summary-grid">
      ${cardsHtml}
    </div>
    <div style="display: flex; justify-content: center; margin-top: 2rem;">
      <a href="${getScoreUrl()}" class="hud-action-btn" id="summaryGoScoreBtn" style="padding: 14px 36px; font-size: 1.05rem; font-weight: 800; border-color: #ffffff; text-decoration: none;">
        <span>PŘEJÍT NA SKÓRE</span>
      </a>
    </div>
  `;
}

// ---------------------------------------------------------------------
// TOP HEADER INDIKÁTOR
// ---------------------------------------------------------------------
function renderTopHeader() {
  // Indikátor byl na žádost uživatele odstraněn, HUD tlačítka zůstávají
  return;
}

// ---------------------------------------------------------------------
// HLAVNÍ RENDER & INICIALIZACE
// ---------------------------------------------------------------------
function render() {
  renderTopHeader();
  renderTimeline();
  renderWorkspace();
  updateScoreLinks();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.LankaMusic) {
    window.LankaMusic.bindUI();
    window.LankaMusic.playGame('wreckfest');
  }

  loadState();

  document.getElementById('resetPickBtn')?.addEventListener('click', resetPick);

  document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  render();
});

