(function(window) {
  'use strict';
  window.LankaPickModules = window.LankaPickModules || {};

// =====================================================================
// LEAGUE OF LEGENDS — PICKOVÁNÍ STRAN A ROZHOZENÍ ROLÍ
// =====================================================================

const LOL_MAP_PATH = 'map_picks/lol/summoners_rift.jpg';

// ---------------------------------------------------------------------
// HRÁČI A KAPITÁNI (PROPOJENO S DRAFTEM)
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// OFICIÁLNÍ SOUPISKY TÝMŮ PRO LEAGUE OF LEGENDS:
// ČERVENÝ TÝM: Kinaj, Balib, Pravdomil, Kahanate, Trebkiller
// MODRÝ TÝM:   Koda, Giry, Winters, Vojcii, Chleba
// ---------------------------------------------------------------------
const DEFAULT_PLAYERS = [
  { id: 'player-1', name: 'GIRY', realName: 'Vojtěch Michal', photo: 'assets/images/players/Giry.jpg', team: 'blue' },
  { id: 'player-2', name: 'Winters', realName: 'Karel Kosík', photo: 'assets/images/players/Karel.jpg', team: 'blue' },
  { id: 'player-4', name: 'Vojcii', realName: 'Vojtěch Kos', photo: 'assets/images/players/Vojcii.jpg', team: 'blue' },
  { id: 'player-7', name: 'Chleba', realName: 'Jiří Hanzlík', photo: 'assets/images/players/Jirka.jpg', team: 'blue' },
  { id: 'player-6', name: 'Balib', realName: 'Libor Barvík', photo: 'assets/images/players/Balib.jpg', team: 'red' },
  { id: 'player-3', name: 'Pravdomil', realName: 'Dan Žáček', photo: 'assets/images/players/Pravdomil Kecal.jpg', team: 'red' },
  { id: 'player-5', name: 'Kahanate', realName: 'David Kuba', photo: 'assets/images/players/David.jpg', team: 'red' },
  { id: 'player-8', name: 'Trebkiller', realName: 'Vladimír Hořký', photo: 'assets/images/players/Trebkiller.jpg', team: 'red' },
];

const LOL_ROLES = [
  { id: 'top', code: 'TOP', name: 'TOP' },
  { id: 'jng', code: 'JUNG', name: 'JUNGLE' },
  { id: 'mid', code: 'MID', name: 'MID' },
  { id: 'adc', code: 'ADC', name: 'ADC' },
  { id: 'bot', code: 'SUPP', name: 'BOT' },
];

// Pomocná funkce pro flexibilní párování ID rolí i při starých/alternativních názvech
function matchRoleId(roleA, roleB) {
  if (!roleA || !roleB) return false;
  if (roleA === roleB) return true;
  const norm = r => {
    const s = String(r).toLowerCase().trim();
    if (['jng', 'jgl', 'jungle', 'jung'].includes(s)) return 'jng';
    if (['adc', 'ad_carry', 'adcarry', 'carry'].includes(s)) return 'adc';
    if (['bot', 'sup', 'supp', 'support'].includes(s)) return 'bot';
    if (['mid', 'middle'].includes(s)) return 'mid';
    if (['top'].includes(s)) return 'top';
    return s;
  };
  return norm(roleA) === norm(roleB);
}

// Normalizace uložených rolí pro zaručení 5 kanonických pozic (top, jng, mid, adc, bot)
function normalizeRolesList(rawList) {
  if (!Array.isArray(rawList)) return null;

  // Detekce starého formátu: [top, jgl, mid, bot, sup], kde bot = ADC a sup = Support
  const hasOldSup = rawList.some(r => {
    const id = (r.roleId || r.id || '').toLowerCase();
    return id === 'sup' || id === 'supp' || id === 'support';
  });
  const hasAdc = rawList.some(r => {
    const id = (r.roleId || r.id || '').toLowerCase();
    return id === 'adc' || id === 'ad_carry';
  });

  return LOL_ROLES.map(canonical => {
    let found = null;
    if (canonical.id === 'top') {
      found = rawList.find(r => (r.roleId || r.id || '').toLowerCase() === 'top');
    } else if (canonical.id === 'jng') {
      found = rawList.find(r => ['jng', 'jgl', 'jungle', 'jung'].includes((r.roleId || r.id || '').toLowerCase()));
    } else if (canonical.id === 'mid') {
      found = rawList.find(r => ['mid', 'middle'].includes((r.roleId || r.id || '').toLowerCase()));
    } else if (canonical.id === 'adc') {
      if (hasAdc) {
        found = rawList.find(r => ['adc', 'ad_carry', 'carry'].includes((r.roleId || r.id || '').toLowerCase()));
      } else if (hasOldSup) {
        // Ve starém schématu byl 'bot' na 4. pozici jako ADC (BOT / ADC)
        found = rawList.find(r => (r.roleId || r.id || '').toLowerCase() === 'bot');
      } else {
        found = rawList.find(r => ['adc', 'ad_carry'].includes((r.roleId || r.id || '').toLowerCase()));
      }
    } else if (canonical.id === 'bot') {
      if (hasOldSup) {
        // Ve starém schématu byl 'sup' na 5. pozici jako Support
        found = rawList.find(r => ['sup', 'supp', 'support'].includes((r.roleId || r.id || '').toLowerCase()));
      } else {
        found = rawList.find(r => ['bot', 'sup', 'supp', 'support'].includes((r.roleId || r.id || '').toLowerCase()));
      }
    }

    return {
      roleId: canonical.id,
      roleCode: canonical.code,
      roleName: canonical.name,
      player: found ? (found.player || null) : null,
    };
  });
}

// ---------------------------------------------------------------------
// PŘESNÉ SOUŘADNICE POLÍČEK ROLÍ NA MAPĚ SUMMONER'S RIFT:
// ZDE MŮŽETE NASTAVIT, V JAKÉ ČÁSTI PŘESNĚ MAPY JEDNOTLIVÁ POLÍČKA PRO ROLI BUDOU:
//   - 'leftPercent': horizontální pozice v % (0 = levý okraj mapy, 100 = pravý okraj mapy)
//   - 'topPercent':  vertikální pozice v %   (0 = horní okraj mapy, 100 = dolní okraj mapy)
// POZOR: Políčka jsou vázána na STRANU MAPY ('side: blue/red'), nikoliv na fixní tým!
//   - BLUE SIDE: spodní polovina mapy / vlevo dole (tým hrající na modré straně)
//   - RED SIDE:  horní polovina mapy / vpravo nahoře (tým hrající na červené straně)
// ---------------------------------------------------------------------
const MAP_ROLE_SLOTS = [
  // BLUE SIDE (spodní polovina mapy / vlevo dole)
  { side: 'blue', team: 'blue', roleId: 'top', roleCode: 'TOP', roleName: 'TOP', leftPercent: 12, topPercent: 25 },
  { side: 'blue', team: 'blue', roleId: 'jng', roleCode: 'JUNG', roleName: 'JUNGLE', leftPercent: 25, topPercent: 45 },
  { side: 'blue', team: 'blue', roleId: 'mid', roleCode: 'MID', roleName: 'MID', leftPercent: 41, topPercent: 58 },
  { side: 'blue', team: 'blue', roleId: 'adc', roleCode: 'ADC', roleName: 'ADC', leftPercent: 68, topPercent: 88 },
  { side: 'blue', team: 'blue', roleId: 'bot', roleCode: 'SUPP', roleName: 'BOT', leftPercent: 56, topPercent: 88 },

  // RED SIDE (horní polovina mapy / vpravo nahoře)
  { side: 'red', team: 'red', roleId: 'top', roleCode: 'TOP', roleName: 'TOP', leftPercent: 24.5, topPercent: 10 },
  { side: 'red', team: 'red', roleId: 'jng', roleCode: 'JUNG', roleName: 'JUNGLE', leftPercent: 39, topPercent: 25 },
  { side: 'red', team: 'red', roleId: 'mid', roleCode: 'MID', roleName: 'MID', leftPercent: 53.5, topPercent: 41.5 },
  { side: 'red', team: 'red', roleId: 'adc', roleCode: 'ADC', roleName: 'ADC', leftPercent: 82, topPercent: 70 },
  { side: 'red', team: 'red', roleId: 'bot', roleCode: 'SUPP', roleName: 'BOT', leftPercent: 82, topPercent: 54 },
];

// ---------------------------------------------------------------------
// PŘESNÁ OSNOVA:
// 1. Kámen nůžky (přeskočí se při stavu 2:0)
// 2. 1. Hra: Volba strany (Tým A = vítěz rozstřelu nebo vedoucí 2:0)
// 3. 1. Hra: Rozhození hráčů na role (oba týmy zároveň)
// 4. 2. Hra: Volba strany (tým s prohranou 1. hrou)
// 5. 2. Hra: Rozhození hráčů na role (oba týmy zároveň)
// 6. 3. Hra: Volba strany (tým s prohranou 2. hrou)
// 7. 3. Hra: Rozhození hráčů na role (oba týmy zároveň)
// ---------------------------------------------------------------------
const PICK_SEQUENCE = [
  { id: 'step-0', type: 'rps', title: 'Rozstřel' },
  { id: 'step-1', type: 'side_pick', matchNumber: 1, chooser: 'A', title: '1. Hra: Volba strany' },
  { id: 'step-2', type: 'roles', matchNumber: 1, title: '1. Hra: Role hráčů' },
  { id: 'step-3', type: 'side_pick', matchNumber: 2, chooser: 'loser_1', title: '2. Hra: Volba strany' },
  { id: 'step-4', type: 'roles', matchNumber: 2, title: '2. Hra: Role hráčů' },
  { id: 'step-5', type: 'side_pick', matchNumber: 3, chooser: 'loser_2', title: '3. Hra: Volba strany' },
  { id: 'step-6', type: 'roles', matchNumber: 3, title: '3. Hra: Role hráčů' },
];

// Stav volby
let pickState = {
  currentStepIndex: 0,
  teamA: null,          // 'blue' | 'red' (vítěz rozstřelu nebo tým vedoucí 2:0)
  teamB: null,          // 'blue' | 'red'
  is20Skip: false,      // zda byl rozstřel přeskočen kvůli stavu 2:0
  stepResults: {},      // index kroku -> výsledek
  pickedMatches: [],    // zápasy: { round, chosenSide, chosenBy, blueTeam, redTeam, loserOfPrevious }
  matchLosers: {        // kdo prohrál hru 1 a 2 { 1: 'blue'|'red', 2: 'blue'|'red' }
    1: null,
    2: null,
  },
  gameRoles: {          // role hráčů pro každou hru { 1: { blue: [...], red: [...] }, 2: ..., 3: ... }
    1: null,
    2: null,
    3: null,
  },
  isCompleted: false,
};

// Pomocná proměnná pro výběr hráče kliknutím
let selectedTile = null; // { team: 'blue'|'red', player, fromRoleId: null }

const STORAGE_KEY = 'lanka_pick_lol';
const STATE_BACKUP_KEY = 'lanka_lol_pick_state_v2';

// =====================================================================
// ZÍSKÁNÍ SOUPISKY PRO TÝM
// =====================================================================
function getTeamRoster(teamColor) {
  if (teamColor === 'red') {
    return [
      CAPTAIN_RED,
      DEFAULT_PLAYERS.find(p => p.id === 'player-6') || { id: 'player-6', name: 'Balib', team: 'red' },
      DEFAULT_PLAYERS.find(p => p.id === 'player-3') || { id: 'player-3', name: 'Pravdomil', team: 'red' },
      DEFAULT_PLAYERS.find(p => p.id === 'player-5') || { id: 'player-5', name: 'Kahanate', team: 'red' },
      DEFAULT_PLAYERS.find(p => p.id === 'player-8') || { id: 'player-8', name: 'Trebkiller', team: 'red' },
    ];
  } else {
    return [
      CAPTAIN_BLUE,
      DEFAULT_PLAYERS.find(p => p.id === 'player-1') || { id: 'player-1', name: 'GIRY', team: 'blue' },
      DEFAULT_PLAYERS.find(p => p.id === 'player-2') || { id: 'player-2', name: 'Winters', team: 'blue' },
      DEFAULT_PLAYERS.find(p => p.id === 'player-4') || { id: 'player-4', name: 'Vojcii', team: 'blue' },
      DEFAULT_PLAYERS.find(p => p.id === 'player-7') || { id: 'player-7', name: 'Chleba', team: 'blue' },
    ];
  }
}

function initGameRoles(matchNumber) {
  if (!pickState.gameRoles) {
    pickState.gameRoles = { 1: null, 2: null, 3: null };
  }

  // Zjistíme, zda jsou role pro danou hru ještě prázdné (žádný hráč nepřiřazen)
  const isRolesEmpty = (rolesObj) => {
    if (!rolesObj) return true;
    const bEmpty = !(rolesObj.blue || []).some(r => r.player);
    const rEmpty = !(rolesObj.red || []).some(r => r.player);
    return bEmpty && rEmpty;
  };

  if (!pickState.gameRoles[matchNumber] || isRolesEmpty(pickState.gameRoles[matchNumber])) {
    // 1. Zkusíme načíst rozložení rolí z předchozí hry (matchNumber - 1)
    let prevRolesByTeam = null;
    if (matchNumber > 1 && pickState.gameRoles[matchNumber - 1]) {
      const prevMatch = pickState.pickedMatches[matchNumber - 2];
      const prevBlueSideTeam = prevMatch?.blueTeam || 'blue';
      const prevRedSideTeam = prevMatch?.redTeam || 'red';
      const prevGameRoles = pickState.gameRoles[matchNumber - 1];

      prevRolesByTeam = {
        [prevBlueSideTeam]: prevGameRoles.blue || [],
        [prevRedSideTeam]: prevGameRoles.red || [],
      };
    }

    const currentMatch = pickState.pickedMatches[matchNumber - 1];
    const currentBlueSideTeam = currentMatch?.blueTeam || 'blue';
    const currentRedSideTeam = currentMatch?.redTeam || 'red';

    const getInitialRoleForSide = (side, role) => {
      const teamOnSide = side === 'blue' ? currentBlueSideTeam : currentRedSideTeam;
      // Pokud máme uložené role týmu z minulé hry, předvyplníme stejného hráče
      if (prevRolesByTeam && prevRolesByTeam[teamOnSide]) {
        const prevRoleObj = prevRolesByTeam[teamOnSide].find(r => matchRoleId(r.roleId, role.id));
        if (prevRoleObj && prevRoleObj.player) {
          return {
            roleId: role.id,
            roleCode: role.code,
            roleName: role.name,
            player: { ...prevRoleObj.player },
          };
        }
      }
      return {
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
        player: null,
      };
    };

    // Prázdné nebo předvyplněné šedé čtverečky pro všechny pozice
    pickState.gameRoles[matchNumber] = {
      blue: LOL_ROLES.map(role => getInitialRoleForSide('blue', role)),
      red: LOL_ROLES.map(role => getInitialRoleForSide('red', role)),
    };
  } else {
    // Pokud již existuje (např. z localStorage), normalizujeme pro zajištění všech pozic (včetně jng a adc)
    const current = pickState.gameRoles[matchNumber];
    if (current.blue) current.blue = normalizeRolesList(current.blue);
    if (current.red) current.red = normalizeRolesList(current.red);
  }
}

// =====================================================================
// ZJIŠTĚNÍ STAVU 2:0 Z TURNAJOVÉHO SKÓRE NEBO URL
// =====================================================================
// =====================================================================
// AUTOMATICKÁ SYNCHRONIZACE S TURNAJOVÝM SKÓRE (SCORE.HTML)
// 1. Stav 2:0 po CS2 a Warcraftu -> automaticky rozhodnuto na začátku LoL
// 2. Výsledky 1. a 2. hry ze score.html -> automaticky určeno kdo pickuje
// =====================================================================
function getTournamentState() {
  let cs2Winner = 0;      // 1 = Modrý, 2 = Červený
  let warcraftWinner = 0; // 1 = Modrý, 2 = Červený
  let lolResults = [0, 0, 0];

  try {
    const raw = localStorage.getItem('lanka_tournament_score');
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.gameWinner)) {
        cs2Winner = data.gameWinner[0] || 0;
        warcraftWinner = data.gameWinner[1] || 0;
      }
      if (Array.isArray(data.results)) {
        // Fallback pro CS2 (index 0)
        if (!cs2Winner && Array.isArray(data.results[0])) {
          const b = data.results[0].filter(v => v === 1).length;
          const r = data.results[0].filter(v => v === 2).length;
          if (b >= 2) cs2Winner = 1;
          else if (r >= 2) cs2Winner = 2;
        }
        // Fallback pro Warcraft (index 1)
        if (!warcraftWinner && Array.isArray(data.results[1])) {
          const b = data.results[1].filter(v => v === 1).length;
          const r = data.results[1].filter(v => v === 2).length;
          if (b >= 2) warcraftWinner = 1;
          else if (r >= 2) warcraftWinner = 2;
        }
        // Výsledky LoL (index 2)
        if (Array.isArray(data.results[2])) {
          lolResults = [
            Number(data.results[2][0]) || 0,
            Number(data.results[2][1]) || 0,
            Number(data.results[2][2]) || 0,
          ];
        }
      }
      // Pokud byl vítěz LoL označen přímo (gameWinner[2])
      if (!lolResults[0] && Array.isArray(data.gameWinner) && data.gameWinner[2]) {
        lolResults[0] = Number(data.gameWinner[2]) || 0;
      }
    }
  } catch (e) {
    console.warn('Chyba při čtení lanka_tournament_score:', e);
  }

  // Kontrola z URL parametrů (?lead=blue / ?lead=red / ?lol_g1=blue / ?lol_g2=red)
  try {
    const url = new URL(window.location.href);
    const lead = url.searchParams.get('lead');
    if (lead === 'blue') { cs2Winner = 1; warcraftWinner = 1; }
    else if (lead === 'red') { cs2Winner = 2; warcraftWinner = 2; }

    const urlG1 = url.searchParams.get('lol_g1');
    if (urlG1 === 'blue') lolResults[0] = 1;
    else if (urlG1 === 'red') lolResults[0] = 2;

    const urlG2 = url.searchParams.get('lol_g2');
    if (urlG2 === 'blue') lolResults[1] = 1;
    else if (urlG2 === 'red') lolResults[1] = 2;
  } catch (e) { /* ignore */ }

  return { cs2Winner, warcraftWinner, lolResults };
}

function syncWithTournamentScore() {
  const { cs2Winner, warcraftWinner, lolResults } = getTournamentState();
  let stateChanged = false;

  // 1. AUTOMATICKÉ ROZHODNUTÍ STAVU 2:0 NA ZAČÁTKU LOLKA
  if (cs2Winner === 1 && warcraftWinner === 1) {
    // Modří vedou 2:0 v sérii -> ČERVENÝ TÝM automaticky vybírá jako první!
    if (pickState.teamA !== 'red' || !pickState.is20Skip) {
      pickState.teamA = 'red';
      pickState.teamB = 'blue';
      pickState.is20Skip = true;
      stateChanged = true;
    }
    if (pickState.currentStepIndex === 0) {
      pickState.currentStepIndex = 1;
      stateChanged = true;
    }
  } else if (cs2Winner === 2 && warcraftWinner === 2) {
    // Červení vedou 2:0 v sérii -> MODRÝ TÝM automaticky vybírá jako první!
    if (pickState.teamA !== 'blue' || !pickState.is20Skip) {
      pickState.teamA = 'blue';
      pickState.teamB = 'red';
      pickState.is20Skip = true;
      stateChanged = true;
    }
    if (pickState.currentStepIndex === 0) {
      pickState.currentStepIndex = 1;
      stateChanged = true;
    }
  }

  // 2. AUTOMATICKÝ PROPIS VÝSLEDKU 1. HRY Z TABULKY SKÓRE
  if (lolResults[0] === 1 || lolResults[0] === 2) {
    const loser1 = lolResults[0] === 1 ? 'red' : 'blue';
    if (pickState.matchLosers[1] !== loser1) {
      pickState.matchLosers[1] = loser1;
      stateChanged = true;
    }

    // Pokud už je 1. hra odehraná ve score.html, automaticky jdeme na volbu strany pro 2. hru
    if (pickState.currentStepIndex < 3) {
      if (!pickState.pickedMatches[0]) {
        pickState.pickedMatches[0] = {
          round: 1,
          mapId: 'summoners_rift',
          mapName: "Summoner's Rift",
          mapImage: 'lol-map.png',
          chosenSide: 'blue',
          chosenBy: pickState.teamA || 'red',
          blueTeam: 'blue',
          redTeam: 'red',
        };
        pickState.stepResults[1] = pickState.pickedMatches[0];
      }
      initGameRoles(1);
      pickState.stepResults[2] = { rolesConfirmed: true, matchNumber: 1 };
      pickState.currentStepIndex = 3;
      stateChanged = true;
    }
  }

  // 3. AUTOMATICKÝ PROPIS VÝSLEDKU 2. HRY Z TABULKY SKÓRE
  if (lolResults[1] === 1 || lolResults[1] === 2) {
    const loser2 = lolResults[1] === 1 ? 'red' : 'blue';
    if (pickState.matchLosers[2] !== loser2) {
      pickState.matchLosers[2] = loser2;
      stateChanged = true;
    }

    // Pokud už je 2. hra odehraná ve score.html, automaticky jdeme na volbu strany pro 3. hru
    if (pickState.currentStepIndex < 5) {
      if (!pickState.pickedMatches[1]) {
        pickState.pickedMatches[1] = {
          round: 2,
          mapId: 'summoners_rift',
          mapName: "Summoner's Rift",
          mapImage: 'lol-map.png',
          chosenSide: 'blue',
          chosenBy: pickState.matchLosers[1] || 'blue',
          blueTeam: 'blue',
          redTeam: 'red',
        };
        pickState.stepResults[3] = pickState.pickedMatches[1];
      }
      initGameRoles(2);
      pickState.stepResults[4] = { rolesConfirmed: true, matchNumber: 2 };
      pickState.currentStepIndex = 5;
      stateChanged = true;
    }
  }

  if (stateChanged) {
    saveState();
  }
}

// =====================================================================
// NAČTENÍ & ULOŽENÍ STAVU
// =====================================================================
function loadState() {
  const saved = localStorage.getItem(STATE_BACKUP_KEY);
  if (saved) {
    try {
      pickState = JSON.parse(saved);
      if (!pickState.gameRoles) pickState.gameRoles = { 1: null, 2: null, 3: null };
      if (!pickState.matchLosers) pickState.matchLosers = { 1: null, 2: null };

      // Okamžitá normalizace všech uložených her pro zajištění konzistence pozic
      [1, 2, 3].forEach(mNum => {
        if (pickState.gameRoles[mNum]) {
          if (pickState.gameRoles[mNum].blue) {
            pickState.gameRoles[mNum].blue = normalizeRolesList(pickState.gameRoles[mNum].blue);
          }
          if (pickState.gameRoles[mNum].red) {
            pickState.gameRoles[mNum].red = normalizeRolesList(pickState.gameRoles[mNum].red);
          }
        }
      });
    } catch (e) {
      console.error('Chyba při čtení stavu:', e);
      resetState();
    }
  } else {
    resetState();
  }

  // Vždy automaticky synchronizujeme se score.html
  syncWithTournamentScore();
}

function saveState() {
  localStorage.setItem(STATE_BACKUP_KEY, JSON.stringify(pickState));
  saveToScoreStorage();
}

function getScoreData() {
  if (!pickState.pickedMatches || pickState.pickedMatches.length === 0) return null;

  return {
    game: 'lol',
    teamA: pickState.teamA,
    teamB: pickState.teamB,
    rounds: pickState.pickedMatches.map((pm, idx) => ({
      round: idx + 1,
      mapId: 'summoners_rift',
      mapName: "Summoner's Rift",
      mapImage: 'lol-map.png',
      metaTop: "Summoner's Rift",
      metaBottom: `Blue: ${pm.blueTeam === 'blue' ? 'Modří' : 'Červení'}`,
      pickedBy: pm.chosenBy,
      blueTeam: pm.blueTeam,
      redTeam: pm.redTeam,
      roles: pickState.gameRoles ? pickState.gameRoles[idx + 1] : null,
    })),
    gameRoles: pickState.gameRoles,
  };
}

function getScoreUrl() {
  const data = getScoreData();
  if (!data) return 'score.html?reset_lol=1';
  return `score.html?pick_lol=${encodeURIComponent(JSON.stringify(data))}`;
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

let swapSelection = null;

function resetState() {
  pickState = {
    currentStepIndex: 0,
    teamA: null,
    teamB: null,
    is20Skip: false,
    stepResults: {},
    pickedMatches: [],
    matchLosers: { 1: null, 2: null },
    gameRoles: { 1: null, 2: null, 3: null },
    isCompleted: false,
  };
  swapSelection = null;
  localStorage.removeItem(STATE_BACKUP_KEY);
  localStorage.removeItem(STORAGE_KEY);

  const container = document.getElementById('timelineContainer');
  if (container) container.innerHTML = '';
  const workspace = document.getElementById('workspaceCol');
  if (workspace) workspace.innerHTML = '';
}

// =====================================================================
// POMOCNÉ FUNKCE PRO VÝBĚR TÝMŮ
// =====================================================================
function getEffectiveChooser(step) {
  if (!step) return null;
  if (step.type !== 'side_pick') return null;

  if (step.chooser === 'A') return pickState.teamA;
  if (step.chooser === 'B') return pickState.teamB;
  if (step.chooser === 'loser_1') return pickState.matchLosers[1];
  if (step.chooser === 'loser_2') return pickState.matchLosers[2];
  return null;
}

function getChooserLabel(step) {
  if (!step) return '';
  if (step.type === 'rps') {
    return pickState.is20Skip && pickState.teamA ? (pickState.teamA === 'blue' ? 'MODRÝ' : 'ČERVENÝ') : '';
  }
  if (step.type === 'roles') {
    return '';
  }
  if (step.type === 'side_pick') {
    const eff = getEffectiveChooser(step);
    if (eff === 'blue') return 'MODRÝ';
    if (eff === 'red') return 'ČERVENÝ';
    if (step.chooser === 'A') return pickState.teamA ? (pickState.teamA === 'blue' ? 'MODRÝ' : 'ČERVENÝ') : 'TÝM A';
    if (step.chooser === 'loser_1') return 'PORAŽENÝ Z 1. HRY';
    if (step.chooser === 'loser_2') return 'PORAŽENÝ Z 2. HRY';
  }
  return '';
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

    const teamLabel = getChooserLabel(step);
    const effChooser = getEffectiveChooser(step);

    let teamColorCls = 'team-neutral';
    let frameColorCls = 'frame-neutral';

    if (step.type === 'roles') {
      teamColorCls = 'team-both';
    } else if (effChooser === 'blue') {
      teamColorCls = 'team-blue';
      frameColorCls = 'frame-blue';
    } else if (effChooser === 'red') {
      teamColorCls = 'team-red';
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

    // 1. KROK: RPS / PROHRÁVAJÍCÍ 2:0 ZAČÍNÁ
    if (step.type === 'rps') {
      if (pickState.is20Skip) {
        const skipColor = pickState.teamA;
        const skipColorCls = skipColor === 'blue' ? 'team-blue' : 'team-red';
        const skipName = skipColor === 'blue' ? 'MODRÝ' : 'ČERVENÝ';
        const hasSkipNode = row.querySelector('.timeline-skip-node');

        if (needsFullBuild || !hasSkipNode) {
          row.innerHTML = `
            <div class="timeline-row-team">
              <span class="team-mini-label ${skipColorCls}">${skipName}</span>
            </div>
            <div class="timeline-row-action">
              <div class="timeline-skip-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" title="Prohrávající začíná (1. volba strany)">
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
            teamSpan.className = `team-mini-label ${skipColorCls}`;
            teamSpan.textContent = skipName;
          }
          const skipNode = row.querySelector('.timeline-skip-node');
          if (skipNode) {
            skipNode.className = `timeline-skip-node ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;
          }
        }
      } else {
        const teamCls = pickState.teamA === 'blue' ? 'team-blue' : pickState.teamA === 'red' ? 'team-red' : '';
        const teamName = pickState.teamA === 'blue' ? 'MODRÝ' : pickState.teamA === 'red' ? 'ČERVENÝ' : '';
        const teamSpanHtml = pickState.teamA ? `<span class="team-mini-label ${teamCls}">${teamName}</span>` : '';

        if (needsFullBuild) {
          row.innerHTML = `
            <div class="timeline-row-team">${teamSpanHtml}</div>
            <div class="timeline-row-action">
              <div class="timeline-skip-node is-rule ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}" title="Prohrávající začíná, jinak Kámen Nůžky Papír">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="skip-svg">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>PROHRÁVAJÍCÍ ZAČÍNÁ</span>
                <span class="rule-sep">JINAK</span>
                <div class="rule-rps-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-rps-svg" title="Kámen">
                    <path d="M6 10l3-5 6 1 4 5-1 7-7 3-6-3z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-rps-svg" title="Nůžky">
                    <circle cx="6" cy="6" r="3"/>
                    <circle cx="6" cy="18" r="3"/>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                  </svg>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-rps-svg" title="Papír">
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
          const teamSpan = row.querySelector('.timeline-row-team');
          if (teamSpan) {
            teamSpan.innerHTML = teamSpanHtml;
          }
          const ruleNode = row.querySelector('.timeline-skip-node');
          if (ruleNode) {
            ruleNode.className = `timeline-skip-node is-rule ${isActive ? 'is-active' : ''} ${isPast ? 'is-completed' : ''}`;
          }
        }
      }
      return;
    }

    // 2. KROK: VOLBA STRANY
    if (step.type === 'side_pick') {
      const matchOrderText = `${step.matchNumber}. HRA`;
      let frameInnerHtml = '';
      let renderKey = '';

      if (stepResult) {
        const sideLabel = stepResult.chosenSide === 'blue' ? 'BLUE SIDE' : 'RED SIDE';
        const teamSideText = `${stepResult.chosenBy === 'blue' ? 'Modří' : 'Červení'}: ${sideLabel}`;
        renderKey = `match-${step.matchNumber}-${stepResult.chosenSide}-${stepResult.chosenBy}`;
        frameInnerHtml = `
          <img src="${LOL_MAP_PATH}" alt="" class="frame-map-img" draggable="false">
          <div class="frame-bottom-gradient"></div>
          <div class="frame-ct-tag">${matchOrderText}, ${teamSideText}</div>
        `;
      } else {
        const activeStatusBadge = isActive ? `<div class="frame-active-status">VOLBA STRANY</div>` : '';
        renderKey = `prepick-${isActive}-${matchOrderText}`;
        frameInnerHtml = `
          <div class="frame-prepick-content">
            <div class="frame-order-title">${matchOrderText}</div>
            ${activeStatusBadge}
          </div>
        `;
      }

      if (needsFullBuild) {
        row.innerHTML = `
          <div class="timeline-row-team">
            <span class="team-mini-label ${teamColorCls} ${isActive ? 'is-active-team' : ''}">${teamLabel}</span>
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
          teamSpan.className = `team-mini-label ${teamColorCls} ${isActive ? 'is-active-team' : ''}`;
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
      return;
    }

    // 3. KROK: ROZHOZENÍ ROLÍ
    if (step.type === 'roles') {
      const matchOrderText = `${step.matchNumber}. HRA`;
      const isRolesDone = Boolean(stepResult?.rolesConfirmed);

      const rolesHtml = `
        <div class="timeline-roles-node ${isActive ? 'is-active' : ''} ${isRolesDone ? 'is-completed' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="timeline-role-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span class="timeline-role-text">${isRolesDone ? `${matchOrderText} — ROLE HOTOVY` : `${matchOrderText} — ROLE HRÁČŮ`}</span>
        </div>
      `;

      if (needsFullBuild) {
        row.innerHTML = `
          <div class="timeline-row-team"></div>
          <div class="timeline-row-action">
            ${rolesHtml}
          </div>
        `;
      } else {
        const teamDiv = row.querySelector('.timeline-row-team');
        if (teamDiv) {
          teamDiv.innerHTML = '';
        }
        const actionCol = row.querySelector('.timeline-row-action');
        if (actionCol) {
          actionCol.innerHTML = rolesHtml;
        }
      }
      return;
    }
  });
}

// =====================================================================
// INDIKÁTOR TÝMU NA ŘADĚ V HORNÍ LIŠTĚ
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
  if (!currentStep || currentStep.type === 'rps') {
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
    return;
  }

  if (currentStep.type === 'roles') {
    display.className = 'top-turn-display is-hidden';
    display.innerHTML = '';
    return;
  }

  if (currentStep.type === 'side_pick') {
    const effChooser = getEffectiveChooser(currentStep);

    if (effChooser === 'blue') {
      document.body.classList.add('turn-active-blue');
      display.className = 'top-turn-display turn-card-blue';
      display.textContent = 'MODRÝ TÝM';
    } else if (effChooser === 'red') {
      document.body.classList.add('turn-active-red');
      display.className = 'top-turn-display turn-card-red';
      display.textContent = 'ČERVENÝ TÝM';
    } else {
      display.className = 'top-turn-display is-hidden';
      display.innerHTML = '';
    }
  }
}

// =====================================================================
// RENDER PRACOVNÍ PLOCHY (PRAVÁ ČÁST)
// =====================================================================
function renderWorkspace() {
  const workspace = document.getElementById('workspaceCol');
  if (!workspace) return;

  syncWithTournamentScore();

  if (pickState.isCompleted) {
    workspace.innerHTML = '';
    renderSummaryView(workspace);
    return;
  }

  const currentStep = PICK_SEQUENCE[pickState.currentStepIndex];
  if (!currentStep) return;

  // 1. KROK 0: Kámen nůžky papír
  if (currentStep.type === 'rps') {
    workspace.innerHTML = '';
    renderRPSChoice(workspace);
    return;
  }

  // 2. KROK: VOLBA STRANY
  if (currentStep.type === 'side_pick') {
    workspace.innerHTML = '';
    const effChooser = getEffectiveChooser(currentStep);

    // Pokud pro 2. nebo 3. hru ještě nebyl určen poražený předchozí hry
    if (!effChooser && currentStep.matchNumber > 1) {
      renderLoserSelector(workspace, currentStep);
      return;
    }

    renderSideSelector(workspace, currentStep, effChooser);
    return;
  }

  // 3. KROK: ROZHOZENÍ ROLÍ
  if (currentStep.type === 'roles') {
    workspace.innerHTML = '';
    renderRoleAssigner(workspace, currentStep);
    return;
  }
}

// ---------------------------------------------------------------------
// KROK 0: Kámen Nůžky Papír (při stavu 1:1)
// ---------------------------------------------------------------------
function renderRPSChoice(container) {
  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">KDO VYBÍRÁ STRANU PRO 1. HRU?</h2>
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
      pickState.is20Skip = false;
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
      pickState.is20Skip = false;
      pickState.currentStepIndex = 1;
      saveState();
      render();
    }, 130);
  });
}

// ---------------------------------------------------------------------
// VÝBĚR PORAŽENÉHO Z PŘEDCHOZÍ HRY (PRO 2. A 3. HRU)
// ---------------------------------------------------------------------
function renderLoserSelector(container, step) {
  const prevGameNum = step.matchNumber - 1;

  container.innerHTML = `
    <div class="loser-prompt-wrapper">
      <div class="loser-prompt-header">
        <div class="loser-match-tag">${step.matchNumber}. HRA — VOLBA STRANY</div>
        <h2 class="loser-prompt-title">KDO PROHRÁL ${prevGameNum}. HRU?</h2>
        <p class="loser-prompt-subtitle">Tým, který prohrál předchozí hru, vybírá stranu pro ${step.matchNumber}. hru.</p>
      </div>

      <div class="loser-cards-wrapper">
        <div class="loser-team-card card-blue" id="loserPickBlue" role="button" tabindex="0">
          <div class="loser-card-badge">MODRÝ TÝM</div>
          <div class="loser-card-status">PROHRÁL ${prevGameNum}. HRU</div>
          <div class="loser-card-btn">ZVOLIT (MODRÝ VYBÍRÁ STRANU)</div>
        </div>

        <div class="loser-team-card card-red" id="loserPickRed" role="button" tabindex="0">
          <div class="loser-card-badge">ČERVENÝ TÝM</div>
          <div class="loser-card-status">PROHRÁL ${prevGameNum}. HRU</div>
          <div class="loser-card-btn">ZVOLIT (ČERVENÝ VYBÍRÁ STRANU)</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loserPickBlue')?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      pickState.matchLosers[prevGameNum] = 'blue';
      saveState();
      render();
    }, 130);
  });

  document.getElementById('loserPickRed')?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      pickState.matchLosers[prevGameNum] = 'red';
      saveState();
      render();
    }, 130);
  });
}

// ---------------------------------------------------------------------
// VOLBA STRANY NA DIAGONÁLNÍ MAPĚ
// ---------------------------------------------------------------------
function renderSideSelector(container, step, chooserTeam) {
  const prevGameNum = step.matchNumber - 1;
  const canReselectLoser = step.matchNumber > 1;

  container.innerHTML = `
    <div class="lol-side-selector-wrapper">
      <div class="lol-map-board">
        <!-- Podkladová mapa -->
        <img src="${LOL_MAP_PATH}" alt="Summoner's Rift" class="lol-map-bg-img" draggable="false">

        <!-- Modrá strana (Vlevo dole) -->
        <div class="lol-half lol-half-blue" id="halfBlue" role="button" tabindex="0">
          <div class="lol-half-img"></div>
          <div class="lol-half-card lol-card-blue-pos">
            <div class="lol-side-title">Blue side</div>
          </div>
        </div>

        <!-- Červená strana (Vpravo nahoře) -->
        <div class="lol-half lol-half-red" id="halfRed" role="button" tabindex="0">
          <div class="lol-half-img"></div>
          <div class="lol-half-card lol-card-red-pos">
            <div class="lol-side-title">Red side</div>
          </div>
        </div>

        <!-- Diagonální řeka (Neutrální čistá linie) -->
        <svg class="lol-river-svg" viewBox="0 0 624 444" preserveAspectRatio="none">
          <defs>
            <filter id="riverGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <line x1="0" y1="0" x2="624" y2="444" stroke="rgba(255, 255, 255, 0.55)" stroke-width="2.5" filter="url(#riverGlow)"/>
        </svg>
      </div>

      ${canReselectLoser ? `
        <button class="lol-reselect-loser-btn" id="reselectLoserBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Změnit tým, který prohrál ${prevGameNum}. hru</span>
        </button>
      ` : ''}
    </div>
  `;

  document.getElementById('reselectLoserBtn')?.addEventListener('click', () => {
    pickState.matchLosers[prevGameNum] = null;
    saveState();
    render();
  });

  let isHandling = false;

  document.getElementById('halfBlue')?.addEventListener('click', (e) => {
    if (isHandling) return;
    isHandling = true;
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      applySideChoice('blue', step, chooserTeam);
    }, 140);
  });

  document.getElementById('halfRed')?.addEventListener('click', (e) => {
    if (isHandling) return;
    isHandling = true;
    e.currentTarget.classList.add('is-selecting');
    setTimeout(() => {
      applySideChoice('red', step, chooserTeam);
    }, 140);
  });
}

function applySideChoice(chosenSide, step, activeTeamColor) {
  const otherTeamColor = activeTeamColor === 'blue' ? 'red' : 'blue';

  const blueTeam = chosenSide === 'blue' ? activeTeamColor : otherTeamColor;
  const redTeam = chosenSide === 'red' ? activeTeamColor : otherTeamColor;

  const matchRecord = {
    round: step.matchNumber,
    mapId: 'summoners_rift',
    mapName: "Summoner's Rift",
    mapImage: 'lol-map.png',
    chosenSide: chosenSide, // 'blue' | 'red'
    chosenBy: activeTeamColor, // 'blue' | 'red'
    blueTeam: blueTeam,
    redTeam: redTeam,
    loserOfPrevious: step.matchNumber > 1 ? pickState.matchLosers[step.matchNumber - 1] : null,
  };

  // Uložíme zápas
  pickState.pickedMatches[step.matchNumber - 1] = matchRecord;
  pickState.stepResults[pickState.currentStepIndex] = matchRecord;

  // Pokud pro tuto hru ještě nebyly role definitivně potvrzeny,
  // synchronizujeme role s minulou hrou podle nově zvolené strany
  if (step.matchNumber > 1 && !pickState.stepResults[pickState.currentStepIndex + 1]?.rolesConfirmed) {
    pickState.gameRoles[step.matchNumber] = null;
  }

  // Inicializujeme role pro tuto hru
  initGameRoles(step.matchNumber);

  pickState.currentStepIndex++;
  saveState();
  render();
}

// ---------------------------------------------------------------------
// KROK: ROZHOZENÍ HRÁČŮ NA ROLE (VELKÁ MAPA + MODRÝ & ČERVENÝ SLOUPEC)
// ---------------------------------------------------------------------
function autoFillRemainingRoles(matchNum) {
  const matchRecord = pickState.pickedMatches[matchNum - 1];
  const blueSideTeam = matchRecord?.blueTeam || 'blue';
  const redSideTeam = matchRecord?.redTeam || 'red';

  ['blue', 'red'].forEach(side => {
    const sideTeam = side === 'blue' ? blueSideTeam : redSideTeam;
    const roles = pickState.gameRoles[matchNum][side];
    const roster = getTeamRoster(sideTeam);
    const assignedIds = new Set(roles.map(r => r.player?.id).filter(Boolean));
    const available = roster.filter(p => !assignedIds.has(p.id));
    let availIdx = 0;
    roles.forEach(r => {
      if (!r.player && availIdx < available.length) {
        r.player = available[availIdx++];
      }
    });
  });
}

function renderRoleAssigner(container, step) {
  const matchNum = step.matchNumber;
  initGameRoles(matchNum);

  const matchRecord = pickState.pickedMatches[matchNum - 1];
  // Který tým hraje na BLUE SIDE (vlevo/dole) a který na RED SIDE (vpravo/nahoře):
  const blueSideTeam = matchRecord?.blueTeam || 'blue'; // 'blue' nebo 'red'
  const redSideTeam = matchRecord?.redTeam || 'red';   // 'blue' nebo 'red'

  const rolesData = pickState.gameRoles[matchNum];
  const blueRoles = rolesData.blue; // role pro Blue Side
  const redRoles = rolesData.red;   // role pro Red Side

  const blueRoster = getTeamRoster(blueSideTeam);
  const redRoster = getTeamRoster(redSideTeam);

  const assignedBlueIds = new Set(blueRoles.map(r => r.player?.id).filter(Boolean));
  const assignedRedIds = new Set(redRoles.map(r => r.player?.id).filter(Boolean));

  const unassignedBlue = blueRoster.filter(p => !assignedBlueIds.has(p.id));
  const unassignedRed = redRoster.filter(p => !assignedRedIds.has(p.id));

  const leftTeamName = blueSideTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM';
  const leftColClass = blueSideTeam === 'blue' ? 'team-blue-col' : 'team-red-col';

  const rightTeamName = redSideTeam === 'blue' ? 'MODRÝ TÝM' : 'ČERVENÝ TÝM';
  const rightColClass = redSideTeam === 'blue' ? 'team-blue-col' : 'team-red-col';

  container.innerHTML = `
    <div class="roles-workspace-wrapper">
      <div class="lol-map-roles-stage">
        <!-- LEVÝ SLOUPEČEK (Blue Side mapy) -->
        <div class="roles-team-column ${leftColClass}" id="colBlueSideDrop" data-side="blue" data-team="${blueSideTeam}">
          <div class="roles-team-col-header">
            <div class="roles-team-col-title">${leftTeamName}</div>
          </div>
          <div class="roles-team-pool" id="poolBlueSide">
            ${unassignedBlue.map(p => `
              <div class="player-draggable-tile tile-${blueSideTeam} ${selectedTile?.player?.id === p.id ? 'is-selected' : ''}"
                   draggable="true"
                   data-player-id="${p.id}"
                   data-team="${blueSideTeam}"
                   data-side="blue"
                   title="Klikněte nebo přetáhněte na mapu">
                <img src="${p.photo || 'assets/images/players/avatar-placeholder.png'}" alt="${p.name}" class="tile-player-photo" draggable="false">
                <div class="tile-player-name-banner">${p.name}</div>
              </div>
            `).join('')}
            ${unassignedBlue.length === 0 ? '<div class="roles-pool-empty-placeholder"></div>' : ''}
          </div>
        </div>

        <!-- VELKÁ MAPA S POZICEMI (střed) -->
        <div class="roles-map-board ${selectedTile ? `is-holding-player holding-side-${selectedTile.side}` : ''}" id="rolesMapBoard">
          <img src="${LOL_MAP_PATH}" alt="Summoner's Rift" class="roles-map-bg" draggable="false">

          ${MAP_ROLE_SLOTS.map(slot => {
    const slotSide = slot.side || slot.team;
    const rolesList = slotSide === 'blue' ? blueRoles : redRoles;
    const roleObj = rolesList.find(r => matchRoleId(r.roleId, slot.roleId));
    const assignedPlayer = roleObj ? roleObj.player : null;
    const slotTeam = slotSide === 'blue' ? blueSideTeam : redSideTeam;
    const isDropTarget = selectedTile && selectedTile.side === slotSide && !assignedPlayer;
    const isSelected = selectedTile && selectedTile.side === slotSide && selectedTile.player?.id === assignedPlayer?.id;
    const canSwap = selectedTile && selectedTile.side === slotSide && assignedPlayer && selectedTile.player?.id !== assignedPlayer.id;

    if (assignedPlayer) {
      return `
                <div class="map-role-slot is-filled slot-${slotTeam} ${isSelected ? 'is-selected' : ''} ${canSwap ? 'can-swap' : ''}"
                     style="left: ${slot.leftPercent}%; top: ${slot.topPercent}%;"
                     draggable="true"
                     data-side="${slotSide}"
                     data-team="${slotTeam}"
                     data-role-id="${slot.roleId}"
                     data-player-id="${assignedPlayer.id}"
                     title="${assignedPlayer.name} (kliknutím vyberte pro prohození nebo přetáhněte)">
                  <img src="${assignedPlayer.photo || 'assets/images/players/avatar-placeholder.png'}" alt="${assignedPlayer.name}" class="slot-player-photo" draggable="false">
                  <div class="slot-filled-name-banner">${assignedPlayer.name}</div>
                </div>
              `;
    } else {
      return `
                <div class="map-role-slot slot-side-${slotSide} ${isDropTarget ? 'is-drop-target' : ''}"
                     style="left: ${slot.leftPercent}%; top: ${slot.topPercent}%;"
                     data-side="${slotSide}"
                     data-team="${slotTeam}"
                     data-role-id="${slot.roleId}"
                     title="Pozice: ${slot.roleName}">
                  <div class="slot-empty-content">
                    <span class="slot-role-tag">${slot.roleCode}</span>
                  </div>
                </div>
              `;
    }
  }).join('')}
        </div>

        <!-- PRAVÝ SLOUPEČEK (Red Side mapy) -->
        <div class="roles-team-column ${rightColClass}" id="colRedSideDrop" data-side="red" data-team="${redSideTeam}">
          <div class="roles-team-col-header">
            <div class="roles-team-col-title">${rightTeamName}</div>
          </div>
          <div class="roles-team-pool" id="poolRedSide">
            ${unassignedRed.map(p => `
              <div class="player-draggable-tile tile-${redSideTeam} ${selectedTile?.player?.id === p.id ? 'is-selected' : ''}"
                   draggable="true"
                   data-player-id="${p.id}"
                   data-team="${redSideTeam}"
                   data-side="red"
                   title="Klikněte nebo přetáhněte na mapu">
                <img src="${p.photo || 'assets/images/players/avatar-placeholder.png'}" alt="${p.name}" class="tile-player-photo" draggable="false">
                <div class="tile-player-name-banner">${p.name}</div>
              </div>
            `).join('')}
            ${unassignedRed.length === 0 ? '<div class="roles-pool-empty-placeholder"></div>' : ''}
          </div>
        </div>
      </div>

      <!-- Tlačítko pro potvrzení -->
      <div class="roles-confirm-bar">
        <button class="confirm-roles-btn" id="confirmRolesBtn">
          <span>POTVRDIT ROLE PRO ${matchNum}. HRU</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Kliknutí na pozadí mapy odznačí vybranou kartu
  const mapBoardEl = document.getElementById('rolesMapBoard');
  mapBoardEl?.addEventListener('click', (e) => {
    if (e.target === mapBoardEl || e.target.classList.contains('roles-map-bg')) {
      if (selectedTile) {
        selectedTile = null;
        renderRoleAssigner(container, step);
      }
    }
  });

  // 1. Kliknutí na dlaždice v levém a pravém sloupečku
  container.querySelectorAll('.player-draggable-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const side = tile.dataset.side;
      const team = tile.dataset.team;
      const pId = tile.dataset.playerId;
      const roster = getTeamRoster(team);
      const player = roster.find(p => p.id === pId);

      if (selectedTile && selectedTile.player?.id === pId) {
        selectedTile = null;
      } else {
        selectedTile = { side, team, player, fromRoleId: null };
      }
      renderRoleAssigner(container, step);
    });

    tile.addEventListener('dragstart', (e) => {
      const side = tile.dataset.side;
      const team = tile.dataset.team;
      const pId = tile.dataset.playerId;
      e.dataTransfer.setData('text/plain', JSON.stringify({ side, team, playerId: pId, fromRoleId: null }));
      e.dataTransfer.effectAllowed = 'move';
      tile.classList.add('is-dragging');
      document.getElementById('rolesMapBoard')?.classList.add('is-dragging-active', `dragging-side-${side}`);
    });

    tile.addEventListener('dragend', () => {
      tile.classList.remove('is-dragging');
      document.getElementById('rolesMapBoard')?.classList.remove('is-dragging-active', 'dragging-side-blue', 'dragging-side-red');
    });
  });

  // 2. Kliknutí a drag-and-drop na sloty na mapě
  container.querySelectorAll('.map-role-slot').forEach(slot => {
    const slotSide = slot.dataset.side;
    const slotTeam = slot.dataset.team;
    const slotRoleId = slot.dataset.roleId;

    slot.addEventListener('click', () => {
      if (selectedTile) {
        // Kliknutí na již vybraný slot jej odznačí
        if (selectedTile.side === slotSide && selectedTile.fromRoleId && matchRoleId(selectedTile.fromRoleId, slotRoleId)) {
          selectedTile = null;
          renderRoleAssigner(container, step);
          return;
        }

        const playerSide = selectedTile.side || (selectedTile.team === blueSideTeam ? 'blue' : 'red');

        // Pokud klikneme na soupeřovu stranu mapy:
        if (slotSide !== playerSide) {
          if (slot.classList.contains('is-filled')) {
            // Přepneme výběr na tohoto soupeřova hráče
            const pId = slot.dataset.playerId;
            const roster = getTeamRoster(slotTeam);
            const player = roster.find(p => p.id === pId);
            selectedTile = { side: slotSide, team: slotTeam, player, fromRoleId: slotRoleId };
            renderRoleAssigner(container, step);
          }
          return;
        }

        // Stejná strana mapy (vlastní tým):
        const targetSide = playerSide;
        const targetList = pickState.gameRoles[matchNum][targetSide];
        const targetRole = targetList ? targetList.find(r => matchRoleId(r.roleId, slotRoleId)) : null;

        if (targetRole) {
          if (selectedTile.fromRoleId) {
            // Prohození dvou hráčů v rámci týmu
            const sourceRole = targetList.find(r => matchRoleId(r.roleId, selectedTile.fromRoleId));
            const existingTarget = targetRole.player;
            targetRole.player = selectedTile.player;
            if (sourceRole) sourceRole.player = existingTarget;
          } else {
            targetList.forEach(r => {
              if (r.player && r.player.id === selectedTile.player.id) {
                r.player = null;
              }
            });
            targetRole.player = selectedTile.player;
          }

          selectedTile = null;
          saveState();
          renderRoleAssigner(container, step);
          return;
        }
      } else if (slot.classList.contains('is-filled')) {
        const pId = slot.dataset.playerId;
        const roster = getTeamRoster(slotTeam);
        const player = roster.find(p => p.id === pId);
        selectedTile = { side: slotSide, team: slotTeam, player, fromRoleId: slotRoleId };
        renderRoleAssigner(container, step);
      }
    });

    // Dvojklik pro rychlé vrácení hráče z mapy do sloupečku
    slot.addEventListener('dblclick', () => {
      if (slot.classList.contains('is-filled')) {
        const targetRole = pickState.gameRoles[matchNum][slotSide].find(r => matchRoleId(r.roleId, slotRoleId));
        if (targetRole) targetRole.player = null;
        selectedTile = null;
        saveState();
        renderRoleAssigner(container, step);
      }
    });

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('is-drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('is-drag-over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('is-drag-over');
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !data.playerId) return;

        // Inteligentní určení strany hráče — drop funguje spolehlivě na jakékoliv políčko dané role
        const playerSide = data.side || (data.team === blueSideTeam ? 'blue' : 'red');
        if (slotSide !== playerSide) {
          // Nelze přetáhnout hráče na soupeřovu stranu mapy
          return;
        }
        const targetSide = playerSide;
        const playerTeam = targetSide === 'blue' ? blueSideTeam : redSideTeam;

        const roster = getTeamRoster(playerTeam);
        const player = roster.find(p => p.id === data.playerId);
        if (!player) return;

        const targetList = pickState.gameRoles[matchNum][targetSide];
        const targetRole = targetList ? targetList.find(r => matchRoleId(r.roleId, slotRoleId)) : null;
        if (!targetRole) return;

        if (data.fromRoleId) {
          const sourceRole = targetList.find(r => matchRoleId(r.roleId, data.fromRoleId));
          const existingTarget = targetRole.player;
          targetRole.player = player;
          if (sourceRole) sourceRole.player = existingTarget;
        } else {
          // Uvolníme hráče z jiné pozice, pokud už byl na mapě přiřazen
          targetList.forEach(r => {
            if (r.player && r.player.id === player.id) {
              r.player = null;
            }
          });
          targetRole.player = player;
        }

        selectedTile = null;
        saveState();
        renderRoleAssigner(container, step);
      } catch (err) {
        console.error('Chyba při dropu:', err);
      }
    });

    if (slot.classList.contains('is-filled')) {
      slot.addEventListener('dragstart', (e) => {
        const pId = slot.dataset.playerId;
        e.dataTransfer.setData('text/plain', JSON.stringify({ side: slotSide, team: slotTeam, playerId: pId, fromRoleId: slotRoleId }));
        e.dataTransfer.effectAllowed = 'move';
        slot.classList.add('is-dragging');
        document.getElementById('rolesMapBoard')?.classList.add('is-dragging-active', `dragging-side-${slotSide}`);
      });

      slot.addEventListener('dragend', () => {
        slot.classList.remove('is-dragging');
        document.getElementById('rolesMapBoard')?.classList.remove('is-dragging-active', 'dragging-side-blue', 'dragging-side-red');
      });
    }
  });

  // 3. Drop nebo klik zpět do týmového sloupečku (vrácení hráče z mapy)
  [
    { side: 'blue', colId: 'colBlueSideDrop' },
    { side: 'red', colId: 'colRedSideDrop' },
  ].forEach(({ side, colId }) => {
    const colEl = document.getElementById(colId);
    if (!colEl) return;

    colEl.addEventListener('click', (e) => {
      if (e.target.closest('.player-draggable-tile')) return;
      if (selectedTile && selectedTile.side === side && selectedTile.fromRoleId) {
        const targetRole = pickState.gameRoles[matchNum][side].find(r => matchRoleId(r.roleId, selectedTile.fromRoleId));
        if (targetRole) targetRole.player = null;
        selectedTile = null;
        saveState();
        renderRoleAssigner(container, step);
      }
    });

    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    colEl.addEventListener('drop', (e) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data && data.side === side && data.fromRoleId) {
          const targetRole = pickState.gameRoles[matchNum][side].find(r => matchRoleId(r.roleId, data.fromRoleId));
          if (targetRole) targetRole.player = null;
          selectedTile = null;
          saveState();
          renderRoleAssigner(container, step);
        }
      } catch (err) { /* ignore */ }
    });
  });

  // 4. Potvrzení rolí a přesun na score.html
  document.getElementById('confirmRolesBtn')?.addEventListener('click', () => {
    autoFillRemainingRoles(matchNum);

    pickState.stepResults[pickState.currentStepIndex] = {
      rolesConfirmed: true,
      matchNumber: matchNum,
      roles: pickState.gameRoles[matchNum],
    };

    selectedTile = null;
    pickState.currentStepIndex++;

    if (pickState.currentStepIndex >= PICK_SEQUENCE.length) {
      pickState.isCompleted = true;
    }

    saveState();
    if (window.LankaRouter) {
      window.LankaRouter.navigateTo('score');
    } else {
      window.location.href = getScoreUrl();
    }
  });
}

// ---------------------------------------------------------------------
// KROK: DOKONČENO — ŽÁDNÉ ZBYTEČNÉ SHRNUTÍ, POUZE PŘESMĚROVÁNÍ NA SKÓRE
// ---------------------------------------------------------------------
function renderSummaryView(container) {
  container.className = 'workspace-column';
  container.innerHTML = `
    <div class="workspace-header">
      <h2 class="workspace-title">VOLBA STRAN A ROZHOZENÍ ROLÍ DOKONČENO</h2>
      <div style="display: flex; gap: 1.2rem; margin-top: 2rem; justify-content: center;">
        <a href="${getScoreUrl()}" class="summary-go-score-btn" id="summaryGoScoreBtn" style="margin: 0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>PŘEJÍT NA TURNAJOVÉ SKÓRE</span>
        </a>
      </div>
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

  window.LankaPickModules.lol = {
    id: 'lol',
    name: 'League of Legends',
    mount() {
      loadState();
      syncWithTournamentScore();
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
      if (silent || confirm('Opravdu chcete resetovat volbu stran a rozhození rolí pro League of Legends a začít znovu?')) {
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
        window.LankaMusic.playGame('lol');
      }
      window.LankaPickModules.lol.mount();
      document.getElementById('resetPickBtn')?.addEventListener('click', () => {
        window.LankaPickModules.lol.reset();
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
