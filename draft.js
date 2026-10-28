/**
 * LANKA TURNAJ 2027 — DRAFT TÝMŮ
 * 
 * Minimalistické zobrazení:
 * - Všechny karty jsou přesně stejně velké (fotka + přezdívka pod ní).
 * - Žádná průhlednost při přetahování.
 * - Žádné přebytečné popisky ani počítadla.
 * - Vlevo MODRÝ TÝM, vpravo ČERVENÝ TÝM.
 */

// ============================================================================
// 1. DATA: KAPITÁNI A HRÁČI (VŠECHNY KARTY MAJÍ STEJNOU STRUKTURU)
// ============================================================================
const CAPTAIN_BLUE = {
  id: 'captain-blue',
  name: 'KODA',
  realName: 'Brácha',
  photo: 'assets/images/players/koda.png',
  isCaptain: true
};

const CAPTAIN_RED = {
  id: 'captain-red',
  name: 'KINAJ',
  realName: 'Kinaj',
  photo: 'assets/images/players/kinaj.png',
  isCaptain: true
};

const DEFAULT_PLAYERS = [
  { id: 'player-1', name: 'GIRY', realName: 'Vojtěch Michal', photo: 'assets/images/players/Giry.jpg', team: 'pool' },
  { id: 'player-2', name: 'Winters', realName: 'Karel Kosík', photo: 'assets/images/players/Karel.jpg', team: 'pool' },
  { id: 'player-3', name: 'Pravdomil Kecal', realName: 'Dan Žáček', photo: 'assets/images/players/Pravdomil Kecal.jpg', team: 'pool' },
  { id: 'player-4', name: 'Vojcii', realName: 'Vojtěch Kos', photo: 'assets/images/players/Vojcii.jpg', team: 'pool' },
  { id: 'player-5', name: 'Kahanate', realName: 'David Kuba', photo: 'assets/images/players/David.jpg', team: 'pool' },
  { id: 'player-6', name: 'Balib', realName: 'Libor Barvík', photo: 'assets/images/players/Balib.jpg', team: 'pool' },
  { id: 'player-7', name: 'Chleba', realName: 'Jiří Hanzlík', photo: 'assets/images/players/Jirka.jpg', team: 'pool' },
  { id: 'player-8', name: 'Trebkiller', realName: 'Vladimír Hořký', photo: 'assets/images/players/Trebkiller.jpg', team: 'pool' }
];

let players = [];
let draggedPlayerId = null;
let lastDroppedPlayerId = null;

// ============================================================================
// 2. NAČTENÍ A ULOŽENÍ STAVU
// ============================================================================
function loadState() {
  const saved = localStorage.getItem('lanka_draft_state_v3');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_PLAYERS.length) {
        // Zachováme přiřazení do týmů, ale jména a fotky bereme vždy aktuální z DEFAULT_PLAYERS
        players = DEFAULT_PLAYERS.map(dp => {
          const found = parsed.find(p => p.id === dp.id);
          return {
            ...dp,
            team: found ? found.team : dp.team
          };
        });
        return;
      }
    } catch {
      players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    }
  }
  players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
}

function saveState() {
  localStorage.setItem('lanka_draft_state_v3', JSON.stringify(players));
}

// ============================================================================
// 3. GENEROVÁNÍ KARTY (VŠECHNY KARTY JSOU PŘESNĚ STEJNĚ VELKÉ)
// ============================================================================
function createCardElement(item) {
  const card = document.createElement('article');
  card.className = 'player-card';
  card.id = `card-${item.id}`;

  if (!item.isCaptain) {
    card.setAttribute('draggable', 'true');
    card.dataset.playerId = item.id;
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  }

  if (item.id === lastDroppedPlayerId) {
    card.classList.add('just-dropped');
  }

  const nameLen = (item.name || '').length;
  let nameClass = 'card-nickname';
  if (nameLen > 11) {
    nameClass += ' is-very-long-name';
  }

  card.innerHTML = `
    <div class="card-photo-wrapper">
      <img src="${item.photo}" alt="${item.name}" class="card-photo" draggable="false">
    </div>
    <div class="card-info">
      <div class="${nameClass}">${item.name}</div>
      ${item.realName ? `<div class="card-realname">${item.realName}</div>` : ''}
    </div>
  `;

  return card;
}

// ============================================================================
// 4. VYKRESLENÍ PLOCHY (ZIG-ZAG 3 POLE A 2 POLE V TÝMECH)
// ============================================================================
function renderDraft() {
  const poolGrid = document.getElementById('poolCardsGrid');
  poolGrid.innerHTML = '';

  const bluePlayers = players.filter(p => p.team === 'blue');
  const redPlayers = players.filter(p => p.team === 'red');
  const poolPlayers = players.filter(p => p.team === 'pool');

  // 1. Modrý tým:
  // Slot 1: Koda (vlevo nahoře v 3-polovém sloupci)
  const blueSlot1 = document.getElementById('blueSlot1');
  if (blueSlot1) {
    blueSlot1.innerHTML = '';
    blueSlot1.classList.remove('is-empty');
    blueSlot1.appendChild(createCardElement(CAPTAIN_BLUE));
  }
  // Sloty 2 až 5 pro draftované hráče Modrého týmu v zig-zag pořadí
  for (let i = 2; i <= 5; i++) {
    const slotEl = document.getElementById(`blueSlot${i}`);
    if (slotEl) {
      slotEl.innerHTML = '';
      const player = bluePlayers[i - 2];
      if (player) {
        slotEl.classList.remove('is-empty');
        slotEl.appendChild(createCardElement(player));
      } else {
        slotEl.classList.add('is-empty');
      }
    }
  }

  // 2. Červený tým:
  // Slot 1: Kinaj (vpravo nahoře v 3-polovém sloupci)
  const redSlot1 = document.getElementById('redSlot1');
  if (redSlot1) {
    redSlot1.innerHTML = '';
    redSlot1.classList.remove('is-empty');
    redSlot1.appendChild(createCardElement(CAPTAIN_RED));
  }
  // Sloty 2 až 5 pro draftované hráče Červeného týmu v zrcadlovém zig-zag pořadí
  for (let i = 2; i <= 5; i++) {
    const slotEl = document.getElementById(`redSlot${i}`);
    if (slotEl) {
      slotEl.innerHTML = '';
      const player = redPlayers[i - 2];
      if (player) {
        slotEl.classList.remove('is-empty');
        slotEl.appendChild(createCardElement(player));
      } else {
        slotEl.classList.add('is-empty');
      }
    }
  }

  // 3. Volní hráči uprostřed (3, 3, dole 2 vycentrované)
  poolPlayers.forEach(p => {
    poolGrid.appendChild(createCardElement(p));
  });

  saveState();
}

// ============================================================================
// 5. DRAG & DROP ENGINE (100% NEPRŮHLEDNÁ KARTA V RUCE)
// ============================================================================
function handleDragStart(e) {
  draggedPlayerId = this.dataset.playerId;
  e.dataTransfer.setData('text/plain', draggedPlayerId);
  e.dataTransfer.effectAllowed = 'move';

  const card = this;
  setTimeout(() => {
    card.classList.add('is-dragging-source');
  }, 0);
}

function handleDragEnd() {
  this.classList.remove('is-dragging-source');
  draggedPlayerId = null;

  document.getElementById('blueSection')?.classList.remove('drag-active-target');
  document.getElementById('redSection')?.classList.remove('drag-active-target');
  document.getElementById('greySection')?.classList.remove('drag-active-target');
}

// ============================================================================
// 6. ZÓNY PŘETAHOVÁNÍ (CELÁ LEVÁ / CELÁ PRAVÁ STRANA)
// ============================================================================
function setupDropZones() {
  const blueSection = document.getElementById('blueSection');
  const redSection = document.getElementById('redSection');
  const greySection = document.getElementById('greySection');

  const zones = [
    { el: blueSection, team: 'blue' },
    { el: redSection, team: 'red' },
    { el: greySection, team: 'pool' }
  ];

  zones.forEach(({ el, team }) => {
    if (!el) return;
    let dragCounter = 0;

    el.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      el.classList.add('drag-active-target');
    });

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!el.classList.contains('drag-active-target')) {
        el.classList.add('drag-active-target');
      }
    });

    el.addEventListener('dragleave', (e) => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        el.classList.remove('drag-active-target');
      }
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      el.classList.remove('drag-active-target');

      const playerId = e.dataTransfer.getData('text/plain') || draggedPlayerId;
      if (playerId) {
        executeDrop(playerId, team, el);
      }
    });
  });
}

// ============================================================================
// 7. PŘESUN HRÁČE
// ============================================================================
function executeDrop(playerId, targetTeam, sectionElement) {
  const player = players.find(p => p.id === playerId);
  if (!player) return;
  if (player.team === targetTeam) return;

  // Kontrola kapacity (1 kapitán + 4 hráči = 5)
  if (targetTeam === 'blue') {
    const blueCount = players.filter(p => p.team === 'blue').length;
    if (blueCount >= 4) return;
  } else if (targetTeam === 'red') {
    const redCount = players.filter(p => p.team === 'red').length;
    if (redCount >= 4) return;
  }

  lastDroppedPlayerId = player.id;
  player.team = targetTeam;


  renderDraft();
}

// ============================================================================
// 8. OVLÁDACÍ TLAČÍTKA: RESET & FULLSCREEN
// ============================================================================
document.getElementById('resetDraftBtn')?.addEventListener('click', () => {
  players.forEach(p => {
    p.team = 'pool';
  });
  lastDroppedPlayerId = null;
  renderDraft();
});

document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => { });
  } else {
    document.exitFullscreen().catch(() => { });
  }
});

// ============================================================================
// INICIALIZACE
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderDraft();
  setupDropZones();
});
