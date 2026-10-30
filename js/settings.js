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

    // ---- username ----
    var inp = $('profile-username-input'), btn = $('profile-save-name'), msg = $('profile-name-msg');
    function current() { try { return window.storageManager.data.username || ''; } catch (e) { return ''; } }
    function clean(v) { return v.replace(/\s+/g, ' ').trim(); }
    function paintNames() {
      var n = current();
      document.querySelectorAll('.user-name-display').forEach(function (el) { el.textContent = n; });
      if ($('profile-player-id')) { try { $('profile-player-id').textContent = 'ID: ' + window.storageManager.data.playerId; } catch (e) {} }
    }
    function fillName() { if (document.activeElement !== inp) inp.value = current(); btn.disabled = true; msg.textContent = ''; paintNames(); }
    inp.addEventListener('input', function () {
      var v = clean(inp.value);
      btn.disabled = !v || v === current();
      msg.classList.remove('err'); msg.textContent = '';
    });
    function saveName() {
      var v = clean(inp.value);
      if (v.length < 2) { msg.className = 'profile-name-msg err'; msg.textContent = 'Use at least 2 characters.'; return; }
      try { window.storageManager.data.username = v; window.storageManager.save(); } catch (e) { msg.className = 'profile-name-msg err'; msg.textContent = 'Could not save. Try again.'; return; }
      inp.value = v; btn.disabled = true; msg.className = 'profile-name-msg'; msg.textContent = 'Saved. Your friends will see ' + v + '.';
      paintNames(); toast('Username saved');
    }
    btn.addEventListener('click', saveName);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !btn.disabled) saveName(); });

    // keep the name field fresh whenever the profile screen opens
    if (window.app) {
      var rp = window.app.renderProfile.bind(window.app);
      window.app.renderProfile = function () { rp(); fillName(); };
      fillName();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
