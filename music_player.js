// =====================================================================
// LANKA 2027 — HUDEBNÍ PŘEHRÁVAČ PRO TURNAJ
// =====================================================================

(function (window) {
  'use strict';

  // Seznam skladeb pro jednotlivé hry (přehrávají se v tomto pořadí a v loopu)
  const GAME_PLAYLISTS = {
    cs2: [
      {
        title: 'Counter-Strike: Global Offensive — Main Theme Extended',
        src: 'assets/audio/cs2/Counter-Strike： Global Offensive - Main Menu Music Theme Extended.mp3'
      }
    ],
    warcraft: [
      {
        title: 'Ramin Djawadi — Warcraft Theme Extended',
        src: 'assets/audio/warcraft/Ramin Djawadi： Warcraft Theme [Extended by Gilles Nuytens].mp3'
      },
      {
        title: 'Warcraft OST — The Horde (Movie Intro)',
        src: 'assets/audio/warcraft/Warcraft OST - The Horde (Movie Intro Theme).mp3'
      },
      {
        title: 'World of Warcraft — Login Music',
        src: 'assets/audio/warcraft/World of Warcraft Login Music.mp3'
      }
    ],
    lol: [
      {
        title: 'Warriors (ft. Imagine Dragons) — Worlds 2014',
        src: 'assets/audio/lol/Warriors (ft. Imagine Dragons) ｜ Worlds 2014 - League of Legends.mp3'
      },
      {
        title: 'Worlds Collide (ft. Nicki Taylor) — Worlds 2015',
        src: 'assets/audio/lol/Worlds Collide (ft. Nicki Taylor) ｜ Worlds 2015 - League of Legends.mp3'
      },
      {
        title: 'Legends Never Die — Worlds 2017',
        src: 'assets/audio/lol/Legends Never Die (ft. Against The Current) [OFFICIAL AUDIO] ｜ Worlds 2017 - League of Legends.mp3'
      },
      {
        title: 'RISE — Worlds 2018',
        src: 'assets/audio/lol/RISE (ft. The Glitch Mob, Mako, and The Word Alive) ｜ Worlds 2018 - League of Legends.mp3'
      },
      {
        title: 'Phoenix — Worlds 2019',
        src: 'assets/audio/lol/Phoenix (ft. Cailin Russo and Chrissy Costanza) ｜ Worlds 2019 - League of Legends.mp3'
      },
      {
        title: 'Burn It All Down (ft. PVRIS) — Worlds 2021',
        src: 'assets/audio/lol/Burn It All Down (ft. PVRIS) ｜ Worlds 2021 - League of Legends.mp3'
      }
    ],
    overwatch: [
      {
        title: 'Overwatch 2 — Main Theme & Soundtrack',
        src: 'assets/audio/overwatch/Overwatch 2 Main Theme ｜ Trailer Music ｜ Original Soundtrack.mp3'
      }
    ],
    wreckfest: [
      {
        title: 'Studiodamas — Messier77 (Wreckfest OST)',
        src: 'assets/audio/wreckfest/Studiodamas - Messier77 (Wreckfest Original Soundtrack).mp3'
      }
    ]
  };

  class LankaMusicPlayer {
    constructor() {
      this.audio = new Audio();
      this.currentGameId = null;
      this.currentTrackIndex = 0;
      this.isPlaying = false;
      this.listeners = [];

      // Načtení hlasitosti: defaultně 40 % (0.4)
      const savedVol = localStorage.getItem('lanka_music_volume');
      this.volume = savedVol !== null ? parseFloat(savedVol) : 0.4;
      if (isNaN(this.volume) || this.volume < 0 || this.volume > 1) {
        this.volume = 0.4;
      }
      this.isMuted = localStorage.getItem('lanka_music_muted') === 'true';

      this.audio.volume = this.isMuted ? 0 : this.volume;

      // Automatický loop na další skladbu v pořadí
      this.audio.addEventListener('ended', () => {
        this.playNext();
      });

      this.audio.addEventListener('error', (err) => {
        console.warn('LankaMusic: Chyba při přehrávání skladby:', err);
      });

      // Synchronizace hlasitosti mezi záložkami
      window.addEventListener('storage', (e) => {
        if (e.key === 'lanka_music_volume' && e.newValue !== null) {
          const newVol = parseFloat(e.newValue);
          if (!isNaN(newVol)) {
            this.volume = newVol;
            if (!this.isMuted) this.audio.volume = newVol;
            this.notifyState();
          }
        } else if (e.key === 'lanka_music_muted') {
          this.isMuted = e.newValue === 'true';
          this.audio.volume = this.isMuted ? 0 : this.volume;
          this.notifyState();
        }
      });

      // Pokračování v přehrávání při návratu na stránku / reloadu (pokud hudba hrála)
      try {
        const wasPlaying = sessionStorage.getItem('lanka_music_playing') === 'true' || localStorage.getItem('lanka_music_playing') === 'true';
        const lastGame = sessionStorage.getItem('lanka_active_music_game') || localStorage.getItem('lanka_active_music_game');
        if (wasPlaying && lastGame && GAME_PLAYLISTS[lastGame]) {
          this.playGame(lastGame);
        }
      } catch (e) { }
    }

    /**
     * Spustí přehrávání playlistu pro danou hru
     * @param {string} gameId - 'cs2' | 'warcraft' | 'lol' | 'overwatch' | 'wreckfest'
     * @param {number} [trackIndex=0]
     */
    playGame(gameId, trackIndex = 0) {
      if (!GAME_PLAYLISTS[gameId] || GAME_PLAYLISTS[gameId].length === 0) {
        console.warn(`LankaMusic: Pro hru '${gameId}' nebyly nalezeny žádné skladby.`);
        return;
      }

      // Pokud tato hra již hraje a nepožadujeme jiný konkrétní index, necháme ji hrát
      if (this.currentGameId === gameId && this.isPlaying && trackIndex === 0) {
        return;
      }

      this.currentGameId = gameId;
      localStorage.setItem('lanka_active_music_game', gameId);
      sessionStorage.setItem('lanka_active_music_game', gameId);

      const playlist = GAME_PLAYLISTS[gameId];
      this.currentTrackIndex = (trackIndex >= 0 && trackIndex < playlist.length) ? trackIndex : 0;
      this.loadAndPlayCurrent();
    }

    loadAndPlayCurrent() {
      const playlist = GAME_PLAYLISTS[this.currentGameId];
      if (!playlist || playlist.length === 0) return;

      const track = playlist[this.currentTrackIndex];
      if (!track) return;

      this.audio.src = encodeURI(track.src);
      this.audio.volume = this.isMuted ? 0 : this.volume;

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
          sessionStorage.setItem('lanka_music_playing', 'true');
          this.notifyState();
        }).catch((err) => {
          console.log('LankaMusic: Autoplay čeká na interakci uživatele:', err.message);
          this.isPlaying = false;
          this.notifyState();

          // Automatické spuštění při prvním kliknutí kamkoliv na stránku
          const unlockAudio = () => {
            this.audio.play().then(() => {
              this.isPlaying = true;
              sessionStorage.setItem('lanka_music_playing', 'true');
              this.notifyState();
            }).catch(() => { });
            document.removeEventListener('pointerdown', unlockAudio);
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
          };
          document.addEventListener('pointerdown', unlockAudio, { once: true });
          document.addEventListener('click', unlockAudio, { once: true });
          document.addEventListener('keydown', unlockAudio, { once: true });
        });
      }
    }

    playNext() {
      const playlist = GAME_PLAYLISTS[this.currentGameId];
      if (!playlist || playlist.length === 0) return;

      // Po poslední skladbě začne hrát od 0 (nekonečný loop celého playlistu)
      this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.length;
      this.loadAndPlayCurrent();
    }

    playPrev() {
      const playlist = GAME_PLAYLISTS[this.currentGameId];
      if (!playlist || playlist.length === 0) return;

      this.currentTrackIndex = (this.currentTrackIndex - 1 + playlist.length) % playlist.length;
      this.loadAndPlayCurrent();
    }

    togglePlay() {
      if (this.isPlaying) {
        this.stop();
      } else {
        if (!this.currentGameId) {
          const savedGame = sessionStorage.getItem('lanka_active_music_game') || localStorage.getItem('lanka_active_music_game') || 'cs2';
          this.playGame(savedGame);
        } else {
          this.audio.play().then(() => {
            this.isPlaying = true;
            sessionStorage.setItem('lanka_music_playing', 'true');
            this.notifyState();
          }).catch(() => { });
        }
      }
    }

    stop() {
      this.audio.pause();
      this.isPlaying = false;
      sessionStorage.setItem('lanka_music_playing', 'false');
      this.notifyState();
    }

    setVolume(val) {
      val = Math.max(0, Math.min(1, parseFloat(val)));
      this.volume = val;
      localStorage.setItem('lanka_music_volume', val.toString());
      if (!this.isMuted) {
        this.audio.volume = val;
      }
      this.notifyState();
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('lanka_music_muted', this.isMuted ? 'true' : 'false');
      this.audio.volume = this.isMuted ? 0 : this.volume;
      this.notifyState();
    }

    getCurrentTrack() {
      if (!this.currentGameId || !GAME_PLAYLISTS[this.currentGameId]) return null;
      return GAME_PLAYLISTS[this.currentGameId][this.currentTrackIndex] || null;
    }

    getState() {
      return {
        gameId: this.currentGameId,
        trackIndex: this.currentTrackIndex,
        track: this.getCurrentTrack(),
        isPlaying: this.isPlaying,
        volume: this.volume,
        isMuted: this.isMuted,
        playlists: GAME_PLAYLISTS
      };
    }

    subscribe(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    }

    notifyState() {
      const state = this.getState();
      this.listeners.forEach(cb => {
        try { cb(state); } catch (e) { console.error(e); }
      });
    }

    /**
     * Propojí prvky uživatelského rozhraní s přehrávačem
     */
    bindUI(options = {}) {
      if (this.uiBound && !options.force) {
        this.notifyState();
        return;
      }
      this.uiBound = true;

      const toggleBtn = options.toggleBtn || document.getElementById('musicToggleBtn');
      const muteBtn = options.muteBtn || document.getElementById('musicMuteBtn');
      const slider = options.slider || document.getElementById('musicVolumeSlider');
      const valLabel = options.valLabel || document.getElementById('musicVolumeVal');
      const gameSelect = options.gameSelect || document.getElementById('musicGameSelect');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          this.togglePlay();
        });
      }

      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          this.toggleMute();
        });
      }

      if (slider) {
        slider.value = Math.round(this.volume * 100);
        slider.addEventListener('input', (e) => {
          const pct = parseInt(e.target.value, 10);
          this.setVolume(pct / 100);
          if (this.isMuted) this.toggleMute();
        });
      }

      if (gameSelect) {
        gameSelect.addEventListener('change', (e) => {
          const selected = e.target.value;
          if (selected) {
            this.playGame(selected);
          }
        });
      }

      // Aktualizace vzhledu při změně stavu
      this.subscribe((state) => {
        if (toggleBtn) {
          toggleBtn.classList.toggle('is-playing', state.isPlaying);
          const iconPlaying = toggleBtn.querySelector('.music-icon-playing');
          const iconPaused = toggleBtn.querySelector('.music-icon-paused');
          const label = toggleBtn.querySelector('.music-btn-label');
          if (iconPlaying) iconPlaying.style.display = state.isPlaying ? 'inline-block' : 'none';
          if (iconPaused) iconPaused.style.display = state.isPlaying ? 'none' : 'inline-block';
          if (label) label.textContent = state.isPlaying ? 'STOP' : 'HUDBA';
        }

        if (slider) {
          slider.value = Math.round(state.volume * 100);
        }

        if (valLabel) {
          valLabel.textContent = `${Math.round(state.volume * 100)}%`;
        }

        if (muteBtn) {
          const iconOn = muteBtn.querySelector('.vol-icon-on');
          const iconMute = muteBtn.querySelector('.vol-icon-mute');
          if (iconOn) iconOn.style.display = state.isMuted ? 'none' : 'inline-block';
          if (iconMute) iconMute.style.display = state.isMuted ? 'inline-block' : 'none';
        }


        if (gameSelect && state.gameId) {
          gameSelect.value = state.gameId;
        }
      });

      // Vyvoláme úvodní nastavení
      this.notifyState();
    }
  }

  // Globální singleton hudebního přehrávače
  window.LankaMusic = new LankaMusicPlayer();

  // =====================================================================
  // LANKA 2027 — ŠUM DO POZADÍ (WHITE / AMBIENT NOISE LOOP)
  // =====================================================================
  class LankaNoisePlayer {
    constructor() {
      this.audio = new Audio();
      this.audio.loop = true;
      this.isPlaying = false;
      this.volume = 0.75;
      this.audio.volume = this.volume;
      this.uiBound = false;
      this.listeners = [];

      // Cesty k souboru (zkusí postupně assets/audio/noise.mp3, assets/audio/sum.mp3, assets/noise.mp3)
      this.sources = [
        'assets/audio/noise.mp3',
        'assets/audio/sum.mp3',
        'assets/noise.mp3',
        'assets/sum.mp3'
      ];
      this.currentSrcIndex = 0;
      this.audio.src = this.sources[0];

      this.audio.addEventListener('error', () => {
        if (this.currentSrcIndex < this.sources.length - 1) {
          this.currentSrcIndex++;
          this.audio.src = this.sources[this.currentSrcIndex];
          if (this.isPlaying) {
            this.audio.play().catch(() => {});
          }
        } else {
          console.warn('LankaNoise: Soubor pro šum zatím nebyl nalezen. Nahrajte prosím soubor noise.mp3 do složky assets/audio/.');
          this.isPlaying = false;
          this.notifyState();
        }
      });

      // Obnovení stavu po obnovení stránky
      const wasPlaying = localStorage.getItem('lanka_noise_playing') === 'true';
      if (wasPlaying) {
        this.start();
      }
    }

    toggle() {
      if (this.isPlaying) {
        this.stop();
      } else {
        this.start();
      }
    }

    start() {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
          localStorage.setItem('lanka_noise_playing', 'true');
          this.notifyState();
        }).catch((err) => {
          console.log('LankaNoise: Čeká na první interakci uživatele se stránkou:', err.message);
          const unlock = () => {
            this.audio.play().then(() => {
              this.isPlaying = true;
              localStorage.setItem('lanka_noise_playing', 'true');
              this.notifyState();
            }).catch(() => {});
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('click', unlock);
          };
          document.addEventListener('pointerdown', unlock, { once: true });
          document.addEventListener('click', unlock, { once: true });
        });
      }
    }

    stop() {
      this.audio.pause();
      this.isPlaying = false;
      localStorage.setItem('lanka_noise_playing', 'false');
      this.notifyState();
    }

    notifyState() {
      this.listeners.forEach((cb) => {
        try { cb(this.isPlaying); } catch (e) { console.error(e); }
      });
    }

    subscribe(cb) {
      if (typeof cb === 'function') {
        this.listeners.push(cb);
        try { cb(this.isPlaying); } catch (e) {}
      }
    }

    bindUI(btnId = 'noiseToggleBtn') {
      if (this.uiBound) return;
      const btn = document.getElementById(btnId);
      if (!btn) return;
      this.uiBound = true;

      btn.addEventListener('click', () => {
        this.toggle();
      });

      this.subscribe((isPlaying) => {
        btn.classList.toggle('is-playing', isPlaying);
        btn.classList.toggle('btn-active', isPlaying);
        const label = btn.querySelector('.noise-btn-label');
        if (label) {
          label.textContent = isPlaying ? 'ŠUM: ZAP' : 'ŠUM';
        }
      });
    }
  }

  window.LankaNoise = new LankaNoisePlayer();

  // =====================================================================
  // LANKA 2027 — ZVUKOVÝ EFEKT KLIKNUTÍ (CLICK SFX POOL)
  // =====================================================================
  class LankaSoundEffects {
    constructor() {
      this.poolSize = 6;
      this.pool = [];
      this.poolIndex = 0;
      this.lastPlayTime = 0;
      this.debounceMs = 35; // Minimální interval pro zabránění zdvojeného zvuku při bublání

      const soundSrc = 'assets/click.mp3';

      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio(soundSrc);
        audio.preload = 'auto';
        audio.volume = 0.55;
        this.pool.push(audio);
      }

      this.initGlobalClickListener();
    }

    playClick() {
      const now = performance.now();
      if (now - this.lastPlayTime < this.debounceMs) {
        return;
      }
      this.lastPlayTime = now;

      try {
        const sound = this.pool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.poolSize;
        sound.currentTime = 0;
        const p = sound.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      } catch (err) {
        // Ignorovat případná omezení
      }
    }

    initGlobalClickListener() {
      // Delegace kliknutí na libovolný interaktivní prvek na stránce
      const interactiveSelector = [
        'button',
        'a',
        'input[type="button"]',
        'input[type="submit"]',
        '[role="button"]',
        '.gcell-icon-clickable',
        '.cell-circle',
        '.map-card',
        '.wf-pickable-card',
        '.map-card-wf',
        '.rps-card',
        '.rps-action-btn',
        '.side-choice-card',
        '.side-proceed-btn',
        '.side-draw-btn',
        '.player-draggable-tile',
        '.map-role-slot',
        '.loser-team-card',
        '.loser-card-btn',
        '.lol-half',
        '.lol-reselect-loser-btn',
        '.hud-action-btn',
        '.hud-music-btn',
        '.hud-volume-btn',
        '.map-detail-btn',
        '.map-modal-btn',
        '.summary-btn',
        '.summary-go-score-btn',
        '.wc-rule-card',
        '.score-intro-start-btn',
        '.header-action-btn',
        '.header-back-btn',
        '.roulette-spin-btn'
      ].join(', ');

      document.addEventListener('click', (e) => {
        const target = e.target.closest(interactiveSelector);
        if (target) {
          this.playClick();
        }
      }, true); // Use capture phase so SFX triggers immediately on user action
    }
  }

  window.LankaSFX = new LankaSoundEffects();

  // Automatické navázání UI po načtení DOMu
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.LankaNoise) window.LankaNoise.bindUI();
    });
  } else {
    if (window.LankaNoise) window.LankaNoise.bindUI();
  }

})(window);
