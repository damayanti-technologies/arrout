/* ---- js/app.js ---- */
/**
 * ARROUT - Main Application Controller
 * Features full browser history hash-routing (prevents exiting site on back button)
 * and bending arrow test levels.
 */

// Gradient shared by every life icon (defined once so there are no duplicate ids)
const HEART_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="dropG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9DCFF"/><stop offset="1" stop-color="#4FA3F0"/></linearGradient></defs></svg>';

class ArroutApp {
  constructor() {
    this.currentScreen = 'home';
    this.currentLevelNum = 1;
    this.bendingEngine = null;
    this.activeDifficulty = 'all';   // difficulty filter on the Levels screen
    this._forceHash = null;          // hash set by our own navigate() calls (allowed to open any mode/level)
    this._tourney = null;            // set while a weekly-tournament run is in progress

    this.init();
  }

  init() {
    window.showToast = (msg, duration = 2400) => this.showToast(msg, duration);
    this.currentLevelNum = this.unlockedLevel();

    this.setupHistoryRouting();
    this.setupNavigation();
    this.setupScreens();
    this.setupAudioAndSettings();
    this.updateHUD();
    this.renderProfile();
    this.renderWeeklyTournament();
    this.renderDailyChallenge();

    // Initial route check
    this.handleRoute(window.location.hash || '#/');
  }

  // ---- progress helpers ----
  clearedLevelNumbers() {
    const done = (window.storageManager && window.storageManager.data.completedLevels) || {};
    return Object.keys(done).map(k => /^LVL-(\d+)$/.test(k) ? parseInt(RegExp.$1, 10) : 0).filter(n => n > 0);
  }

  // Highest level the player may open: one past the furthest cleared level (max 1000)
  unlockedLevel() {
    const n = this.clearedLevelNumbers();
    return Math.min(1000, (n.length ? Math.max.apply(null, n) : 0) + 1);
  }

  setupHistoryRouting() {
    // Only hashchange: browsers fire BOTH popstate and hashchange for hash navigation,
    // which used to run every route (and generate every level) twice.
    window.addEventListener('hashchange', () => {
      this.handleRoute(window.location.hash);
    });
  }

  handleRoute(hash) {
    // Parse e.g. #/puzzle/36 or #/levels or #/
    hash = hash || '#/';
    const cleanHash = hash.replace(/^#\/?/, '');
    const parts = cleanHash.split('/');
    const screen = parts[0] || 'home';
    const param = parts[1];

    if (screen === 'puzzle' || screen === 'play') {
      let lvl = param ? parseInt(param, 10) : this.unlockedLevel();
      if (!isFinite(lvl) || lvl < 1) lvl = this.unlockedLevel();
      const allowed = this._forceHash === hash || (lvl <= this.unlockedLevel());
      if (!allowed) {
        // typed/bookmarked URL or history entry for a locked level or a special mode
        if (lvl >= 10001) {
          this.showToast('Open that mode from the home screen.');
          this.navigate('home', null, { replace: true });
        } else {
          this.showToast('Clear the earlier levels first.');
          this.navigate('puzzle', this.unlockedLevel(), { replace: true });
        }
        return;
      }
      if (!param && this._forceHash !== hash) {
        try { window.history.replaceState(null, '', '#/puzzle/' + lvl); } catch (e) {}
      }
      this.switchScreen('puzzle', lvl, false);
    } else {
      this.switchScreen(screen, null, false);
    }
  }

  // opts.replace: swap the current history entry instead of adding one
  // (used when moving on from a finished level, so Back does not replay old levels)
  navigate(screenName, levelParam = null, opts = {}) {
    const targetHash = (levelParam !== null && levelParam !== undefined && levelParam !== '')
      ? `#/${screenName}/${levelParam}`
      : `#/${screenName}`;
    this._forceHash = targetHash;

    if (opts.replace) {
      try {
        window.history.replaceState(null, '', targetHash);
        this.handleRoute(targetHash);
      } catch (e) {
        window.location.replace(targetHash);
      }
      return;
    }
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      this.handleRoute(targetHash);
    }
  }

  showToast(msg, duration = 2400) {
    const toast = document.getElementById('global-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }

  updateHUD() {
    const data = (window.storageManager && window.storageManager.data) || { coins: 0, username: 'ArrowPilot' };
    const coinsVal = Number(data.coins ?? 0).toLocaleString();
    document.querySelectorAll('.user-coin-count').forEach(el => el.textContent = coinsVal);
    const homeCoin = document.getElementById('home-coin-count');
    if (homeCoin) homeCoin.textContent = coinsVal;
    const shopCoin = document.getElementById('shop-coins');
    if (shopCoin) shopCoin.textContent = coinsVal;
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = data.username);
    const inp = document.getElementById('profile-username-input');
    if (inp && document.activeElement !== inp && data.username) inp.value = data.username;
  }

  switchScreen(screenName, levelNum = null, updateHistory = true) {
    if (updateHistory) {
      this.navigate(screenName, levelNum);
      return;
    }

    if (window.soundEngine) window.soundEngine.playClick();
    this.currentScreen = screenName;

    // Header and Nav visibility toggle for puzzle gameplay
    const mainHeader = document.getElementById('main-app-header');
    if (mainHeader) {
      mainHeader.style.display = screenName === 'puzzle' ? 'none' : 'flex';
    }
    const bottomNav = document.querySelector('.floating-bottom-nav');
    if (bottomNav) {
      bottomNav.style.display = screenName === 'puzzle' ? 'none' : 'flex';
    }

    // Toggle active screen
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.classList.add('active');
    } else {
      // Fallback to home
      document.getElementById('screen-home')?.classList.add('active');
      this.currentScreen = 'home';
    }

    const appFrame = document.querySelector('.mobile-app-frame');
    if (appFrame) {
      appFrame.classList.toggle('screen-home-active', this.currentScreen === 'home');
    }
    document.body.classList.toggle('screen-home-active', this.currentScreen === 'home');

    // Update bottom navigation bar active state
    document.querySelectorAll('.floating-bottom-nav .nav-pill-btn').forEach(btn => {
      if (btn.dataset.nav === screenName || (screenName === 'levels' && btn.dataset.nav === 'puzzle')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Stop any running level (animations, win/fail timers) when leaving gameplay
    if (screenName !== 'puzzle' && this.bendingEngine) {
      this.bendingEngine.destroy();
      this.bendingEngine = null;
    }

    // Home: show the level PLAY will open
    const lvlEl = document.getElementById('home-level-text');
    if (lvlEl) lvlEl.textContent = 'Level ' + this.unlockedLevel();

    // Screen specific triggers
    if (screenName === 'puzzle') {
      const targetLvl = levelNum || this.unlockedLevel();
      this.launchBendingLevel(targetLvl, this.activeDifficulty);
    } else if (screenName === 'levels') {
      this.renderLevelGrid();
    } else if (screenName === 'shop') {
      this.renderShop();
    } else if (screenName === 'profile') {
      this.renderProfile();
    } else if (screenName === 'tournament') {
      this.renderWeeklyTournament();
    } else if (screenName === 'daily') {
      this.renderDailyChallenge();
    }

    this.updateHUD();
  }

  setupNavigation() {
    // Navigate on any [data-nav] click
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.dataset.nav;
        this.navigate(target);
      });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.history.length > 1 && window.location.hash && window.location.hash !== '#/') {
          window.history.back();
        } else {
          this.navigate('home');
        }
      });
    });
  }

  setupScreens() {
    // Difficulty filters in Levels screen
    document.querySelectorAll('.diff-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.diff-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeDifficulty = pill.dataset.diff || 'all';
        this.renderLevelGrid();
      });
    });

    // Powerup buttons (💡 Hint and 📏 Undo)
    const hintBtn = document.getElementById('btn-powerup-hint');
    const undoBtn = document.getElementById('btn-powerup-undo');

    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        if (this.bendingEngine) {
          if (this.bendingEngine.hints <= 0) {
            this.showToast('No hints left!');
            return;
          }
          const success = this.bendingEngine.useHint();
          if (success) {
            this.showToast('Highlighted clear arrow!');
          } else {
            this.showToast('No clear arrows found!');
          }
        }
      });
    }

    if (undoBtn) {
      // 📏 ruler: show / hide guide lines through every row and column
      undoBtn.addEventListener('click', () => {
        if (this.bendingEngine) this.bendingEngine.toggleGuide();
      });
    }

    // 1v1 controls
    const start1v1Btn = document.getElementById('btn-start-matchmaking');
    const cancel1v1Btn = document.getElementById('btn-cancel-matchmaking');
    if (start1v1Btn) start1v1Btn.addEventListener('click', () => this.start1v1Matchmaking());
    if (cancel1v1Btn) cancel1v1Btn.addEventListener('click', () => this.cancel1v1Matchmaking());
  }

  setupAudioAndSettings() {
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        window.soundEngine.setMuted(!e.target.checked);
      });
    }
    const volSlider = document.getElementById('setting-volume-slider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        window.soundEngine.setVolume(e.target.value / 100);
      });
    }
  }

  // --- Bending Arrow Level Launcher (Matches Screenshot 2) ---
  launchBendingLevel(levelNum, difficulty = 'normal') {
    this.currentLevelNum = Number(levelNum) || 1;
    if (this._tourney && this._tourney.level !== this.currentLevelNum) this._tourney = null;

    // Header text
    const titleEl = document.getElementById('puzzle-level-title');
    const puzzleData = window.BendingPuzzleGenerator.generateLevel(this.currentLevelNum, difficulty);
    if (titleEl) titleEl.textContent = `Level ${this.currentLevelNum}`;

    const diffBadge = document.getElementById('level-diff-badge');
    if (diffBadge) diffBadge.textContent = (puzzleData.difficulty || difficulty).toUpperCase();

    const boardContainer = document.getElementById('game-bending-board');
    if (!boardContainer) return;

    // Initialize engine (stop the previous level first)
    if (this.bendingEngine) this.bendingEngine.destroy();
    this.hideCheer();
    this.bendingEngine = new BendingArrowEngine({
      container: boardContainer,
      cols: puzzleData.cols,
      rows: puzzleData.rows,
      onCountChange: (remaining) => {
        const remEl = document.getElementById('level-arrows-remaining');
        if (remEl) remEl.textContent = remaining;
      },
      onHeartsChange: (hearts, max) => {
        const heartsRow = document.getElementById('level-hearts-row');
        if (!heartsRow) return;
        const full = '<svg viewBox="0 0 24 24" class="life-heart"><path d="M12 2.6C9 6.6 5.2 10.6 5.2 15a6.8 6.8 0 0 0 13.6 0c0-4.4-3.8-8.4-6.8-12.4z" fill="url(#dropG)" stroke="#2F6FC4" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.2 14.2a3.2 3.2 0 0 0 2.4 3.1" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.6" stroke-linecap="round"/></svg>';
        const lost = '<svg viewBox="0 0 24 24" class="life-heart"><path d="M12 2.6C9 6.6 5.2 10.6 5.2 15a6.8 6.8 0 0 0 13.6 0c0-4.4-3.8-8.4-6.8-12.4z" fill="none" stroke="#9DB6DA" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="2.5 2.5"/></svg>';
        heartsRow.innerHTML = HEART_DEFS + full.repeat(hearts) + lost.repeat(max - hearts);
      },
      onGuideChange: (on) => {
        const btn = document.getElementById('btn-powerup-undo');
        if (btn) btn.classList.toggle('tool-on', !!on);
      },
      onHintsChange: (hints) => {
        const badge = document.getElementById('count-powerup-hint');
        if (badge) badge.textContent = hints;
        const btn = document.getElementById('btn-powerup-hint');
        if (btn) btn.style.opacity = hints > 0 ? '1' : '0.45';
      },
      onMilestone: (percent) => this.showCheer(percent),
      onFail: () => {
        this.showResultModal({
          emoji: '',
          title: 'Out of lives!',
          button: 'TRY AGAIN',
          nextAction: () => this.navigate('puzzle', this.currentLevelNum, { replace: true })
        });
      },
      onComplete: (stats) => {
        // Weekly tournament run: keep best time, no campaign rewards
        if (this._tourney && this._tourney.level === this.currentLevelNum) {
          const rec = window.tournamentManager.recordTournamentResult(stats.totalTime);
          this._tourney = null;
          this.showVictoryModal({
            title: 'Tournament run done!',
            time: `${stats.totalTime}s`,
            moves: stats.moves,
            coinsText: `Best: ${rec.timeSec}s`,
            nextAction: () => this.navigate('tournament', null, { replace: true })
          });
          return;
        }
        const res = window.storageManager.recordLevelCompletion(`LVL-${this.currentLevelNum}`, difficulty, stats.totalTime);
        this.showVictoryModal({
          title: `Level ${this.currentLevelNum} Cleared!`,
          time: `${stats.totalTime}s`,
          moves: stats.moves,
          earnedCoins: res.earnedCoins,
          nextAction: () => {
            const nextLvl = Number(this.currentLevelNum) + 1;
            if (nextLvl <= 1000) {
              this.navigate('puzzle', nextLvl, { replace: true });
            } else {
              this.showToast('🏆 Master Champion! You cleared all 1000 levels!');
              this.navigate('levels', null, { replace: true });
            }
          }
        });
      }
    });

    this.bendingEngine.loadPuzzle(puzzleData);
  }

  // Cheer toast: progress ring + message + 3 step dots + dolphin, shown at 25 / 50 / 75 percent cleared
  showCheer(percent) {
    const el = document.getElementById('cheer-popup');
    if (!el) return;
    const msgs = {
      25: ['Great start!', 'Nice moves!', 'You are warming up!'],
      50: ['Halfway there!', 'Super smooth!', 'Half done, keep going!'],
      75: ['Almost there!', 'So close now!', 'Final stretch!']
    };
    const list = msgs[percent] || ['Nice!'];
    document.getElementById('cheer-badge').textContent = `${percent}%`;
    document.getElementById('cheer-text').textContent = list[Math.floor(Math.random() * list.length)];
    const ring = document.getElementById('cheer-ring');
    if (ring) ring.style.setProperty('--p', percent);
    const n = percent >= 75 ? 3 : percent >= 50 ? 2 : 1;
    el.querySelectorAll('.cheer-steps i').forEach((d, i) => d.classList.toggle('on', i < n));
    el.classList.remove('go');
    void el.offsetWidth;
    el.classList.add('go');
  }

  hideCheer() {
    const el = document.getElementById('cheer-popup');
    if (el) el.classList.remove('go');
  }

  // Same modal as victory, used for "Out of hearts" (no stats row, custom button)
  showResultModal({ emoji, title, button, nextAction }) {
    const modal = document.getElementById('modal-victory');
    if (!modal) return;
    const emojiEl = document.getElementById('victory-emoji');
    const stats = modal.querySelector('.modal-stats-soft');
    const nextBtn = document.getElementById('btn-victory-next');
    if (emojiEl) { emojiEl.textContent = emoji; emojiEl.style.display = emoji ? '' : 'none'; }
    document.getElementById('victory-title').textContent = title;
    if (stats) stats.style.display = 'none';
    if (nextBtn) {
      nextBtn.textContent = button;
      nextBtn.onclick = () => {
        modal.classList.remove('open');
        if (nextAction) nextAction();
      };
    }
    modal.classList.add('open');
  }

  showVictoryModal({ title, time, moves, earnedCoins, coinsText, nextAction }) {
    const modal = document.getElementById('modal-victory');
    if (!modal) return;

    const emojiEl = document.getElementById('victory-emoji');
    if (emojiEl) { emojiEl.textContent = '🎉'; emojiEl.style.display = ''; }
    const statsRow = modal.querySelector('.modal-stats-soft');
    if (statsRow) statsRow.style.display = '';
    const btn = document.getElementById('btn-victory-next');
    if (btn) btn.textContent = 'CONTINUE';

    document.getElementById('victory-title').textContent = title;
    document.getElementById('victory-stat-time').textContent = time;
    document.getElementById('victory-stat-moves').textContent = moves;
    document.getElementById('victory-stat-coins').textContent = coinsText || `+${earnedCoins} Coins`;

    modal.classList.add('open');
    const nextBtn = document.getElementById('btn-victory-next');
    if (nextBtn) {
      nextBtn.onclick = () => {
        modal.classList.remove('open');
        if (nextAction) nextAction();
      };
    }
    this.updateHUD();
  }

  // --- Level Selection Screen (1000 levels, unlocked in order) ---
  renderLevelGrid() {
    const grid = document.getElementById('levels-grid-container');
    if (!grid) return;

    const allLevels = (window.ARROUT_LEVELS_1000 || []);
    const filter = (this.activeDifficulty || 'all').toLowerCase();
    const done = (window.storageManager && window.storageManager.data.completedLevels) || {};
    const unlocked = this.unlockedLevel();
    const frag = document.createDocumentFragment();

    allLevels.forEach(c => {
      if (filter !== 'all' && String(c.d || '').toLowerCase() !== filter) return;
      const meta = window.arroutLevelMeta(c);
      const num = meta.level;
      const isDone = !!done['LVL-' + num];
      const locked = num > unlocked;
      const card = document.createElement('div');
      card.className = 'level-clay-card' + (isDone ? ' cleared' : '') + (locked ? ' locked' : '');
      card.dataset.lvl = num;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Level ${num}, ${meta.difficulty}${locked ? ', locked' : isDone ? ', cleared' : ''}`);
      card.innerHTML = `
        <div class="lvl-card-num">${locked ? '🔒' : num}</div>
        <div class="lvl-card-stars">${isDone ? '⭐' : ''}</div>
        <div style="font-size:0.58rem;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;">${String(meta.difficulty).toUpperCase()}</div>
      `;
      frag.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);

    if (!grid._wired) {
      grid._wired = true;
      const open = (card) => {
        if (!card) return;
        const n = parseInt(card.dataset.lvl, 10);
        if (n > this.unlockedLevel()) {
          this.showToast(`Clear level ${this.unlockedLevel()} to unlock this one.`);
          return;
        }
        this.navigate('puzzle', n);
      };
      grid.addEventListener('click', e => open(e.target.closest('[data-lvl]')));
      grid.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e.target.closest('[data-lvl]')); }
      });
    }
  }

  // --- Weekly Tournament (offline: one hard puzzle per week, best time kept on this device) ---
  renderWeeklyTournament() {
    const tm = window.tournamentManager;
    if (!tm) return;
    const info = tm.getWeeklyInfo();

    const timeEl = document.getElementById('tournament-time-remaining');
    if (timeEl) timeEl.textContent = info.timeRemaining;

    const countEl = document.getElementById('tournament-eligibility-count');
    if (countEl) countEl.textContent = `${Math.min(info.qualifyingCount, 10)} / 10 Levels`;
    const fill = document.getElementById('tournament-eligibility-fill');
    if (fill) fill.style.width = `${Math.min(100, info.qualifyingCount * 10)}%`;
    const msg = document.getElementById('tournament-locked-msg');
    if (msg) {
      msg.style.color = info.isEligible ? '#059669' : '#E53E3E';
      msg.textContent = info.isEligible
        ? `Unlocked! This week's puzzle is Level ${info.level}.`
        : `Clear ${10 - info.qualifyingCount} more different level(s) this week to unlock your entry.`;
    }

    const btn = document.getElementById('btn-enter-tournament');
    if (btn) {
      btn.disabled = !info.isEligible;
      btn.onclick = () => {
        if (!tm.getWeeklyInfo().isEligible) return;
        this._tourney = { level: info.level };
        this.navigate('puzzle', info.level);
      };
    }

    const rows = document.getElementById('tournament-leaderboard-rows');
    if (rows) {
      const sc = info.score;
      const myUid = (firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid) ||
                    (window.storageManager && window.storageManager.data && window.storageManager.data.playerId);

      const renderBoard = (globalScores = []) => {
        let html = `
          <div style="background:#FFF;border-radius:16px;padding:12px 16px;box-shadow:var(--clay-shadow);display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <div style="font-weight:800;font-size:0.9rem;color:var(--text-navy);">Your best time</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">${sc ? sc.runs + ' run' + (sc.runs === 1 ? '' : 's') + ' this week' : 'No run yet this week'}</div>
            </div>
            <div style="font-weight:800;font-size:1.05rem;color:var(--accent-gold);">${sc ? sc.timeSec + 's' : '—'}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 4px 6px;">
            <span style="font-size:0.76rem;font-weight:800;letter-spacing:0.8px;color:var(--text-muted);text-transform:uppercase;">Global Leaderboard</span>
            <span style="font-size:0.68rem;background:#ECFDF5;color:#059669;padding:2px 8px;border-radius:10px;font-weight:700;">LIVE</span>
          </div>`;

        if (!globalScores.length) {
          html += `
            <div style="background:#FFF;border-radius:14px;padding:16px;text-align:center;box-shadow:var(--clay-shadow);color:var(--text-muted);font-size:0.8rem;">
              ${sc ? 'Syncing your score with global players...' : 'Be the first player worldwide to set a tournament record this week!'}
            </div>`;
        } else {
          html += `<div style="display:flex;flex-direction:column;gap:6px;">`;
          globalScores.forEach((p, idx) => {
            const isMe = p.uid === myUid;
            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            const avatar = p.photoURL
              ? `<img src="${p.photoURL}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
              : `<span style="width:24px;height:24px;border-radius:50%;background:#E2E8F0;display:inline-flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:var(--text-navy);">${(p.username || 'P').charAt(0).toUpperCase()}</span>`;

            html += `
              <div style="background:${isMe ? '#FEF9C3' : '#FFF'};border:${isMe ? '1.5px solid #FACC15' : '1px solid rgba(0,0,0,0.04)'};border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:10px;box-shadow:var(--clay-shadow);">
                <span style="font-weight:800;font-size:0.88rem;width:24px;text-align:center;">${rankEmoji}</span>
                ${avatar}
                <span style="flex:1;font-weight:${isMe ? '800' : '700'};font-size:0.82rem;color:var(--text-navy);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  ${p.username || 'ArrowPilot'} ${isMe ? '<span style="font-size:0.7rem;color:#B45309;">(You)</span>' : ''}
                </span>
                <span style="font-weight:800;font-size:0.85rem;color:var(--text-navy);font-variant-numeric:tabular-nums;">
                  ${p.timeSec}s
                </span>
              </div>`;
          });
          html += `</div>`;
        }
        rows.innerHTML = html;
      };

      // Initial render with local best
      renderBoard([]);

      // Realtime Firebase subscription
      if (this._tournamentUnsub) {
        try { this._tournamentUnsub(); } catch (e) {}
        this._tournamentUnsub = null;
      }
      this._tournamentUnsub = tm.listenLeaderboard(info.weekId, (list) => {
        renderBoard(list);
      });
    }
  }

  // --- Daily Challenge (screen is completed by js/modes.js) ---
  renderDailyChallenge() {
    const dateEl = document.getElementById('daily-challenge-date');
    if (dateEl) dateEl.textContent = new Date().toDateString();
    const streakEl = document.getElementById('daily-streak-count');
    if (streakEl) streakEl.textContent = (window.storageManager && window.storageManager.data.stats.streakDays) || 0;
  }

  // --- Shop (screen is built by js/themes.js) ---
  renderShop() {}

  // --- Profile ---
  renderProfile() {
    const data = window.storageManager && window.storageManager.data;
    if (!data) return;
    const st = data.stats;
    const won = st.matchesWon || 0, lost = st.matchesLost || 0;
    const played = won + lost;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('profile-stat-clears', st.levelsCompleted || 0);
    set('profile-stat-wins', `${won}W-${lost}L`);
    set('profile-stat-winrate', played ? Math.round(won / played * 100) + '%' : '0%');
    set('profile-stat-rating', data.rating || 1200);

    const achContainer = document.getElementById('profile-achievements-list');
    if (!achContainer) return;
    achContainer.innerHTML = '';
    data.achievements.forEach(ach => {
      const item = document.createElement('div');
      item.style.cssText = 'background: #FFF; border-radius: 16px; padding: 12px 16px; display: flex; align-items: center; box-shadow: var(--clay-shadow);' + (ach.unlocked ? '' : 'opacity:0.75;');
      item.innerHTML = `
        <div style="font-size: 1.6rem; margin-right: 12px;">${ach.unlocked ? '🏆' : '🔒'}</div>
        <div style="flex: 1;">
          <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-navy);">${ach.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${ach.desc}</div>
        </div>
        <div style="font-size: 0.82rem; font-weight: 800; color: var(--accent-gold);">+${ach.reward} 🪙</div>
      `;
      achContainer.appendChild(item);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new ArroutApp();
});
