/* =====================================================================
   PLAY WITH FRIENDS: rooms
   - Create Room: makes a 5 letter code + share link
   - Join Room: enter the code (or open the shared link)
   - Host presses Start: everyone plays the same level, first to clear wins
   Transport: uses the live "room" service when the page runs where it exists,
   otherwise falls back to BroadcastChannel (works between tabs of one browser).
   To use a real server (Firebase, WebSocket...), replace getTransport() only.
   ===================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
  var R = { code: null, host: false, conn: null, unsub: null, name: '', round: 0, inGame: false, keepRoom: false, over: false, myLeft: null, lastGo: 0, level: 1 };
  window.ArroutRoom = R;

  function toast(m) { if (window.showToast) window.showToast(m); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function myName() {
    var n = '';
    try { n = (window.storageManager && window.storageManager.data && window.storageManager.data.username) || ''; } catch (e) {}
    return n && n !== 'ArrowPilot' ? n : (n || 'Player') + ' ' + (100 + Math.floor(Math.random() * 900));
  }

  /* ---------- transport ---------- */
  function bcJoin(name) {
    var ch = new BroadcastChannel('arrout-room-' + name), id = Math.random().toString(36).slice(2, 10);
    var peers = new Map(), mine = {}, subs = new Set();
    function list() {
      var out = [{ peer: id, isMe: true, sameTab: true, kind: 'viewer', presence: mine }];
      peers.forEach(function (v, k) { out.push({ peer: k, isMe: false, sameTab: false, kind: 'viewer', presence: v.presence }); });
      return out;
    }
    function emit() { var l = list(); subs.forEach(function (f) { try { f({ peers: l }); } catch (e) {} }); }
    function send(t) { ch.postMessage({ t: t, id: id, presence: mine }); }
    ch.onmessage = function (e) {
      var m = e.data; if (!m || m.id === id) return;
      if (m.t === 'bye') { peers.delete(m.id); emit(); return; }
      peers.set(m.id, { presence: m.presence || {}, last: Date.now() });
      if (m.t === 'hello') send('pres');
      emit();
    };
    send('hello');
    var timer = setInterval(function () {
      send('pres'); var now = Date.now(), gone = false;
      peers.forEach(function (v, k) { if (now - v.last > 6000) { peers.delete(k); gone = true; } });
      if (gone) emit();
    }, 1500);
    return {
      presence: function (p) { mine = Object.assign({}, mine, p); send('pres'); emit(); },
      peers: list,
      onPeers: function (f) { subs.add(f); return function () { subs.delete(f); }; },
      leave: function () { try { send('bye'); } catch (e) {} clearInterval(timer); ch.close(); subs.clear(); }
    };
  }
  /* ---------- Firebase Firestore Room Transport ---------- */
  function fbJoin(name) {
    var db = firebase.firestore();
    var authUser = (firebase.auth && firebase.auth().currentUser);
    var smData = (window.storageManager && window.storageManager.data) || {};
    var myId = authUser ? authUser.uid : (smData.playerId || ('p_' + Math.random().toString(36).slice(2, 10)));
    var docRef = db.collection('rooms').doc(name);
    var peersMap = new Map();
    var mine = {};
    var subs = new Set();
    var active = true;

    function list() {
      var out = [{ peer: myId, isMe: true, sameTab: false, kind: 'viewer', presence: mine }];
      peersMap.forEach(function (v, k) {
        out.push({ peer: k, isMe: false, sameTab: false, kind: 'viewer', presence: v.presence });
      });
      return out;
    }

    function emit() {
      var l = list();
      subs.forEach(function (f) { try { f({ peers: l }); } catch (e) {} });
    }

    function sendPresence() {
      if (!active) return;
      var memberPayload = {};
      memberPayload[myId] = {
        presence: mine,
        lastSeen: Date.now()
      };
      var update = {
        code: name.replace(/^r/, ''),
        lastActivity: Date.now(),
        members: memberPayload
      };
      docRef.set(update, { merge: true }).catch(function (err) {
        console.error('[FirebaseRoom] update error:', err);
      });
    }

    var unsubSnapshot = docRef.onSnapshot(function (doc) {
      if (!active) return;
      if (!doc.exists) {
        peersMap.clear();
        emit();
        return;
      }
      var data = doc.data() || {};
      var members = data.members || {};
      var now = Date.now();
      peersMap.clear();

      Object.keys(members).forEach(function (pid) {
        if (pid === myId) return;
        var m = members[pid];
        if (!m) return;
        // prune only if inactive > 90s
        if (m.lastSeen && (now - m.lastSeen > 90000)) return;
        peersMap.set(pid, {
          presence: m.presence || {},
          last: m.lastSeen || now
        });
      });
      emit();
    }, function (err) {
      console.warn('[FirebaseRoom] onSnapshot error:', err);
    });

    async function refreshDoc() {
      try {
        var doc = await docRef.get();
        if (doc && doc.exists) {
          var data = doc.data() || {};
          var members = data.members || {};
          var now = Date.now();
          peersMap.clear();
          Object.keys(members).forEach(function (pid) {
            if (pid === myId) return;
            var m = members[pid];
            if (!m) return;
            if (m.lastSeen && (now - m.lastSeen > 90000)) return;
            peersMap.set(pid, {
              presence: m.presence || {},
              last: m.lastSeen || now
            });
          });
          emit();
        }
        return list();
      } catch (e) {
        return list();
      }
    }

    var timer = setInterval(function () {
      if (!active) return;
      var hbMember = {};
      hbMember[myId] = {
        presence: mine,
        lastSeen: Date.now()
      };
      docRef.set({
        lastActivity: Date.now(),
        members: hbMember
      }, { merge: true }).catch(function () {});
    }, 4000);

    // Auto-poll every 3s in lobby to ensure player counts are always fresh
    var pollTimer = setInterval(function () {
      if (!active || R.inGame) return;
      refreshDoc();
    }, 3000);

    return {
      presence: function (p) {
        mine = Object.assign({}, mine, p);
        sendPresence();
        emit();
      },
      peers: list,
      refresh: refreshDoc,
      onPeers: function (f) {
        subs.add(f);
        try { f({ peers: list() }); } catch (e) {}
        return function () { subs.delete(f); };
      },
      leave: function () {
        active = false;
        clearInterval(timer);
        clearInterval(pollTimer);
        if (unsubSnapshot) { try { unsubSnapshot(); } catch (e) {} unsubSnapshot = null; }
        subs.clear();
        var del = {};
        del['members.' + myId] = firebase.firestore.FieldValue.delete();
        del['lastActivity'] = Date.now();
        docRef.update(del).catch(function () {});
      }
    };
  }

  function getTransport() {
    try {
      if (typeof firebase !== 'undefined' && firebase.firestore && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && !window.FIREBASE_CONFIG.apiKey.includes('YOUR_API_KEY')) {
        return Promise.resolve({
          kind: 'live',
          join: function (n) { return fbJoin(n); }
        });
      }
    } catch (e) {}
    if (typeof BroadcastChannel !== 'undefined') return Promise.resolve({ kind: 'local', join: function (n) { return bcJoin(n); } });
    return Promise.resolve(null);
  }

  /* ---------- views ---------- */
  function show(view) {
    ['menu', 'join', 'lobby'].forEach(function (v) { $('room-view-' + v).hidden = v !== view; });
  }
  function newCode() { var c = ''; for (var i = 0; i < 5; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]; return c; }
  function linkFor(code) { return location.href.split('#')[0] + '#room-' + code; }

  function renderLobby(peers) {
    var me = peers.filter(function (p) { return p.isMe; });
    $('room-count').textContent = peers.length;
    var box = $('room-players'); box.innerHTML = '';
    peers.forEach(function (p) {
      var d = document.createElement('span'); d.className = 'room-chip' + (p.isMe ? ' me' : '');
      d.textContent = (p.presence && p.presence.name || 'Player') + (p.isMe ? ' (you)' : '') + (p.presence && p.presence.host ? ' \u2605' : '');
      box.appendChild(d);
    });
    if (R.host) {
      $('room-start').hidden = false;
      $('room-start').disabled = peers.length < 2;
      $('room-start').style.opacity = peers.length < 2 ? '.5' : '1';
      $('room-wait').textContent = peers.length < 2 ? 'Waiting for friends to join. Share the link or the code.' : 'Everyone here? Press Start when ready.';
    } else {
      $('room-wait').textContent = 'Waiting for the host to start the game\u2026';
    }
  }

  async function enterRoom(code, host) {
    var t = await getTransport();
    if (!t) { toast('Rooms are not available on this device.'); return false; }
    leaveRoom(true);
    R.code = code; R.host = host; R.over = false; R.name = myName(); R.lastGo = 0;
    R.level = (hash('arrout' + code) % 100) + 1;
    R.conn = t.join('r' + code);
    R.conn.presence({ name: R.name, host: host, left: null, go: 0 });
    R.unsub = R.conn.onPeers(onPeers);
    $('room-code').textContent = code.toUpperCase();
    $('room-link').value = linkFor(code);
    $('room-role-label').textContent = host ? 'Your room' : 'Joined room';
    $('room-share-block').style.display = host ? '' : 'none';
    var ln = $('room-local-note'); if (ln) ln.hidden = (t.kind !== 'local');
    show('lobby');
    onPeers({ peers: R.conn.peers() });
    return true;
  }

  function leaveRoom(silent) {
    if (R.unsub) { try { R.unsub(); } catch (e) {} R.unsub = null; }
    if (R.conn) { try { R.conn.leave(); } catch (e) {} R.conn = null; }
    R.code = null; R.inGame = false; R.over = false;
    var hud = $('pvp-live-hud'); if (hud) hud.style.display = 'none';
    if (!silent) show('menu');
  }

  /* ---------- peers: lobby updates, game start, opponent progress ---------- */
  function onPeers(c) {
    var peers = c.peers || [];
    if (!R.inGame) {
      renderLobby(peers);
      var go = 0; peers.forEach(function (p) { if (!p.isMe && p.presence && p.presence.go > go) go = p.presence.go; });
      if (!R.host && go > R.lastGo) { R.lastGo = go; startGame(); }
      return;
    }
    // in game: opponent progress
    var opps = peers.filter(function (p) { return !p.isMe; });
    var lefts = opps.map(function (p) { return p.presence && p.presence.left; }).filter(function (x) { return typeof x === 'number'; });
    var best = lefts.length ? Math.min.apply(null, lefts) : null;
    var leader = null; opps.forEach(function (p) { if (p.presence && p.presence.left === best) leader = p; });
    var total = R.total || 1;
    if ($('pvp-opp-name')) $('pvp-opp-name').textContent = leader ? leader.presence.name : (opps[0] && opps[0].presence.name) || 'Friend';
    if ($('pvp-opp-count')) $('pvp-opp-count').textContent = best === null ? '-' : best + ' Left';
    if ($('pvp-opp-progress-bar')) $('pvp-opp-progress-bar').style.width = best === null ? '0%' : Math.round((1 - best / total) * 100) + '%';
    evaluate();
  }

  /* ---------- round result: first to finish wins, within 0.5 s is a tie ---------- */
  var TIE_MS = 500, SETTLE_MS = 1500;
  function roundRows() {
    var rows = [];
    R.conn.peers().forEach(function (p) {
      var pr = p.presence || {};
      if (!p.isMe && typeof pr.left !== 'number') return;          // not playing this round
      rows.push({ name: p.isMe ? R.name : (pr.name || 'Player'), me: !!p.isMe,
        ms: p.isMe ? R.myMs : (typeof pr.ms === 'number' ? pr.ms : null), failed: p.isMe ? !!R.myFailed : !!pr.failed });
    });
    return rows;
  }
  function evaluate() {
    if (!R.inGame || R.over || !R.conn) return;
    var rows = roundRows();
    if (R.conn.peers().length <= 1 && R.myMs === null && !R.myFailed) { finishRound(null); return; }     // everyone else left
    var fin = rows.filter(function (r) { return r.ms !== null; });
    var pend = rows.filter(function (r) { return r.ms === null && !r.failed; });
    if (!fin.length) { if (!pend.length) decide(rows); return; }               // all failed
    if (!pend.length) { decide(rows); return; }
    if (!R.settleAt) { R.settleAt = Date.now() + SETTLE_MS; setTimeout(evaluate, SETTLE_MS + 60); }
    if (Date.now() >= R.settleAt) decide(rows);
  }
  function decide(rows) {
    if (R.over) return; R.over = true;
    var eng = window.app.bendingEngine; if (eng) eng.isLocked = true;
    var M = window.ArroutModes;
    var order = rows.slice().sort(function (a, b) {
      if (a.ms === null && b.ms === null) return (a.failed ? 1 : 0) - (b.failed ? 1 : 0);
      if (a.ms === null) return 1; if (b.ms === null) return -1; return a.ms - b.ms; });
    var fin = order.filter(function (r) { return r.ms !== null; });
    var emoji, title, winners = [], note = '';
    if (!fin.length) { emoji = '\uD83D\uDE05'; title = 'Nobody solved it'; note = 'Everyone ran out of lives.'; }
    else {
      winners = fin.filter(function (r) { return r.ms - fin[0].ms <= TIE_MS; });
      var names = winners.map(function (r) { return r.name; }).join(' & ');
      var iWon = winners.some(function (r) { return r.me; });
      if (winners.length > 1) { emoji = '\uD83E\uDD1D'; title = "It's a tie: " + names; note = 'Finishing within 0.5 seconds counts as the same time.'; }
      else { emoji = iWon ? '\uD83C\uDFC6' : '\uD83D\uDE2E'; title = 'Winner: ' + names; }
    }
    window.app.showResultModal({ emoji: emoji, title: title, button: 'BACK TO ROOM', nextAction: backToRoom });
    if (M) M.setExtra(M.boardHtml(order, winners, note));
  }

  function startGame() {
    R.inGame = true; R.over = false; R.myLeft = null; R.myMs = null; R.myFailed = false; R.settleAt = 0;
    var NR = (window.ARROUT_ROOM_LEVELS || []).length;                  // same hard puzzle for everyone in the room
    if (NR) R.level = 20001 + (hash('arrout' + R.code + ':' + R.lastGo) % NR);
    var hud = $('pvp-live-hud'); if (hud) hud.style.display = 'block';
    window.app.navigate('puzzle', R.level);
  }

  // called after the app has built the level: hook the board
  function hookEngine(eng) {
    R.total = eng.total; R.t0 = performance.now(); R.myMs = null; R.myFailed = false; R.settleAt = 0;
    R.conn && R.conn.presence({ left: eng.total, ms: null, failed: false });
    var oc = eng.onCountChange;
    eng.onCountChange = function (n) { oc(n); R.myLeft = n; if (R.conn) R.conn.presence({ left: n }); };
    eng.onComplete = function () {
      if (R.over || R.myMs !== null) return;
      R.myMs = Math.round(performance.now() - R.t0); eng.isLocked = true;
      if (R.conn) R.conn.presence({ left: 0, ms: R.myMs });
      toast('Solved in ' + (R.myMs / 1000).toFixed(1) + 's. Waiting for the others\u2026');
      evaluate();
    };
    eng.onFail = function () {
      if (R.over || R.myFailed) return;
      R.myFailed = true; eng.isLocked = true;
      if (R.conn) R.conn.presence({ failed: true });
      toast('Out of lives. Waiting for the result\u2026');
      evaluate();
    };
  }

  function finishRound(won, otherName) {
    if (R.over) return; R.over = true;
    var eng = window.app.bendingEngine; if (eng) eng.isLocked = true;
    if (won === null) {
      window.app.showResultModal({ emoji: '\uD83D\uDC4B', title: 'Everyone else left', button: 'BACK TO ROOM', nextAction: backToRoom });
    } else if (won) {
      if (R.conn) R.conn.presence({ left: 0, finishedAt: Date.now() });
      window.app.showResultModal({ emoji: '\uD83C\uDFC6', title: 'You won the round!', button: 'BACK TO ROOM', nextAction: backToRoom });
    } else {
      window.app.showResultModal({ emoji: '\uD83D\uDE2E', title: (otherName || 'A friend') + ' finished first', button: 'BACK TO ROOM', nextAction: backToRoom });
    }
  }

  function backToRoom() {
    R.inGame = false; R.over = false; R.keepRoom = true;
    var hud = $('pvp-live-hud'); if (hud) hud.style.display = 'none';
    if (R.conn) R.conn.presence({ left: null, failed: false, ms: null, finishedAt: 0 });
    window.app.navigate('room');
    setTimeout(function () { R.keepRoom = false; }, 300);
    if (R.conn) onPeers({ peers: R.conn.peers() });
  }

  /* ---------- buttons ---------- */
  function wire() {
    var refreshBtn = $('room-refresh-btn');
    if (refreshBtn) {
      refreshBtn.onclick = async function () {
        if (refreshBtn.classList.contains('spinning')) return;
        refreshBtn.classList.add('spinning');
        toast('Refreshing player list...');
        if (R.conn) {
          try {
            R.conn.presence({ name: R.name, host: R.host, left: null, go: 0 });
          } catch (e) {}
          if (typeof R.conn.refresh === 'function') {
            await R.conn.refresh();
          }
          onPeers({ peers: R.conn.peers() });
        }
        setTimeout(function () {
          refreshBtn.classList.remove('spinning');
        }, 600);
      };
    }
    $('room-create').onclick = async function () {
      var btn = $('room-create');
      btn.disabled = true;
      btn.textContent = 'CREATING...';
      var code = newCode();
      await enterRoom(code, true);
      btn.disabled = false;
      btn.textContent = 'CREATE ROOM';
    };
    $('room-join').onclick = function () { $('room-join-error').hidden = true; $('room-code-input').value = ''; show('join'); setTimeout(function () { $('room-code-input').focus(); }, 50); };
    $('room-join-back').onclick = function () { show('menu'); };
    $('room-code-input').oninput = function () { this.value = this.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5); };
    $('room-code-input').onkeydown = function (e) { if (e.key === 'Enter') $('room-join-go').click(); };
    $('room-join-go').onclick = async function () {
      var c = $('room-code-input').value.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (c.length !== 5) { $('room-join-error').textContent = 'The code has 5 letters or numbers.'; $('room-join-error').hidden = false; return; }
      var errEl = $('room-join-error');
      errEl.hidden = true;
      var btn = $('room-join-go');
      btn.disabled = true;
      btn.textContent = 'CHECKING...';

      // Check Firestore room existence
      if (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps.length) {
        try {
          var snap = await firebase.firestore().collection('rooms').doc('r' + c).get();
          if (!snap.exists) {
            btn.disabled = false;
            btn.textContent = 'JOIN';
            errEl.textContent = 'Room not found. Check the code with the host.';
            errEl.hidden = false;
            return;
          }
          var rData = snap.data() || {};
          var members = rData.members || {};
          var now = Date.now();
          var hasHost = Object.values(members).some(function(m) {
            return m && m.presence && m.presence.host && (!m.lastSeen || (now - m.lastSeen < 120000));
          });
          if (!hasHost) {
            btn.disabled = false;
            btn.textContent = 'JOIN';
            errEl.textContent = 'Room found, but host is not active. Ask host to re-open.';
            errEl.hidden = false;
            return;
          }
        } catch (e) {
          console.warn('[Rooms] Firestore check error:', e);
        }
      }

      btn.disabled = false;
      btn.textContent = 'JOIN';
      var ok = await enterRoom(c, false);
      if (!ok) {
        errEl.textContent = 'Could not enter room. Please try again.';
        errEl.hidden = false;
      }
    };
    $('room-share').onclick = async function () {
      var text = 'Join my Arrout room! Code: ' + R.code.toUpperCase(), link = linkFor(R.code);
      try { if (navigator.share) { await navigator.share({ title: 'Arrout', text: text, url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text + ' ' + link); toast('Link copied. Send it to your friends.'); }
      catch (e) { $('room-link').focus(); $('room-link').select(); toast('Copy the link below and send it.'); }
    };
    $('room-copy-code').onclick = async function () {
      try { await navigator.clipboard.writeText(R.code.toUpperCase()); toast('Code copied'); }
      catch (e) { toast('Your code is ' + R.code.toUpperCase()); }
    };
    $('room-start').onclick = function () {
      if (!R.conn || !R.host) return;
      R.round = Date.now(); R.lastGo = R.round;
      R.conn.presence({ go: R.round });
      var conn = R.conn;
      setTimeout(function () { try { conn.presence({ go: 0 }); } catch (e) {} }, 5000);   // late joiners must not see an old start
      startGame();
    };
    $('room-leave').onclick = function () { leaveRoom(false); };
    $('room-back').onclick = function () { leaveRoom(true); window.app.navigate('home'); };
  }

  function hookApp() {
    var app = window.app; if (!app) return;
    var orig = app.launchBendingLevel.bind(app);
    app.launchBendingLevel = function (l, d) { orig(l, d); if (R.inGame && app.bendingEngine) hookEngine(app.bendingEngine); };
    var sw = app.switchScreen.bind(app);
    app.switchScreen = function (name, lvl, upd) {
      if (R.code && name !== 'puzzle' && name !== 'room' && !R.keepRoom && !app._holding) leaveRoom(true);
      if (name === 'room' && !R.code) show('menu');
      sw(name, lvl, upd);
    };
    // shared link: #room-abcde
    function fromHash() {
      var m = /^#room-([a-z0-9]{5})$/i.exec(location.hash || '');
      if (!m) return;
      app.navigate('room');
      setTimeout(function () { show('join'); $('room-code-input').value = m[1].toLowerCase(); $('room-join-go').click(); }, 80);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  function boot() { wire(); hookApp(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
