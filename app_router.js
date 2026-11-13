// =====================================================================
// LANKA 2027 — SINGLE PAGE APPLICATION ROUTER & VIEW CONTROLLER
// =====================================================================

(function(window) {
  'use strict';

  window.LankaSPA = true;
  window.LankaPickModules = window.LankaPickModules || {};

  const VALID_GAMES = ['cs2', 'warcraft', 'lol', 'overwatch', 'wreckfest'];

  class AppRouter {
    constructor() {
      this.currentView = 'score';
      this.activeGameId = null;
      this.activeModule = null;
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
        if (href.startsWith('score.html') || href === '#score') {
          e.preventDefault();
          this.navigateTo('score');
        }
      });

      // 3. Tlačítko Reset picku v horní liště
      document.getElementById('resetPickBtn')?.addEventListener('click', () => {
        if (this.activeModule && typeof this.activeModule.reset === 'function') {
          this.activeModule.reset();
        }
      });

      // 4. Tlačítko Zpět na skóre v horní liště
      document.getElementById('headerScoreBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('score');
      });

      // 5. Úvodní spuštění routeru
      this.handleHashChange();
    }

    handleHashChange() {
      let hash = (window.location.hash || '').replace(/^#/, '').trim();
      let gameParam = hash.split('?')[0];

      if (!gameParam || gameParam === 'score') {
        this.navigateTo('score');
      } else if (VALID_GAMES.includes(gameParam)) {
        this.navigateTo(gameParam);
      } else {
        this.navigateTo('score');
      }
    }

    navigateTo(target) {
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

        document.body.classList.remove('in-pick-view');
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

        // Spuštění hudby pro danou hru (plynulý přechod bez resetu audio elementu)
        if (window.LankaMusic) {
          window.LankaMusic.playGame(target);
        }

        // Namountování modulu zvolené hry
        if (this.activeModule && typeof this.activeModule.mount === 'function') {
          try {
            this.activeModule.mount();
          } catch (e) {
            console.error(`Chyba při mountování modulu ${target}:`, e);
          }
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
