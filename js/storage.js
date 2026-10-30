/* ---- js/storage.js ---- */
/**
 * ARROUT - Persistent storage (localStorage only, nothing leaves the device).
 * Holds coins, cleared levels, stats, achievements and the weekly-tournament record.
 * Themes live in js/themes.js (key arrout_themes_v1), settings in js/settings.js (arrout_settings_v1),
 * daily-challenge progress in js/modes.js (arrout_daily_v1). RESET_KEYS lists everything "Reset" must clear.
 */

const STORAGE_KEY = 'arrow_escape_player_data_v1';
const RESET_KEYS = [STORAGE_KEY, 'arrout_settings_v1', 'arrout_themes_v1', 'arrout_daily_v1', 'arrout_battle_v1', 'arrout_last_quote'];

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_escape', name: 'First Freedom', desc: 'Clear your first arrow puzzle.', reward: 50, unlocked: false },
  { id: 'novice_solver', name: 'Novice Solver', desc: 'Complete 5 different levels.', reward: 100, unlocked: false },
  { id: 'arrow_master', name: 'Arrow Maestro', desc: 'Complete 25 different levels.', reward: 250, unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Clear any puzzle in under 15 seconds.', reward: 150, unlocked: false },
  { id: 'pvp_first_win', name: 'First Blood', desc: 'Win your first Battle.', reward: 100, unlocked: false },
  { id: 'pvp_champion', name: 'Duelist Veteran', desc: 'Win 10 Battles.', reward: 300, unlocked: false },
  { id: 'tournament_qualifier', name: 'Contender', desc: 'Qualify for the Weekly Tournament by clearing 10 different levels in a week.', reward: 200, unlocked: false },
  { id: 'fashionista', name: 'Stylist', desc: 'Unlock your first theme.', reward: 100, unlocked: false },
  { id: 'royal_collector', name: 'Theme Collector', desc: 'Own every theme in the shop.', reward: 500, unlocked: false }
];

class StorageManager {
  constructor() {
    this.data = this.loadData();
    this.checkWeeklyReset();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return this.mergeDefaults(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load storage, using defaults:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    const randomId = 'AE-' + Math.floor(100000 + Math.random() * 900000);
    return {
      playerId: randomId,
      username: 'ArrowPilot_' + randomId.slice(-4),
      coins: 250, // starting bonus
      rating: 1200,
      stats: {
        levelsCompleted: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        streakDays: 0,
        lastDailyDate: null,
        fastestTime: 0
      },
      // levelId ("LVL-12") -> { clearedAt, difficulty, bestTime }
      completedLevels: {},
      // Weekly tournament: distinct level ids cleared this ISO week, and the best run
      tournamentWeekId: this.getCurrentWeekId(),
      tournamentQualifyingLevels: [],
      tournamentScore: null,
      achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
      settings: { sound: true, volume: 0.7, reducedMotion: false, vibration: true }
    };
  }

  mergeDefaults(saved) {
    const defaults = this.getDefaultData();
    const merged = { ...defaults, ...saved };
    merged.stats = { ...defaults.stats, ...(saved.stats || {}) };
    merged.settings = { ...defaults.settings, ...(saved.settings || {}) };
    if (typeof merged.coins !== 'number' || !isFinite(merged.coins) || merged.coins < 0) merged.coins = 0;
    if (!merged.completedLevels || typeof merged.completedLevels !== 'object') merged.completedLevels = {};
    if (!Array.isArray(merged.tournamentQualifyingLevels)) merged.tournamentQualifyingLevels = [];
    // keep every default achievement; carry over the saved unlocked flag
    const savedAch = new Map((saved.achievements || []).map(a => [a.id, a]));
    merged.achievements = DEFAULT_ACHIEVEMENTS.map(def => {
      const m = savedAch.get(def.id);
      return m ? { ...def, unlocked: !!m.unlocked } : { ...def };
    });
    return merged;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // ISO week id, always computed in UTC so it matches the tournament countdown
  getCurrentWeekId() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  checkWeeklyReset() {
    const cur = this.getCurrentWeekId();
    if (this.data.tournamentWeekId !== cur) {
      this.data.tournamentWeekId = cur;
      this.data.tournamentQualifyingLevels = [];
      this.data.tournamentScore = null;
      this.save();
    }
  }

  // Level clear: coins only for the first clear of each level (no farming)
  recordLevelCompletion(levelId, difficulty = 'normal', completionTimeSec = 0) {
    this.checkWeeklyReset();
    const isFirstTime = !this.data.completedLevels[levelId];
    let earnedCoins = 0;

    if (isFirstTime) {
      earnedCoins = 10;
      this.data.completedLevels[levelId] = { clearedAt: Date.now(), difficulty, bestTime: completionTimeSec };
      this.data.coins += earnedCoins;
      this.data.stats.levelsCompleted = Object.keys(this.data.completedLevels).length;
    } else {
      const rec = this.data.completedLevels[levelId];
      if (!rec.bestTime || completionTimeSec < rec.bestTime) rec.bestTime = completionTimeSec;
    }

    if (completionTimeSec > 0 && (!this.data.stats.fastestTime || completionTimeSec < this.data.stats.fastestTime)) {
      this.data.stats.fastestTime = completionTimeSec;
    }

    // Weekly tournament qualification: distinct levels cleared this week
    if (!this.data.tournamentQualifyingLevels.includes(levelId)) {
      this.data.tournamentQualifyingLevels.push(levelId);
      if (this.data.tournamentQualifyingLevels.length >= 10) this.unlockAchievement('tournament_qualifier');
    }

    this.unlockAchievement('first_escape');
    if (this.data.stats.levelsCompleted >= 5) this.unlockAchievement('novice_solver');
    if (this.data.stats.levelsCompleted >= 25) this.unlockAchievement('arrow_master');
    if (completionTimeSec > 0 && completionTimeSec <= 15) this.unlockAchievement('speed_demon');

    this.save();
    return { isFirstTime, earnedCoins };
  }

  // Battle result (coins are handled by the pot in coins.js, so none are added here)
  recordBattle(won, opponentRating = 1200) {
    const s = this.data.stats;
    s.matchesPlayed = (s.matchesPlayed || 0) + 1;
    const expected = 1 / (1 + Math.pow(10, (opponentRating - this.data.rating) / 400));
    const change = Math.round(32 * ((won ? 1 : 0) - expected));
    this.data.rating = Math.max(800, this.data.rating + change);
    if (won) {
      s.matchesWon = (s.matchesWon || 0) + 1;
      this.unlockAchievement('pvp_first_win');
      if (s.matchesWon >= 10) this.unlockAchievement('pvp_champion');
    } else {
      s.matchesLost = (s.matchesLost || 0) + 1;
    }
    this.save();
    return { ratingChange: change };
  }

  // Weekly tournament: keep the best (lowest) time of the week
  recordTournamentResult(timeSec) {
    this.checkWeeklyReset();
    const prev = this.data.tournamentScore;
    const best = prev && prev.timeSec <= timeSec ? prev.timeSec : timeSec;
    this.data.tournamentScore = { weekId: this.data.tournamentWeekId, timeSec: best, lastSec: timeSec, runs: ((prev && prev.runs) || 0) + 1 };
    this.save();
    return this.data.tournamentScore;
  }

  unlockAchievement(achId) {
    const ach = this.data.achievements.find(a => a.id === achId);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      this.data.coins += ach.reward;
      this.save();
      if (window.soundEngine) window.soundEngine.playCoin();
      if (window.showToast) window.showToast(`🏆 Achievement Unlocked: ${ach.name} (+${ach.reward} Coins)!`);
      return true;
    }
    return false;
  }

  // Wipe every key the game uses
  static resetAll() {
    RESET_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  }
}

window.StorageManager = StorageManager;
window.storageManager = new StorageManager();
