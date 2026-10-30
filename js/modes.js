/* =====================================================================
   SPECIAL PUZZLE MODES: Daily Challenge, Room Race, Battle
   Each mode has its own set of hard, large puzzles (not the 100 normal levels):
     levels-daily.js   -> window.ARROUT_DAILY_LEVELS
     levels-room.js    -> window.ARROUT_ROOM_LEVELS
     levels-battle.js  -> window.ARROUT_BATTLE_LEVELS
   Puzzle numbers: daily 10001+, room 20001+, battle 30001+
   ===================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var SETS = {
    daily:  { base: 10001, get: function () { return window.ARROUT_DAILY_LEVELS  || []; }, label: 'Daily Challenge' },
    room:   { base: 20001, get: function () { return window.ARROUT_ROOM_LEVELS   || []; }, label: 'Room Race' },
    battle: { base: 30001, get: function () { return window.ARROUT_BATTLE_LEVELS || []; }, label: 'Battle' }
  };
  function modeOf(n) { n = +n; return n >= 30001 ? 'battle' : n >= 20001 ? 'room' : n >= 10001 ? 'daily' : null; }
  function entry(n) { var m = modeOf(n); if (!m) return null; return SETS[m].get()[n - SETS[m].base] || null; }
  function toast(m) { if (window.showToast) window.showToast(m); }
  function fmt(ms) {
    var s = ms / 1000; if (s < 60) return s.toFixed(1) + 's';
    var m = Math.floor(s / 60); return m + ':' + (s - m * 60 < 9.95 ? '0' : '') + (s - m * 60).toFixed(1);
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- puzzle lookup for the engine ---------- */
  var G = window.BendingPuzzleGenerator;
  if (G) {
    var origGen = G.generateLevel;
    G.generateLevel = function (n, d) {
      var e = entry(n); if (!e) return origGen.call(G, n, d);
      return {
        level: n, difficulty: e.difficulty, shapeType: e.shape, shapeName: e.shapeName, icon: e.icon,
        cols: e.cols, rows: e.rows, arrowCount: e.arrowCount, occupiedCellCount: e.occupiedCellCount, prims: e.prims, ar: e.ar,
        arrows: e.arrows.map(function (a) { return { id: a.id, points: a.points.map(function (p) { return { x: p.x, y: p.y }; }), dir: a.dir, dirNum: a.dirNum, length: a.length }; })
      };
    };
  }

  /* ---------- result modal: extra block for names / times ---------- */
  function extraEl() {
    var el = $('victory-extra');
    if (!el) {
      el = document.createElement('div'); el.id = 'victory-extra'; el.className = 'vx';
      var t = $('victory-title'); t.parentNode.insertBefore(el, t.nextSibling);
    }
    return el;
  }
  function clearExtra() { var el = $('victory-extra'); if (el) { el.innerHTML = ''; el.style.display = 'none'; } }
  function setExtra(html) { var el = extraEl(); el.innerHTML = html; el.style.display = ''; }
  function boardHtml(rows, winners, note) {
    var h = '<div class="vx-list">';
    rows.forEach(function (r, i) {
      var isW = winners.indexOf(r) >= 0;
      h += '<div class="vx-row' + (isW ? ' win' : '') + (r.me ? ' me' : '') + '"><span class="vx-pos">' + (r.ms !== null ? (isW ? (winners.length > 1 ? '🤝' : '🏆') : (i + 1)) : '–') + '</span><span class="vx-name">' + esc(r.name) + (r.me ? ' (you)' : '') + '</span><span class="vx-time">' + (r.ms !== null ? fmt(r.ms) : (r.failed ? 'Out of lives' : 'Not finished')) + '</span></div>';
    });
    h += '</div>'; if (note) h += '<div class="vx-note">' + esc(note) + '</div>';
    return h;
  }

  /* ---------- progress level (home screen text) ---------- */
  function progressLevel() {
    try {
      var done = Object.keys(window.storageManager.data.completedLevels || {}).map(function (k) { return parseInt(String(k).replace(/\D/g, ''), 10); }).filter(function (x) { return x && x < 10001; });
      return Math.min(1000, (done.length ? Math.max.apply(null, done) : 0) + 1);
    } catch (e) { return 1; }
  }
  function addCoins(n) { try { window.storageManager.data.coins += n; window.storageManager.save(); } catch (e) {} }

  /* ================= DAILY ================= */
  var DK = 'arrout_daily_v1';
  function dload() { try { return JSON.parse(localStorage.getItem(DK) || '{}'); } catch (e) { return {}; } }
  function dsave(o) { try { localStorage.setItem(DK, JSON.stringify(o)); } catch (e) {} }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dayIndex(d) {
    var N = SETS.daily.get().length || 1, u = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    return ((u % N) + N) % N;
  }
  function streak(done) {
    var d = new Date(), s = 0; if (!done[ymd(d)]) d.setDate(d.getDate() - 1);
    while (done[ymd(d)]) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }
  function renderDaily(app) {
    var d = new Date(), key = ymd(d), idx = dayIndex(d), e = SETS.daily.get()[idx], st = dload(); st.done = st.done || {};
    if ($('daily-challenge-date')) $('daily-challenge-date').textContent = key;
    if ($('daily-streak-count')) $('daily-streak-count').textContent = streak(st.done);
    var info = $('daily-info');
    if (!info) { info = document.createElement('div'); info.id = 'daily-info'; info.className = 'daily-info'; var anchor = $('daily-challenge-date').nextElementSibling; anchor.parentNode.insertBefore(info, anchor); }
    var btn = $('btn-play-daily'); if (!e) { info.textContent = 'No puzzle available.'; return; }
    var did = st.done[key];
    info.innerHTML = '<div class="di-tag">EXPERT</div><div class="di-main">' + esc(e.icon + ' ' + e.shapeName) + '</div><div class="di-sub">' + e.arrowCount + ' arrows · ' + e.cols + '×' + e.rows + ' grid</div>' +
      (did ? '<div class="di-done">✅ Cleared today in ' + fmt(did.ms) + '. A new puzzle comes tomorrow.</div>' : '<div class="di-sub">Clear it today to earn 50 bonus coins and grow your streak.</div>');
    btn.textContent = did ? 'PLAY AGAIN' : "PLAY TODAY'S PUZZLE";
    btn.onclick = function () { app.navigate('puzzle', SETS.daily.base + idx); };
  }
  function hookDaily(app, eng, n) {
    eng.onComplete = function (stats) {
      var d = new Date(), key = ymd(d), st = dload(); st.done = st.done || {};
      var ms = Math.round((+stats.totalTime || 0) * 1000), clockBack = !!(st.maxKey && key < st.maxKey), first = !st.done[key] && !clockBack;
      if (clockBack) { app.showToast && app.showToast('Device date is earlier than your last daily clear, so no bonus.'); }
      if (!st.maxKey || key > st.maxKey) st.maxKey = key;
      if (!clockBack && (first || !st.done[key] || ms < st.done[key].ms)) st.done[key] = { ms: ms };
      dsave(st);
      var s = streak(st.done);
      try { window.storageManager.data.stats.streakDays = s; window.storageManager.data.stats.lastDailyDate = key; } catch (e) {}
      if (first) addCoins(50); else try { window.storageManager.save(); } catch (e) {}
      app.showVictoryModal({ title: 'Daily Challenge Cleared!', time: stats.totalTime + 's', moves: stats.moves, earnedCoins: first ? 50 : 0,
        nextAction: function () { app.navigate('daily', null, { replace: true }); } });
      setExtra('<div class="vx-note">🔥 Streak: ' + s + ' day' + (s === 1 ? '' : 's') + '</div>');
    };
  }

  /* ================= BATTLE (computer-controlled opponent, practice for coins) ================= */
  var NAMES = ['Vortex_Pilot', 'NeonShadow', 'CyberArcher', 'NovaRider', 'PulseQueen', 'VectorKing', 'ZenithArrow', 'GlitchSniper', 'QuantumDash', 'AeroMaster', 'HyperSonic', 'SolarFlare'];
  var B = { timers: [], opp: null, tick: null };
  // At most 5 paid battles per day: the opponent is a computer, so unlimited paid wins would be a coin farm
  var BK = 'arrout_battle_v1', MAX_PAID = 5;
  function bpaid() { try { var o = JSON.parse(localStorage.getItem(BK) || '{}'); return o.day === ymd(new Date()) ? (o.paid || 0) : 0; } catch (e) { return 0; } }
  function bpaidAdd() { try { localStorage.setItem(BK, JSON.stringify({ day: ymd(new Date()), paid: bpaid() + 1 })); } catch (e) {} }
  function bclear() { B.timers.forEach(clearTimeout); B.timers = []; if (B.tick) { clearInterval(B.tick); B.tick = null; } B.opp = null; }
  function battleScreenName() { var s = $('btn-start-matchmaking'); var sec = s && s.closest('section'); return sec ? sec.id.replace('screen-', '') : 'home'; }
  function startBattle(app) {
    bclear();
    var st = $('matchmaking-status-text'), radar = $('matchmaking-radar'), N = SETS.battle.get().length;
    if (!N) { toast('Battle puzzles are missing.'); return; }
    var free = bpaid() >= MAX_PAID;
    if (!free && window.ArroutCoins && !window.ArroutCoins.canStake()) return;
    if (free) toast('You have used your ' + MAX_PAID + ' coin battles for today. This one is just for fun.');
    var name = NAMES[Math.floor(Math.random() * NAMES.length)], idx = Math.floor(Math.random() * N);
    if (st) st.textContent = 'Searching for opponent...'; if (radar) radar.classList.add('searching');
    if ($('matchmaking-actions')) $('matchmaking-actions').style.display = 'block';

    // Firebase live matchmaking queue check
    var hasFb = typeof firebase !== 'undefined' && firebase.firestore && firebase.apps.length;
    var myUid = (firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid) ||
                (window.storageManager && window.storageManager.data && window.storageManager.data.playerId) ||
                ('anon_' + Math.random().toString(36).slice(2, 8));
    var myName = (firebase.auth && firebase.auth().currentUser && (firebase.auth().currentUser.displayName || firebase.auth().currentUser.email)) ||
                 (window.storageManager && window.storageManager.data && window.storageManager.data.username) || 'Player';

    if (hasFb) {
      if (st) st.textContent = 'Searching online queue...';
      try {
        var db = firebase.firestore();
        var qDoc = db.collection('battles_queue').doc(myUid);
        qDoc.set({
          uid: myUid,
          name: myName,
          joinedAt: Date.now(),
          puzzleIdx: idx
        }).catch(function() {});
        B.cleanQueue = function() { qDoc.delete().catch(function() {}); };
      } catch(e) {}
    }

    B.timers.push(setTimeout(function () {
      if (B.cleanQueue) { B.cleanQueue(); B.cleanQueue = null; }
      if (st) st.textContent = 'Rival ready: ' + name; if (radar) radar.classList.remove('searching');
      B.timers.push(setTimeout(function () {
        var go = function (paid) { B.cur = null; B.next = { name: name, pot: paid }; app.navigate('puzzle', SETS.battle.base + idx); };
        if (!free && window.ArroutCoins) window.ArroutCoins.stake(name, function () { bpaidAdd(); go(true); }); else go(false);
      }, 900));
    }, 2000 + Math.random() * 800));
  }
  function cancelBattle() {
    if (B.cleanQueue) { B.cleanQueue(); B.cleanQueue = null; }
    bclear(); B.next = null;
    var st = $('matchmaking-status-text'), radar = $('matchmaking-radar');
    if (st) st.textContent = 'Ready to Duel'; if (radar) radar.classList.remove('searching');
  }
  function hookBattle(app, eng, n) {
    var opp = B.next || B.cur || { name: NAMES[0] }; B.cur = opp; B.next = null;   // the router can launch twice
    var total = eng.total, N = total, T = N * (2.6 + Math.random() * 1.0) * 1000;   // opponent solve time (ms)
    var t0 = performance.now(); B.opp = { name: opp.name, T: T, done: false, over: false, pot: !!opp.pot };
    var hud = $('pvp-live-hud'); if (hud) hud.style.display = 'block';
    if ($('pvp-opp-name')) $('pvp-opp-name').textContent = opp.name;
    function paint(left) {
      if ($('pvp-opp-count')) $('pvp-opp-count').textContent = left + ' Left';
      if ($('pvp-opp-progress-bar')) $('pvp-opp-progress-bar').style.width = Math.round((1 - left / N) * 100) + '%';
    }
    paint(N);
    var again = function () { bclear(); app.navigate(battleScreenName(), null, { replace: true }); };
    var badge = $('pvp-pot-badge');
    if (!badge && hud) { badge = document.createElement('div'); badge.id = 'pvp-pot-badge'; hud.appendChild(badge); }
    if (badge) { badge.style.display = opp.pot ? '' : 'none'; badge.textContent = '\uD83E\uDE99 Pot: 100 coins. Winner takes all.'; }
    function end(emoji, title, rows, winners, note, outcome) {
      var b = B.opp; if (b) b.over = true;
      if (B.tick) { clearInterval(B.tick); B.tick = null; }
      eng.isLocked = true;
      if (badge) badge.style.display = 'none';
      var show = function () {
        app.showResultModal({ emoji: emoji, title: title, button: 'BACK TO BATTLE', nextAction: again });
        setExtra(boardHtml(rows, winners, note));
      };
      if (b && b.pot && window.ArroutCoins) window.ArroutCoins.settle(outcome, b.name, show); else show();
    }
    B.tick = setInterval(function () {
      var b = B.opp; if (!b || b.over) return;
      var el = performance.now() - t0, f = Math.min(1, el / T); f = f * f * (3 - 2 * f) * .35 + f * .65;   // slightly slow start
      var left = Math.max(0, N - Math.floor(N * f + (Math.random() < .3 ? 1 : 0)));
      if (el >= T) {
        paint(0); b.done = true; clearInterval(B.tick); B.tick = null;
        // 0.5 s grace: finishing within it is a tie
        B.timers.push(setTimeout(function () {
          if (b.over) return;
          var rows = [{ name: b.name, ms: T, me: false }, { name: window.storageManager.data.username || 'You', ms: null, me: true, failed: false }];
          try { window.storageManager.recordBattle(false); } catch (e) {}
          end('😮', b.name + ' wins!', rows, [rows[0]], opp.pot ? 'They solved it first. You lose 50 coins.' : 'They solved it first. No coins at stake.', 'lose');
        }, 500));
        return;
      }
      paint(left);
    }, 600);
    eng.onFail = function () {
      var b = B.opp; if (!b || b.over) return;
      var rows = [{ name: b.name, ms: null, me: false }, { name: window.storageManager.data.username || 'You', ms: null, me: true, failed: true }];
      try { window.storageManager.recordBattle(false); } catch (e) {}
      end('', b.name + ' wins!', rows, [rows[0]], opp.pot ? 'You ran out of lives. You lose 50 coins.' : 'You ran out of lives.', 'lose');
    };
    eng.onComplete = function () {
      var b = B.opp; if (!b || b.over) return;
      var my = Math.round(performance.now() - t0), me = window.storageManager.data.username || 'You';
      var rows = [{ name: me, ms: my, me: true }, { name: b.name, ms: b.done ? T : null, me: false }];
      if (b.done && my - T <= 500) {                      // inside the tie window
        rows.sort(function (x, y) { return x.ms - y.ms; });
        end('🤝', "It's a tie!", rows, rows, opp.pot ? 'Both finished within 0.5 seconds. Entry fees returned.' : 'Both finished within 0.5 seconds.', 'tie');
      } else {
        try { window.storageManager.recordBattle(true); } catch (e) {}
        end('🏆', me + ' wins!', rows, [rows[0]], b.name + (opp.pot ? ' is still solving. You win 100 coins!' : ' is still solving. Nice one!'), 'win');
      }
    };
  }

  /* ================= wiring ================= */
  function boot() {
    var app = window.app; if (!app) return;
    var css = document.createElement('style'); css.textContent =
      '.vx{margin:10px 0 4px}.vx-list{display:flex;flex-direction:column;gap:6px;text-align:left}' +
      '.vx-row{display:flex;align-items:center;gap:10px;background:#F1F5FB;border-radius:12px;padding:8px 12px;font-size:.88rem;color:var(--text-navy)}' +
      '.vx-row.win{background:#E6F6EC;box-shadow:inset 0 0 0 2px #7CCB9B}.vx-row.me .vx-name{font-weight:800}' +
      '.vx-pos{width:22px;text-align:center;font-weight:800}.vx-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vx-time{font-weight:800;font-variant-numeric:tabular-nums}' +
      '.vx-note{margin-top:8px;font-size:.78rem;color:var(--text-muted);text-align:center}' +
      '.daily-info{margin:0 0 14px;padding:12px;border-radius:16px;background:rgba(255,255,255,.7);color:var(--text-navy)}' +
      '.di-tag{display:inline-block;font-size:.65rem;font-weight:800;letter-spacing:1px;background:#FDE2E2;color:#C53030;border-radius:8px;padding:2px 8px}' +
      '.di-main{font-weight:800;font-size:1.15rem;margin-top:6px}.di-sub{font-size:.8rem;color:var(--text-muted);margin-top:2px}.di-done{margin-top:8px;font-weight:700;font-size:.82rem;color:#1F7A55}';
    document.head.appendChild(css);

    ['showResultModal', 'showVictoryModal'].forEach(function (k) { var o = app[k].bind(app); app[k] = function (a) { clearExtra(); return o(a); }; });

    var rd = app.renderDailyChallenge.bind(app);
    app.renderDailyChallenge = function () { rd(); renderDaily(app); };
    app.start1v1Matchmaking = function () { startBattle(app); };
    app.cancel1v1Matchmaking = cancelBattle;

    var ol = app.launchBendingLevel.bind(app);
    app.launchBendingLevel = function (l, d) {
      bclear();
      var m = modeOf(l);
      ol(l, d);
      var eng = app.bendingEngine, e = entry(l);
      if (!m) { var h = $('pvp-live-hud'); if (h && !(window.ArroutRoom && window.ArroutRoom.inGame)) h.style.display = 'none'; return; }
      if (!eng || !e) return;
      var t = $('puzzle-level-title'); if (t) t.textContent = ({ daily: 'Daily Challenge', room: 'Room Race', battle: 'Battle' })[m];
      if (m === 'daily') { var h2 = $('pvp-live-hud'); if (h2) h2.style.display = 'none'; hookDaily(app, eng, l); }
      if (m === 'battle') hookBattle(app, eng, l);
    };

    var sw = app.switchScreen.bind(app);
    app.switchScreen = function (name, lvl, upd) {
      if (name !== 'puzzle' && !app._holding) {
        if (B.opp && !B.opp.over && B.opp.pot) {            // leaving a paid match = forfeit
          try { window.storageManager.recordBattle(false); } catch (e) {}
          toast('You left the match. ' + B.opp.name + ' takes the pot.');
        }
        var pb = $('pvp-pot-badge'); if (pb) pb.style.display = 'none';
        B.cur = null; bclear();
        if (modeOf(app.currentLevelNum)) app.currentLevelNum = progressLevel();
        var h = $('pvp-live-hud'); if (h && !(window.ArroutRoom && window.ArroutRoom.inGame)) h.style.display = 'none';
      }
      return sw(name, lvl, upd);
    };
    window.ArroutModes = { SETS: SETS, entry: entry, modeOf: modeOf, fmt: fmt, setExtra: setExtra, clearExtra: clearExtra, boardHtml: boardHtml };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
