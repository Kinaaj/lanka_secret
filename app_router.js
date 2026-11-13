// =====================================================================
// LANKA 2027 — SINGLE PAGE APPLICATION ROUTER & VIEW CONTROLLER
// =====================================================================

(function(window) {
  'use strict';

  window.LankaSPA = true;
  window.LankaPickModules = window.LankaPickModules || {};

  const VALID_GAMES = ['cs2', 'warcraft', 'lol', 'overwatch', 'wreckfest'];

  const GAME_TITLES = {
    score: 'PŘEHLED SKÓRE',
    cs2: 'COUNTER-STRIKE 2',
    warcraft: 'WARCRAFT III',
    lol: 'LEAGUE OF LEGENDS',
    overwatch: 'OVERWATCH 2',
    wreckfest: 'WRECKFEST'
  };

  class AppRouter {
    constructor() {
      this.currentView = 'score';
      this.activeGameId = null;
      this.activeModule = null;
      this.isTransitioning = false;
      this.isInitialLoad = true;
    }

    init() {
      // 1. Zpracování odkazu z URL hashe (např. #cs2, #warcraft, #score)
      window.addEventListener('hashchange', () => {
        this.handleHashChange();
      });

      // 2. Intercept všech odkazů na score.html (např. tlačítka "Přejít na skóre" ze summary obrazovek)
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        if (href.startsWith('score.html') || href === '#score' || href.includes('score.html')) {
          e.preventDefault();
          // Pokud odkaz nese synchronizační parametry (?pick_cs2=... nebo ?reset_cs2=...)
          if (href.includes('?')) {
            try {
              const url = new URL(href, window.location.href);
              for (const [key, value] of url.searchParams.entries()) {
                if (key.startsWith('pick_')) {
                  const gameId = key.replace('pick_', '');
                  localStorage.setItem(`lanka_pick_${gameId}`, decodeURIComponent(value));
                } else if (key.startsWith('reset_')) {
                  const gameId = key.replace('reset_', '');
                  localStorage.removeItem(`lanka_pick_${gameId}`);
                }
              }
            } catch (err) {
              console.warn('Nelze parsovat query parametry z odkazu:', err);
            }
          }
          this.transitionTo('score');
        }
      });

      // 3. Tlačítko Zpět na skóre v horní liště
      document.getElementById('headerScoreBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.transitionTo('score');
      });

      // 4. Inicializace rozbalovacího menu (dropdown) vpravo nahoře
      this.initDropdownMenu();

      // 5. Inicializace potvrzovacího modalu pro celkový reset
      this.initResetModal();

      // 6. Úvodní spuštění routeru
      this.handleHashChange();
      this.isInitialLoad = false;
    }

    initDropdownMenu() {
      const menuBtn = document.getElementById('hudMenuToggleBtn');
      const menu = document.getElementById('hudDropdownMenu');
      const wrap = document.getElementById('hudDropdownWrap');

      if (!menuBtn || !menu) return;

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menu.style.display === 'none';
        menu.style.display = isHidden ? 'flex' : 'none';
        menuBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      });

      // Zavření menu při kliknutí mimo
      document.addEventListener('click', (e) => {
        if (wrap && !wrap.contains(e.target)) {
          menu.style.display = 'none';
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Položka: VS Úvodní obrazovka
      document.getElementById('dropdownIntroBtn')?.addEventListener('click', () => {
        menu.style.display = 'none';
        menuBtn.setAttribute('aria-expanded', 'false');
        if (typeof window.showIntroScreen === 'function') {
          window.showIntroScreen();
        } else {
          document.body.classList.add('intro-mode');
        }
      });

      // Položka: Fullscreen
      document.getElementById('dropdownFullscreenBtn')?.addEventListener('click', () => {
        menu.style.display = 'none';
        menuBtn.setAttribute('aria-expanded', 'false');
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      // Položka: Reset aktuálního picku
      document.getElementById('dropdownResetPickBtn')?.addEventListener('click', () => {
        menu.style.display = 'none';
        menuBtn.setAttribute('aria-expanded', 'false');
        if (this.activeModule && typeof this.activeModule.reset === 'function') {
          this.activeModule.reset();
        }
      });

      // Položka: Celkový reset turnaje
      document.getElementById('dropdownResetAllBtn')?.addEventListener('click', () => {
        menu.style.display = 'none';
        menuBtn.setAttribute('aria-expanded', 'false');
        this.showResetModal();
      });
    }

    initResetModal() {
      document.getElementById('resetModalCancelBtn')?.addEventListener('click', () => {
        this.hideResetModal();
      });

      document.getElementById('resetModalConfirmBtn')?.addEventListener('click', () => {
        this.executeFullReset();
      });

      document.getElementById('resetConfirmModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'resetConfirmModal') {
          this.hideResetModal();
        }
      });
    }

    showResetModal() {
      const modal = document.getElementById('resetConfirmModal');
      if (modal) modal.style.display = 'flex';
    }

    hideResetModal() {
      const modal = document.getElementById('resetConfirmModal');
      if (modal) modal.style.display = 'none';
    }

    executeFullReset() {
      this.hideResetModal();

      // 1. Reset turnajových bodů
      if (typeof window.resetTournamentScores === 'function') {
        window.resetTournamentScores();
      } else {
        try {
          localStorage.removeItem('lanka_tournament_score');
        } catch (e) {}
      }

      // 2. Kompletní smazání všech uložených draftů map a rolí
      const games = ['cs2', 'warcraft', 'lol', 'overwatch', 'wreckfest'];
      games.forEach(g => {
        localStorage.removeItem(`lanka_pick_${g}`);
        localStorage.removeItem(`lanka_saved_pick_${g}`);
      });

      // 3. Reset in-memory modulů
      if (window.LankaPickModules) {
        Object.values(window.LankaPickModules).forEach(mod => {
          if (mod && typeof mod.reset === 'function') {
            try { mod.reset(); } catch (e) {}
          }
        });
      }

      // 4. Znovuvykreslení tabulky a načtení výchozích týmů
      if (typeof window.buildTable === 'function') window.buildTable();
      if (typeof window.updateTournamentWinner === 'function') window.updateTournamentWinner();
      if (typeof window.loadTeamsFromDraft === 'function') window.loadTeamsFromDraft();

      // 5. Návrat na přehled skóre
      this.transitionTo('score');
    }

    handleHashChange() {
      let hash = (window.location.hash || '').replace(/^#/, '').trim();
      let gameParam = hash.split('?')[0];

      const target = (!gameParam || gameParam === 'score') ? 'score' : (VALID_GAMES.includes(gameParam) ? gameParam : 'score');

      if (this.isInitialLoad) {
        this.navigateTo(target);
      } else {
        this.transitionTo(target);
      }
    }

    /**
     * Animovaný přechod mezi hrami / skóre ve stylu zatahujících se závěsů
     * @param {string} target - 'score' | 'cs2' | 'warcraft' | 'lol' | 'overwatch' | 'wreckfest'
     */
    transitionTo(target) {
      if (this.isTransitioning) return;

      const current = this.currentView === 'pick' ? this.activeGameId : 'score';
      if (current === target) return;

      this.isTransitioning = true;

      const overlay = document.getElementById('curtainOverlay');
      const badge = document.getElementById('curtainGameBadge');

      if (badge) {
        badge.textContent = GAME_TITLES[target] || target.toUpperCase();
      }

      // Náhodně zvolíme, zda se v překryvu dostane modrá přes červenou, nebo červená přes modrou
      const blueOverRed = Math.random() < 0.5;
      if (overlay) {
        overlay.classList.toggle('blue-over-red', blueOverRed);
        overlay.classList.toggle('red-over-blue', !blueOverRed);
        overlay.classList.remove('is-closed');
        overlay.classList.add('is-active', 'is-closing');
      }

      // 1. FÁZE: Zatahování závěsů k sobě do středu (~650 ms)
      setTimeout(() => {
        if (overlay) {
          overlay.classList.remove('is-closing');
          overlay.classList.add('is-closed');
        }

        // 2. FÁZE: Přepnutí DOM pohledu (probíhá skryté za zataženými závěsy)
        this.navigateTo(target);

        // Hudba pro danou hru začne hrát až v momentě, kdy se závěsy zatáhnou!
        if (target !== 'score' && window.LankaMusic) {
          window.LankaMusic.playGame(target);
        }

        // Krátká dramatická pauza v zataženém stavu (350 ms)
        setTimeout(() => {
          if (overlay) {
            overlay.classList.remove('is-closed');
          }

          // 3. FÁZE: Roztahování závěsů od sebe (~650 ms)
          setTimeout(() => {
            if (overlay) {
              overlay.classList.remove('is-active');
            }
            this.isTransitioning = false;
          }, 650);
        }, 350);
      }, 650);
    }

    navigateTo(target) {
      // Aktualizace položek v dropdown menu
      const dropResetPick = document.getElementById('dropdownResetPickBtn');

      if (target === 'score') {
        // --- NÁVRAT NA OBRAZOVKU SKÓRE ---
        if (this.activeModule && typeof this.activeModule.unmount === 'function') {
          try {
            this.activeModule.unmount();
          } catch (e) {
            console.error('Chyba při unmountování modulu:', e);
          }
        }

        this.activeModule = null;
        this.activeGameId = null;
        this.currentView = 'score';

        document.body.classList.remove('in-pick-view', 'turn-active-blue', 'turn-active-red');
        delete document.body.dataset.game;
        document.body.dataset.view = 'score';

        const viewScore = document.getElementById('viewScore');
        const viewPick = document.getElementById('viewPick');
        if (viewScore) viewScore.style.display = 'flex';
        if (viewPick) viewPick.style.display = 'none';

        const turnDisplay = document.getElementById('topTurnDisplay');
        if (turnDisplay) {
          turnDisplay.className = 'top-turn-display is-hidden';
          turnDisplay.innerHTML = '';
        }

        if (dropResetPick) {
          dropResetPick.style.display = 'none';
        }

        // Znovu vykreslíme turnajovou tabulku s aktuálními daty picků
        if (typeof window.buildTable === 'function') {
          window.buildTable();
        }
        if (typeof window.loadTeamsFromDraft === 'function') {
          window.loadTeamsFromDraft();
        }

        if (window.location.hash !== '#score' && window.location.hash !== '') {
          history.replaceState(null, '', '#score');
        }
      } else {
        // --- PŘEPNUTÍ DO PICKU DANÉ HRY ---
        if (this.activeModule && this.activeGameId !== target && typeof this.activeModule.unmount === 'function') {
          try {
            this.activeModule.unmount();
          } catch (e) {
            console.error('Chyba při unmountování modulu:', e);
          }
        }

        this.currentView = 'pick';
        this.activeGameId = target;
        this.activeModule = window.LankaPickModules[target];

        document.body.classList.remove('intro-mode', 'intro-leaving');
        document.body.classList.add('in-pick-view');
        document.body.dataset.game = target;
        document.body.dataset.view = 'pick';

        const viewScore = document.getElementById('viewScore');
        const viewPick = document.getElementById('viewPick');
        if (viewScore) viewScore.style.display = 'none';
        if (viewPick) viewPick.style.display = 'flex';

        if (dropResetPick) {
          dropResetPick.style.display = 'flex';
        }

        // Namountování modulu zvolené hry
        if (this.activeModule && typeof this.activeModule.mount === 'function') {
          try {
            this.activeModule.mount();
          } catch (e) {
            console.error(`Chyba při mountování modulu ${target}:`, e);
          }
        }

        // Pokud to byl úvodní přímý přístup (bez transitionTo), spustíme hudbu ihned
        if (this.isInitialLoad && window.LankaMusic) {
          window.LankaMusic.playGame(target);
        }

        if (window.location.hash !== '#' + target) {
          history.replaceState(null, '', '#' + target);
        }
      }
    }
  }

  window.LankaRouter = new AppRouter();

  // Spuštění inicializace
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.LankaRouter.init());
  } else {
    window.LankaRouter.init();
  }
})(window);
