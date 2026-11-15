/* ===== Settings (in-game options) and editable username ===== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'arrout_settings_v1';
  var DEF = { sound: true, volume: 70, vibration: true, cheer: true, confetti: true, guide: false, speed: 'normal' };
  var MUL = { slow: 0.6, normal: 1, fast: 1.6 };
  var S = Object.assign({}, DEF);
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  window.arroutSettings = S;
  function sync() { S.speedMul = MUL[S.speed] || 1; }
  function save() { sync(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  sync();

  function toast(m) { if (window.showToast) window.showToast(m); }
  function applyAudio() {
    var a = window.soundEngine; if (!a) return;
    a.setMuted(!S.sound); a.setVolume(S.volume / 100);
  }

  function boot() {
    // controls <- saved values
    $('setting-sound-toggle').checked = !!S.sound;
    $('setting-volume-slider').value = S.volume;
    ['vibration', 'cheer', 'confetti', 'guide'].forEach(function (k) {
      var el = $('setting-' + k); el.checked = !!S[k];
      el.addEventListener('change', function () { S[k] = el.checked; save(); });
    });
    $('setting-sound-toggle').addEventListener('change', function (e) { S.sound = e.target.checked; save(); });
    $('setting-volume-slider').addEventListener('input', function (e) { S.volume = +e.target.value; save(); });
    var seg = $('setting-speed');
    function paintSeg() { seg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.speed === S.speed); }); }
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.speed = b.dataset.speed; save(); paintSeg(); });
    paintSeg(); applyAudio();

    // reset progress, with a confirm step inside the page
    var rb = $('btn-reset-data'), armed = false, t;
    rb.addEventListener('click', function () {
      if (!armed) { armed = true; rb.textContent = 'Tap again to erase all progress'; clearTimeout(t); t = setTimeout(function () { armed = false; rb.textContent = 'Reset Local Progress'; }, 3500); return; }
      try { window.StorageManager.resetAll(); } catch (e) {}
      try { history.replaceState(null, '', location.pathname + location.search + '#/'); } catch (e) {}
      location.reload();
    });

    // ---- External Links and Play Store Navigation ----
    function openExternal(url) {
      if (!url) return;
      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.openExternal === 'function') {
          window.AndroidBridge.openExternal(url);
          return;
        }
        if (window.AndroidBridge && typeof window.AndroidBridge.openUrl === 'function') {
          window.AndroidBridge.openUrl(url);
          return;
        }
      } catch (e) {}
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    function openPlayStore(pkg) {
      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.openPlayStore === 'function') {
          window.AndroidBridge.openPlayStore(pkg);
          return;
        }
      } catch (e) {}
      openExternal('https://play.google.com/store/apps/details?id=' + (pkg || 'com.webarrout.app'));
    }

    var rateBtn = $('link-rate-playstore');
    if (rateBtn) rateBtn.onclick = function () {
      if (window.app && typeof window.app.showRatingModal === 'function') {
        window.app.showRatingModal();
      } else {
        openPlayStore('com.webarrout.app');
      }
    };

    var moreAppsBtn = $('link-more-apps');
    if (moreAppsBtn) moreAppsBtn.onclick = function () { openPlayStore('com.sannivesham.app'); };

    var webBtn = $('link-website');
    if (webBtn) webBtn.onclick = function () { openExternal('https://damayanticrest.online'); };

    var privBtn = $('link-privacy');
    if (privBtn) privBtn.onclick = function () { openExternal('https://arrout.damayanticrest.online/privacy-policy/'); };

    var contactBtn = $('link-contact');
    if (contactBtn) contactBtn.onclick = function () { openExternal('mailto:contact@damayanticrest.online'); };

    // ---- display name sync (read-only) ----
    function current() {
      var authUser = window.FirebaseSync && window.FirebaseSync.user;
      if (authUser && (authUser.displayName || authUser.email)) {
        return authUser.displayName || authUser.email.split('@')[0];
      }
      try {
        var u = window.storageManager.data.username;
        if (u && u !== 'Player' && u !== 'ArrowPilot' && !u.startsWith('ArrowPilot_')) return u;
      } catch (e) {}
      return 'Arrow Pilot';
    }
    function paintNames() {
      var n = current();
      document.querySelectorAll('.user-name-display').forEach(function (el) { el.textContent = n; });
      var pd = $('profile-display-name');
      if (pd) pd.textContent = n;
      var hp = $('home-player-name');
      if (hp) hp.textContent = n;
    }
    paintNames();

    // keep the name display fresh whenever the profile screen opens
    if (window.app) {
      var rp = window.app.renderProfile.bind(window.app);
      window.app.renderProfile = function () { rp(); paintNames(); };
      paintNames();
      wirePause(window.app);
    }
  }

  /* ---- pause: settings / profile keep the puzzle exactly as it is ---- */
  function wirePause(app) {
    if (!app || app._pauseWired) return;
    app._pauseWired = true;
    var held = null, justBack = null, sw0 = app.switchScreen.bind(app);
    function drop() { if (held) { try { held.eng.destroy(); } catch (e) {} held = null; } }
    app.switchScreen = function (name, lvl, upd) {
      if (upd !== false) return sw0(name, lvl, upd);
      var overlay = name === 'settings' || name === 'profile', eng = app.bendingEngine;
      if (overlay && app.currentScreen === 'puzzle' && eng && !eng.won && !eng.dead && !eng.isLocked) {
        held = { eng: eng, level: app.currentLevelNum, at: Date.now() };
        app.bendingEngine = null; app._holding = true;
        try { return sw0(name, lvl, upd); } finally { app._holding = false; }
      }
      if (overlay && held) { app._holding = true; try { return sw0(name, lvl, upd); } finally { app._holding = false; } }
      if (name === 'puzzle' && justBack && Date.now() - justBack.at < 600 && (lvl == null || Number(lvl) === justBack.level)) return;
      if (held && name === 'puzzle' && (lvl == null || Number(lvl) === held.level)) {
        var h = held, launch = app.launchBendingLevel; held = null; justBack = { level: h.level, at: Date.now() };
        app.launchBendingLevel = function () {};
        try { sw0(name, lvl, upd); } finally { app.launchBendingLevel = launch; }
        app.bendingEngine = h.eng; app.currentLevelNum = h.level;
        if (h.level < 20001 && h.eng.startTime) h.eng.startTime += Date.now() - h.at;
        return;
      }
      if (held) drop();
      return sw0(name, lvl, upd);
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
