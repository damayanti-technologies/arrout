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
      (did ? '<div class="di-done">✅ Cleared today in ' + fmt(did.ms) + '. A new puzzle comes tomorrow.</div>' : '<div class="di-sub">Clear it today to grow your streak.</div>');
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
      try { window.storageManager.save(); } catch (e) {}
      app.showVictoryModal({ title: 'Daily Challenge Cleared!', time: stats.totalTime + 's', moves: stats.moves,
        nextAction: function () { app.navigate('daily', null, { replace: true }); } });
      setExtra('<div class="vx-note">🔥 Streak: ' + s + ' day' + (s === 1 ? '' : 's') + '</div>');
    };
  }

  /* ================= BATTLE (Real-Time 1v1 with Online Players & 15s Bot Fallback) ================= */
  var NAMES = ['Vortex_Pilot', 'NeonShadow', 'CyberArcher', 'NovaRider', 'PulseQueen', 'VectorKing', 'ZenithArrow', 'GlitchSniper', 'QuantumDash', 'AeroMaster', 'HyperSonic', 'SolarFlare'];
  var B = {
    timers: [],
    countdownInterval: null,
    scanInterval: null,
    tick: null,
    unsubs: [],
    bcLobby: null,
    bcRoom: null,
    opp: null,
    cur: null,
    next: null,
    cleanQueue: null,
    broadcastSync: null,
    searching: false
  };

  function bclear() {
    B.timers.forEach(clearTimeout);
    B.timers = [];
    if (B.countdownInterval) {
      clearInterval(B.countdownInterval);
      B.countdownInterval = null;
    }
    if (B.scanInterval) {
      clearInterval(B.scanInterval);
      B.scanInterval = null;
    }
    if (B.tick) {
      clearInterval(B.tick);
      B.tick = null;
    }
    if (B.unsubs) {
      B.unsubs.forEach(function (u) { try { if (typeof u === 'function') u(); } catch (e) {} });
      B.unsubs = [];
    }
    if (B.bcLobby) {
      try { B.bcLobby.close(); } catch (e) {}
      B.bcLobby = null;
    }
    if (B.bcRoom) {
      try { B.bcRoom.close(); } catch (e) {}
      B.bcRoom = null;
    }
    if (B.cleanQueue) {
      try { B.cleanQueue(); } catch (e) {}
      B.cleanQueue = null;
    }
    B.broadcastSync = null;
    B.searching = false;
    B.opp = null;
  }

  function battleScreenName() {
    var s = $('btn-start-matchmaking');
    var sec = s && s.closest('section');
    return sec ? sec.id.replace('screen-', '') : 'home';
  }

  function getBattlePlayer() {
    var hasAuth = typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser;
    var smData = (window.storageManager && window.storageManager.data) || {};
    var uid = (hasAuth && firebase.auth().currentUser.uid) ||
              smData.playerId ||
              (function () {
                var gen = 'p_' + Math.random().toString(36).slice(2, 10);
                if (window.storageManager && window.storageManager.data) {
                  window.storageManager.data.playerId = gen;
                  try { window.storageManager.save(); } catch (e) {}
                }
                return gen;
              })();
    var name = (hasAuth && (firebase.auth().currentUser.displayName || firebase.auth().currentUser.email)) ||
               smData.username ||
               'Player';
    return { uid: uid, name: name };
  }

  function startBattle(app) {
    bclear();
    B.next = null;
    B.cur = null;

    var st = $('matchmaking-status-text');
    var radar = $('matchmaking-radar');
    var startBtn = $('btn-start-matchmaking');
    var actBox = $('matchmaking-actions');
    var timerBadge = $('matchmaking-timer-badge');
    var timerSec = $('matchmaking-timer-sec');
    var N = SETS.battle.get().length;

    if (!N) {
      toast('Battle puzzles are missing.');
      return;
    }

    var myIdx = Math.floor(Math.random() * N);
    var player = getBattlePlayer();
    var myUid = player.uid;
    var myName = player.name;

    B.searching = true;
    if (radar) radar.classList.add('searching');
    if (startBtn) startBtn.style.display = 'none';
    if (actBox) actBox.style.display = 'block';
    if (timerBadge) {
      timerBadge.style.display = 'inline-flex';
      timerBadge.style.background = '#EEF2FF';
      timerBadge.style.color = '#4F46E5';
    }

    var timeLeft = 15;
    function updateTimerUI(sec) {
      if (timerSec) timerSec.textContent = sec;
      if (st) st.innerHTML = 'Searching online players... <b style="color:var(--primary); font-variant-numeric:tabular-nums;">' + sec + 's</b>';
    }
    updateTimerUI(timeLeft);

    var matchResolved = false;

    function onMatchFound(match) {
      if (matchResolved) return;
      matchResolved = true;
      B.searching = false;

      // Stop searching countdown and queue scanning
      if (B.countdownInterval) { clearInterval(B.countdownInterval); B.countdownInterval = null; }
      if (B.scanInterval) { clearInterval(B.scanInterval); B.scanInterval = null; }
      if (B.cleanQueue) { try { B.cleanQueue(); } catch (e) {} B.cleanQueue = null; }
      if (B.bcLobby) { try { B.bcLobby.close(); } catch (e) {} B.bcLobby = null; }

      if (radar) radar.classList.remove('searching');
      if (actBox) actBox.style.display = 'none';

      if (timerBadge) {
        if (match.isBot) {
          timerBadge.style.background = '#F1F5F9';
          timerBadge.style.color = '#64748B';
          timerBadge.textContent = '🤖 BOT OPPONENT';
        } else {
          timerBadge.style.background = '#DCFCE7';
          timerBadge.style.color = '#15803D';
          timerBadge.textContent = '⚔️ OPPONENT FOUND!';
        }
      }

      if (st) {
        if (match.isBot) {
          st.innerHTML = 'No online opponent found.<br><span style="font-size:0.92rem;color:var(--text-navy);">Challenging AI Rival: <b>' + esc(match.name) + '</b> 🤖</span>';
        } else {
          st.innerHTML = 'Opponent Found: <b style="color:var(--primary);">' + esc(match.name) + '</b>! ⚔️';
        }
      }

      B.next = match;
      B.timers.push(setTimeout(function () {
        if (timerBadge) {
          timerBadge.style.display = 'none';
          timerBadge.style.background = '#EEF2FF';
          timerBadge.style.color = '#4F46E5';
          timerBadge.innerHTML = 'SEARCHING: <span id="matchmaking-timer-sec">15</span>s';
        }
        if (startBtn) startBtn.style.display = '';
        app.navigate('puzzle', SETS.battle.base + match.puzzleIdx);
      }, match.isBot ? 1100 : 900));
    }

    // 15-second countdown timer
    B.countdownInterval = setInterval(function () {
      timeLeft--;
      if (timeLeft > 0) {
        updateTimerUI(timeLeft);
      } else {
        // 15 seconds elapsed: fallback to AI bot rival!
        clearInterval(B.countdownInterval);
        B.countdownInterval = null;
        var botName = NAMES[Math.floor(Math.random() * NAMES.length)];
        onMatchFound({
          name: botName,
          uid: 'bot_' + Math.random().toString(36).slice(2, 8),
          isBot: true,
          puzzleIdx: myIdx
        });
      }
    }, 1000);

    // Transport 1: BroadcastChannel for instant local / multi-tab discovery
    try {
      var bc = new BroadcastChannel('arrout_battle_matchmaking');
      B.bcLobby = bc;
      bc.onmessage = function (e) {
        var m = e.data;
        if (!m || matchResolved) return;
        if (m.type === 'QUEUE_JOIN' && m.uid !== myUid) {
          if (myUid < m.uid) {
            var mId = 'bm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
            bc.postMessage({
              type: 'MATCH_ASSIGN',
              targetUid: m.uid,
              matchId: mId,
              oppUid: myUid,
              oppName: myName,
              puzzleIdx: myIdx
            });
            onMatchFound({
              matchId: mId,
              name: m.name,
              uid: m.uid,
              puzzleIdx: myIdx,
              isBot: false,
              isHost: true
            });
          }
        } else if (m.type === 'MATCH_ASSIGN' && m.targetUid === myUid) {
          onMatchFound({
            matchId: m.matchId,
            name: m.oppName,
            uid: m.oppUid,
            puzzleIdx: m.puzzleIdx,
            isBot: false,
            isHost: false
          });
        }
      };
      bc.postMessage({ type: 'QUEUE_JOIN', uid: myUid, name: myName, puzzleIdx: myIdx, ts: Date.now() });
    } catch (e) {}

    // Transport 2: Firebase Firestore for real-time online matchmaking across devices
    var hasFb = typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length;
    if (hasFb) {
      try {
        var db = firebase.firestore();
        var myQueueRef = db.collection('battles_queue').doc(myUid);
        var myPairRef = db.collection('rooms').doc('battle_pair_' + myUid);

        var unsubPair = myPairRef.onSnapshot(function (snap) {
          if (matchResolved || !snap.exists) return;
          var d = snap.data();
          if (d && d.matchId && d.opponentUid) {
            myPairRef.delete().catch(function () {});
            onMatchFound({
              matchId: d.matchId,
              name: d.opponentName || 'Online Rival',
              uid: d.opponentUid,
              puzzleIdx: (typeof d.puzzleIdx === 'number') ? d.puzzleIdx : myIdx,
              isBot: false,
              isHost: false
            });
          }
        });
        B.unsubs.push(unsubPair);

        B.cleanQueue = function () {
          try { myQueueRef.delete().catch(function () {}); } catch (e) {}
          try { myPairRef.delete().catch(function () {}); } catch (e) {}
        };

        myQueueRef.set({
          uid: myUid,
          name: myName,
          joinedAt: Date.now(),
          puzzleIdx: myIdx
        }).catch(function (err) {
          console.warn('[BattleQueue] set error:', err);
        });

        function scanQueue() {
          if (matchResolved || !B.searching) return;
          db.collection('battles_queue').get().then(function (snapshot) {
            if (matchResolved || !B.searching) return;
            var now = Date.now(), candidates = [];
            snapshot.forEach(function (doc) {
              var data = doc.data();
              if (data && data.uid && data.uid !== myUid && (now - (data.joinedAt || 0) < 22000)) {
                candidates.push(data);
              }
            });
            if (candidates.length > 0) {
              candidates.sort(function (a, b) { return (a.joinedAt || 0) - (b.joinedAt || 0); });
              var opp = candidates[0];
              var mId = 'bm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
              var sharedIdx = (typeof opp.puzzleIdx === 'number') ? opp.puzzleIdx : myIdx;

              db.collection('rooms').doc('battle_pair_' + opp.uid).set({
                matchId: mId,
                opponentUid: myUid,
                opponentName: myName,
                puzzleIdx: sharedIdx,
                createdAt: Date.now()
              }).catch(function () {});

              db.collection('rooms').doc(mId).set({
                matchId: mId,
                puzzleIdx: sharedIdx,
                p1: { uid: opp.uid, name: opp.name },
                p2: { uid: myUid, name: myName },
                status: 'active',
                createdAt: Date.now()
              }).catch(function () {});

              myQueueRef.delete().catch(function () {});

              onMatchFound({
                matchId: mId,
                name: opp.name,
                uid: opp.uid,
                puzzleIdx: sharedIdx,
                isBot: false,
                isHost: true
              });
            }
          }).catch(function (err) {
            console.warn('[BattleQueue] scan error:', err);
          });
        }

        scanQueue();
        B.scanInterval = setInterval(scanQueue, 2200);
      } catch (e) {
        console.warn('[BattleQueue] init error:', e);
      }
    }
  }

  function cancelBattle() {
    bclear();
    B.next = null;
    B.cur = null;
    var st = $('matchmaking-status-text');
    var radar = $('matchmaking-radar');
    var startBtn = $('btn-start-matchmaking');
    var actBox = $('matchmaking-actions');
    var timerBadge = $('matchmaking-timer-badge');
    if (st) st.textContent = 'Ready to Duel';
    if (radar) radar.classList.remove('searching');
    if (timerBadge) {
      timerBadge.style.display = 'none';
      timerBadge.style.background = '#EEF2FF';
      timerBadge.style.color = '#4F46E5';
      timerBadge.innerHTML = 'SEARCHING: <span id="matchmaking-timer-sec">15</span>s';
    }
    if (actBox) actBox.style.display = 'none';
    if (startBtn) startBtn.style.display = '';
  }

  function hookBattle(app, eng, n) {
    var opp = B.next || B.cur || { name: NAMES[0], isBot: true };
    B.cur = opp;
    B.next = null;

    var isBot = opp.isBot !== false;
    var total = eng.total;
    var N = total;
    var t0 = performance.now();
    var player = getBattlePlayer();
    var myUid = player.uid;
    var myName = player.name;

    B.opp = { name: opp.name, isBot: isBot, matchId: opp.matchId, myUid: myUid, done: false, over: false };

    var hud = $('pvp-live-hud');
    if (hud) hud.style.display = 'block';

    if ($('pvp-opp-name')) {
      $('pvp-opp-name').innerHTML = esc(opp.name) + (isBot
        ? ' <span style="font-size:0.7rem;padding:2px 7px;border-radius:6px;background:#F1F5F9;color:#64748B;font-weight:800;letter-spacing:0.5px;margin-left:4px;">BOT</span>'
        : ' <span style="font-size:0.7rem;padding:2px 7px;border-radius:6px;background:#DCFCE7;color:#15803D;font-weight:800;letter-spacing:0.5px;margin-left:4px;">🟢 LIVE</span>');
    }

    function paint(left) {
      if ($('pvp-opp-count')) $('pvp-opp-count').textContent = left + ' Left';
      if ($('pvp-opp-progress-bar')) $('pvp-opp-progress-bar').style.width = Math.round((1 - left / N) * 100) + '%';
    }
    paint(N);

    var again = function () {
      bclear();
      app.navigate(battleScreenName(), null, { replace: true });
    };

    function end(emoji, title, rows, winners, note, outcome) {
      var b = B.opp;
      if (b) b.over = true;
      if (B.tick) { clearInterval(B.tick); B.tick = null; }
      eng.isLocked = true;
      app.showResultModal({ emoji: emoji, title: title, button: 'BACK TO BATTLE', nextAction: again });
      setExtra(boardHtml(rows, winners, note));
    }

    if (isBot) {
      // ---------------- AI Bot Rival Simulation ----------------
      var T = N * (2.6 + Math.random() * 1.0) * 1000;
      B.opp.T = T;
      B.tick = setInterval(function () {
        var b = B.opp;
        if (!b || b.over) return;
        var el = performance.now() - t0, f = Math.min(1, el / T);
        f = f * f * (3 - 2 * f) * 0.35 + f * 0.65;
        var left = Math.max(0, N - Math.floor(N * f + (Math.random() < 0.3 ? 1 : 0)));
        if (el >= T) {
          paint(0);
          b.done = true;
          clearInterval(B.tick);
          B.tick = null;
          B.timers.push(setTimeout(function () {
            if (b.over) return;
            var rows = [
              { name: b.name, ms: T, me: false },
              { name: myName, ms: null, me: true, failed: false }
            ];
            try { window.storageManager.recordBattle(false); } catch (e) {}
            end('😮', b.name + ' wins!', rows, [rows[0]], 'They cleared all arrows first.', 'lose');
          }, 500));
          return;
        }
        paint(left);
      }, 600);

      eng.onFail = function () {
        var b = B.opp;
        if (!b || b.over) return;
        var rows = [
          { name: b.name, ms: null, me: false },
          { name: myName, ms: null, me: true, failed: true }
        ];
        try { window.storageManager.recordBattle(false); } catch (e) {}
        end('😮', b.name + ' wins!', rows, [rows[0]], 'You ran out of lives.', 'lose');
      };

      eng.onComplete = function () {
        var b = B.opp;
        if (!b || b.over) return;
        var my = Math.round(performance.now() - t0);
        var rows = [
          { name: myName, ms: my, me: true },
          { name: b.name, ms: b.done ? T : null, me: false }
        ];
        if (b.done && my - T <= 500) {
          rows.sort(function (x, y) { return x.ms - y.ms; });
          end('🤝', "It's a tie!", rows, rows, 'Both finished within 0.5 seconds.', 'tie');
        } else {
          try { window.storageManager.recordBattle(true); } catch (e) {}
          end('🏆', myName + ' wins!', rows, [rows[0]], 'You cleared all arrows first! Nice one!', 'win');
        }
      };
    } else {
      // ---------------- Real Online Player Live Duel ----------------
      var roomBc = null;
      try {
        roomBc = new BroadcastChannel('arrout_battle_room_' + opp.matchId);
        B.bcRoom = roomBc;
      } catch (e) {}

      var hasFb = typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length;
      var roomDoc = (hasFb && opp.matchId) ? firebase.firestore().collection('rooms').doc(opp.matchId) : null;

      function syncProgress(data) {
        var payload = Object.assign({ uid: myUid, ts: Date.now() }, data);
        if (roomBc) {
          try { roomBc.postMessage(payload); } catch (e) {}
        }
        if (roomDoc) {
          var docUpdate = {};
          docUpdate['m_' + myUid] = payload;
          roomDoc.set(docUpdate, { merge: true }).catch(function () {});
        }
      }
      B.broadcastSync = syncProgress;

      // Initial state sync
      syncProgress({ left: N, total: N, status: 'playing' });

      function onOpponentData(data) {
        var b = B.opp;
        if (!b || b.over) return;
        if (typeof data.left === 'number') {
          paint(data.left);
        }
        if (data.status === 'win' || data.done) {
          b.done = true;
          paint(0);
          var oppMs = data.timeMs || Math.round(performance.now() - t0);
          var rows = [
            { name: opp.name, ms: oppMs, me: false },
            { name: myName, ms: null, me: true, failed: false }
          ];
          try { window.storageManager.recordBattle(false); } catch (e) {}
          end('😮', opp.name + ' wins!', rows, [rows[0]], 'They cleared all arrows first.', 'lose');
        } else if (data.status === 'fail' || data.failed) {
          var rows = [
            { name: myName, ms: Math.round(performance.now() - t0), me: true },
            { name: opp.name, ms: null, me: false, failed: true }
          ];
          try { window.storageManager.recordBattle(true); } catch (e) {}
          end('🏆', myName + ' wins!', rows, [rows[0]], opp.name + ' ran out of lives.', 'win');
        } else if (data.status === 'forfeit') {
          var rows = [
            { name: myName, ms: Math.round(performance.now() - t0), me: true },
            { name: opp.name, ms: null, me: false, failed: true }
          ];
          try { window.storageManager.recordBattle(true); } catch (e) {}
          end('🏆', 'Victory!', rows, [rows[0]], opp.name + ' left the match.', 'win');
        }
      }

      if (roomBc) {
        roomBc.onmessage = function (e) {
          var m = e.data;
          if (m && m.uid !== myUid) onOpponentData(m);
        };
      }

      if (roomDoc) {
        var unsubRoom = roomDoc.onSnapshot(function (snap) {
          if (!snap.exists) return;
          var d = snap.data();
          if (!d) return;
          Object.keys(d).forEach(function (k) {
            if (k.startsWith('m_') && k !== ('m_' + myUid)) {
              onOpponentData(d[k]);
            }
          });
        });
        B.unsubs.push(unsubRoom);
      }

      var oc = eng.onCountChange;
      eng.onCountChange = function (cnt) {
        if (oc) oc(cnt);
        syncProgress({ left: cnt, total: N, status: 'playing' });
      };

      eng.onFail = function () {
        var b = B.opp;
        if (!b || b.over) return;
        syncProgress({ status: 'fail', failed: true });
        var rows = [
          { name: opp.name, ms: null, me: false },
          { name: myName, ms: null, me: true, failed: true }
        ];
        try { window.storageManager.recordBattle(false); } catch (e) {}
        end('😮', opp.name + ' wins!', rows, [rows[0]], 'You ran out of lives.', 'lose');
      };

      eng.onComplete = function () {
        var b = B.opp;
        if (!b || b.over) return;
        var myMs = Math.round(performance.now() - t0);
        syncProgress({ left: 0, status: 'win', done: true, timeMs: myMs });
        var rows = [
          { name: myName, ms: myMs, me: true },
          { name: opp.name, ms: null, me: false }
        ];
        try { window.storageManager.recordBattle(true); } catch (e) {}
        end('🏆', myName + ' wins!', rows, [rows[0]], 'You cleared all arrows first! Nice speed!', 'win');
      };
    }
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
      if (name !== '1v1' && name !== 'puzzle' && B.searching) {
        cancelBattle();
      }
      if (name !== 'puzzle' && !app._holding) {
        if (B.opp && !B.opp.over) {
          try { window.storageManager.recordBattle(false); } catch (e) {}
          if (!B.opp.isBot && B.broadcastSync) {
            try { B.broadcastSync({ status: 'forfeit' }); } catch (e) {}
          }
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
