/* =====================================================================
   COINS: home counter, collect animations + sounds, battle stake/pot,
   and "pause" - opening Settings/Profile mid-puzzle keeps the puzzle as is.
   ===================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var FEE = 50;
  function sm() { return window.storageManager; }
  function coins() { try { return sm().data.coins || 0; } catch (e) { return 0; } }
  function snd() { return window.soundEngine; }
  function play(name) { try { var s = snd(); if (s && s[name]) s[name](); } catch (e) {} }
  function frame() { return document.querySelector('.mobile-app-frame') || document.body; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---- extra sounds ---- */
  (function () {
    var s = snd(); if (!s) return; var P = Object.getPrototypeOf(s);
    P.playPot = function () { this._tone(150, .3, 'sine', .3, 55, 0); this._tone(880, .18, 'triangle', .13, 1320, .06); this._tone(1318, .25, 'triangle', .1, 0, .14); };
    P.playLose = function () { this._tone(330, .3, 'triangle', .14, 200, 0); this._tone(247, .4, 'triangle', .14, 150, .22); };
    P.playTie = function () { this._tone(523, .2, 'triangle', .13, 0, 0); this._tone(523, .3, 'triangle', .13, 0, .2); };
    P.playTick = function (i) { this._tone(900 + (i || 0) * 40, .08, 'square', .05, 0, 0); };
  })();

  /* ---- coin pill (home) ---- */
  var lastShown = null;
  function paintCoins() {
    var c = coins(), el = $('home-coin-count');
    if (el) {
      el.textContent = c.toLocaleString();
      if (lastShown !== null && c !== lastShown) { var p = el.closest('.home-coins'); if (p) { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } }
    }
    document.querySelectorAll('.user-coin-count').forEach(function (e) { e.textContent = c.toLocaleString(); });
    var sc = $('shop-coins'); if (sc) sc.textContent = c.toLocaleString();
    lastShown = c;
  }
  // the coin gradient is defined once here (the icon is used in many places, ids must be unique)
  function addCoinDefs() {
    if (document.getElementById('coin-defs')) return;
    var h = document.createElement('div'); h.id = 'coin-defs'; h.setAttribute('aria-hidden', 'true'); h.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    h.innerHTML = '<svg width="0" height="0"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#F2A81D"/></linearGradient></defs></svg>';
    document.body.appendChild(h);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addCoinDefs); else addCoinDefs();
  var COIN_SVG = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="url(#cg)" stroke="#D98A0B" stroke-width="1.5"/><circle cx="12" cy="12" r="6.4" fill="none" stroke="#D98A0B" stroke-opacity=".7" stroke-width="1.4"/><path d="M12 8.2v7.6M9.8 10.2c.5-.9 1.4-1.2 2.2-1.2s1.8.4 1.8 1.3c0 1.9-4 1-4 3 0 .9.9 1.4 2.2 1.4.9 0 1.7-.4 2.1-1.2" fill="none" stroke="#B36F00" stroke-width="1.1" stroke-linecap="round"/></svg>';

  /* ---- flying coins ---- */
  function centre(e, fb) {
    if (e && e.getBoundingClientRect) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2 - fb.left, y: r.top + r.height / 2 - fb.top }; }
    return e;
  }
  function fly(from, to, n, o) {
    o = o || {}; var fr = frame(), fb = fr.getBoundingClientRect(), a = centre(from, fb), b = centre(to, fb), done = 0;
    return new Promise(function (resolve) {
      for (var i = 0; i < n; i++) (function (i) {
        var c = document.createElement('div'); c.className = 'coin-fly'; c.innerHTML = COIN_SVG;
        c.style.left = '-13px'; c.style.top = '-13px'; fr.appendChild(c);
        var jx = (Math.random() - .5) * 46, jy = (Math.random() - .5) * 30, mid = { x: (a.x + b.x) / 2 + jx * 2, y: (a.y + b.y) / 2 - 50 - Math.random() * 40 };
        var anim = c.animate([
          { transform: 'translate(' + (a.x + jx) + 'px,' + (a.y + jy) + 'px) scale(.5)', opacity: 0 },
          { transform: 'translate(' + (a.x + jx) + 'px,' + (a.y + jy) + 'px) scale(1)', opacity: 1, offset: .12 },
          { transform: 'translate(' + mid.x + 'px,' + mid.y + 'px) scale(1.1) rotate(180deg)', offset: .5 },
          { transform: 'translate(' + b.x + 'px,' + b.y + 'px) scale(.8) rotate(360deg)', opacity: 1 }
        ], { duration: o.dur || 800, delay: i * (o.gap || 80), easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' });
        anim.onfinish = function () {
          c.remove(); if (o.sound !== false) play('playCoin'); if (o.each) o.each(i, n);
          if (++done === n) resolve();
        };
      })(i);
      if (!n) resolve();
    });
  }

  /* ---- duel overlay (stake in / pot out) ---- */
  var OPP_AV = ['🦊', '🐲', '🤖', '🦁', '🐼', '🦅'];
  function duelBuild(name) {
    var d = $('duel'); if (d) d.remove();
    d = document.createElement('div'); d.id = 'duel'; d.className = 'duel';
    var av = OPP_AV[Math.floor(Math.random() * OPP_AV.length)], oppBal = 160 + Math.floor(Math.random() * 40) * 10;
    d.innerHTML =
      '<div class="duel-card" id="duel-opp"><div class="duel-av">' + av + '</div><div class="duel-name"></div><div class="duel-bal">' + COIN_SVG + '<span id="duel-opp-bal">' + oppBal + '</span></div></div>' +
      '<div class="duel-mid"><div class="duel-msg" id="duel-msg"></div><div class="duel-pot" id="duel-pot"><div class="pot-n" id="pot-n">0</div><div class="pot-l">POT</div></div><div class="duel-sub" id="duel-sub"></div></div>' +
      '<div class="duel-card me" id="duel-me"><div class="duel-av">🐬</div><div class="duel-name" id="duel-me-name"></div><div class="duel-bal">' + COIN_SVG + '<span id="duel-me-bal"></span></div></div>';
    d.querySelector('#duel-opp .duel-name').textContent = name;
    $('duel-me-name') || 0;
    frame().appendChild(d);
    d.querySelector('#duel-me-name').textContent = (sm() && sm().data.username) || 'You';
    d._opp = oppBal;
    requestAnimationFrame(function () { d.classList.add('show'); });
    return d;
  }
  function duelHide() { var d = $('duel'); if (!d) return Promise.resolve(); d.classList.remove('show'); return sleep(320).then(function () { d.remove(); }); }
  function setN(id, v) { var e = $(id); if (e) e.textContent = v; }
  function potPulse() { var p = $('duel-pot'); if (!p) return; p.classList.remove('pulse'); void p.offsetWidth; p.classList.add('pulse'); }

  function canStake() {
    if (coins() >= FEE) return true;
    if (window.showToast) window.showToast('You need ' + FEE + ' coins to enter a battle. You have ' + coins() + '.');
    play('playBlocked'); return false;
  }

  // both players pay FEE; coins fly into the pot
  async function stake(name, cb) {
    var d = duelBuild(name), pot = 0, me = coins();
    setN('duel-me-bal', me); setN('pot-n', 0);
    setN('duel-msg', 'Entry fee: ' + FEE + ' coins each');
    await sleep(700);
    try { sm().data.coins -= FEE; sm().save(); } catch (e) {}
    var STEP = 5, k = FEE / STEP;
    var pMe = fly($('duel-me'), $('duel-pot'), k, { gap: 90, each: function (i) { pot += STEP; me -= STEP; setN('pot-n', pot); setN('duel-me-bal', me); potPulse(); } });
    await sleep(500);
    var pOpp = fly($('duel-opp'), $('duel-pot'), k, { gap: 90, each: function (i) { pot += STEP; d._opp -= STEP; setN('pot-n', pot); setN('duel-opp-bal', d._opp); potPulse(); } });
    await Promise.all([pMe, pOpp]);
    play('playPot'); potPulse(); setN('pot-n', FEE * 2);
    setN('duel-msg', 'Winner takes ' + FEE * 2 + ' coins!'); setN('duel-sub', 'Get ready…');
    await sleep(1100); play('playBeep');
    await duelHide(); if (cb) cb();
  }

  // pot goes to the winner (or both get their fee back on a tie)
  async function settle(outcome, name, cb) {
    var d = duelBuild(name), pot = FEE * 2, me = coins();
    setN('duel-me-bal', me); setN('pot-n', pot);
    d.classList.add('end-' + outcome);
    var STEP = 10, k = pot / STEP;
    if (outcome === 'win') {
      try { sm().data.coins += pot; sm().save(); } catch (e) {}
      setN('duel-msg', '🏆 You won the pot!'); await sleep(600);
      play('playVictory');
      await fly($('duel-pot'), $('duel-me'), k, { gap: 110, each: function () { pot -= STEP; me += STEP; setN('pot-n', pot); setN('duel-me-bal', me); } });
      setN('duel-sub', '+' + FEE * 2 + ' coins');
    } else if (outcome === 'lose') {
      setN('duel-msg', name + ' takes the pot'); await sleep(600); play('playLose');
      await fly($('duel-pot'), $('duel-opp'), k, { gap: 110, each: function () { pot -= STEP; d._opp += STEP; setN('pot-n', pot); setN('duel-opp-bal', d._opp); } });
      setN('duel-sub', '-' + FEE + ' coins');
    } else {
      try { sm().data.coins += FEE; sm().save(); } catch (e) {}
      setN('duel-msg', "It's a tie! Fees returned"); await sleep(500); play('playTie');
      var half = k / 2;
      await Promise.all([
        fly($('duel-pot'), $('duel-me'), half, { gap: 110, each: function () { pot -= STEP; me += STEP; setN('pot-n', pot); setN('duel-me-bal', me); } }),
        fly($('duel-pot'), $('duel-opp'), half, { gap: 110, each: function () { pot -= STEP; setN('pot-n', pot); } })]);
      setN('duel-sub', '+' + FEE + ' coins back');
    }
    await sleep(1100); await duelHide(); if (cb) cb();
  }

  /* ---- pause: settings / profile keep the puzzle exactly as it is ---- */
  function wirePause(app) {
    var held = null, justBack = null, sw0 = app.switchScreen.bind(app);
    function drop() { if (held) { try { held.eng.destroy(); } catch (e) {} held = null; } }
    app.switchScreen = function (name, lvl, upd) {
      if (upd !== false) return sw0(name, lvl, upd);
      var overlay = name === 'settings' || name === 'profile', eng = app.bendingEngine;
      if (overlay && app.currentScreen === 'puzzle' && eng && !eng.won && !eng.dead && !eng.isLocked) {
        held = { eng: eng, level: app.currentLevelNum, at: Date.now() };
        app.bendingEngine = null; app._holding = true;          // keeps the engine, battle and room alive
        try { return sw0(name, lvl, upd); } finally { app._holding = false; }
      }
      if (overlay && held) { app._holding = true; try { return sw0(name, lvl, upd); } finally { app._holding = false; } }
      if (name === 'puzzle' && justBack && Date.now() - justBack.at < 600 && (lvl == null || Number(lvl) === justBack.level)) return;   // the router fires twice
      if (held && name === 'puzzle' && (lvl == null || Number(lvl) === held.level)) {
        var h = held, launch = app.launchBendingLevel; held = null; justBack = { level: h.level, at: Date.now() };
        app.launchBendingLevel = function () {};                // do not rebuild the level
        try { sw0(name, lvl, upd); } finally { app.launchBendingLevel = launch; }
        app.bendingEngine = h.eng; app.currentLevelNum = h.level;
        if (h.level < 20001 && h.eng.startTime) h.eng.startTime += Date.now() - h.at;   // time spent in settings is not counted
        return;
      }
      if (held) drop();
      return sw0(name, lvl, upd);
    };
  }

  /* ---- coin burst on win modals ---- */
  function wireBurst(app) {
    var ov = app.showVictoryModal.bind(app);
    app.showVictoryModal = function (o) {
      ov(o);
      var n = o && o.earnedCoins; if (!n) return;
      var card = document.querySelector('#modal-victory .modal-clay-card') || $('modal-victory');
      setTimeout(function () { fly(card, $('victory-stat-coins'), Math.min(12, Math.max(5, Math.round(n / 5))), { gap: 70, dur: 650 }); }, 450);
    };
  }

  function boot() {
    var app = window.app; if (!app || !sm()) return;
    var css = document.createElement('style'); css.textContent =
      '.home-left{display:flex;flex-direction:column;gap:8px;align-items:flex-start}' +
      '.home-coins{pointer-events:auto;display:flex;align-items:center;gap:6px;height:38px;padding:0 14px 0 9px;border:0;border-radius:19px;background:rgba(255,255,255,.88);color:#8A5A00;font-weight:800;font-size:.95rem;cursor:pointer;box-shadow:0 6px 14px -6px rgba(200,140,20,.55);font-family:inherit}' +
      '.home-coins.bump{animation:coinBump .5s ease}@keyframes coinBump{40%{transform:scale(1.18)}}' +
      '.coin-fly{position:absolute;left:0;top:0;z-index:260;width:26px;height:26px;pointer-events:none;will-change:transform;filter:drop-shadow(0 2px 3px rgba(150,100,0,.4))}' +
      '.duel{position:absolute;inset:0;z-index:240;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:56px 20px 56px;background:linear-gradient(180deg,#EAF3FF,#DCEBFF 50%,#E7F7F0);opacity:0;transition:opacity .3s}.duel.show{opacity:1}' +
      '.duel-card{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border-radius:24px;padding:14px 26px;min-width:170px;box-shadow:0 10px 24px -12px rgba(60,100,180,.5)}' +
      '.duel-av{font-size:2.4rem;line-height:1}.duel-name{font-weight:800;color:var(--text-navy);font-size:1rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.duel-bal{display:flex;align-items:center;gap:6px;font-weight:800;color:#8A5A00;font-variant-numeric:tabular-nums}.duel-bal svg{width:18px;height:18px}' +
      '.duel-mid{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}.duel-msg{font-weight:800;font-size:1.15rem;color:var(--text-navy);min-height:28px}.duel-sub{font-weight:700;color:var(--text-muted);min-height:22px}' +
      '.duel-pot{width:128px;height:128px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF3C2,#FFD75E 60%,#F2A81D);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 14px 30px -10px rgba(220,150,20,.8),inset 0 -6px 12px rgba(200,120,0,.25)}' +
      '.duel-pot.pulse{animation:potPulse .3s ease}@keyframes potPulse{50%{transform:scale(1.12)}}' +
      '.pot-n{font-size:2.4rem;font-weight:800;color:#7A4A00;line-height:1;font-variant-numeric:tabular-nums}.pot-l{font-size:.7rem;font-weight:800;letter-spacing:2px;color:#9A6200}' +
      '#pvp-pot-badge{font-weight:800;color:#8A5A00;font-size:.78rem}' +
      '.stake-box{width:100%;max-width:260px;margin:0 auto 18px;padding:18px 16px 16px;border-radius:26px;background:linear-gradient(160deg,#FFF6D6,#FFE4A0);box-shadow:0 14px 26px -14px rgba(220,150,20,.8);display:flex;flex-direction:column;align-items:center;gap:2px}' +
      '.sb-coin svg{width:64px;height:64px;filter:drop-shadow(0 6px 8px rgba(190,120,0,.35))}' +
      '.sb-fee{font-size:1.7rem;font-weight:800;color:#7A4A00;letter-spacing:1px;line-height:1.1;margin-top:6px}' +
      '.sb-sub{font-size:.68rem;font-weight:800;letter-spacing:2px;color:#A8700A}' +
      '.sb-line{width:70%;height:2px;border-radius:2px;background:rgba(160,100,0,.2);margin:10px 0 8px}' +
      '.sb-win{font-weight:700;color:#6B4200;font-size:.95rem}.sb-win b{font-size:1.15rem;color:#B45F00}';
    document.head.appendChild(css);

    // home: [profile][coins] ........ [settings]
    var bar = document.querySelector('.home-top-actions');
    if (bar) {
      var pb = bar.querySelector('[data-nav=profile]'), left = document.createElement('div'); left.className = 'home-left';
      bar.insertBefore(left, pb); left.appendChild(pb);
      var pill = document.createElement('button'); pill.className = 'home-coins'; pill.setAttribute('data-nav', 'shop'); pill.setAttribute('aria-label', 'Coins');
      pill.innerHTML = COIN_SVG + '<span id="home-coin-count">0</span>'; left.appendChild(pill);
      pill.addEventListener('click', function (e) { e.preventDefault(); app.navigate('shop'); });
    }
    var save0 = sm().save.bind(sm()); sm().save = function () { var r = save0.apply(null, arguments); paintCoins(); return r; };
    var hud0 = app.updateHUD.bind(app); app.updateHUD = function () { hud0(); paintCoins(); };
    paintCoins();

    // battle: stake box (same look as the play pad)
    var fb = $('btn-start-matchmaking');
    if (fb && !$('mm-stake-box')) {
      var box = document.createElement('div'); box.id = 'mm-stake-box'; box.className = 'stake-box';
      box.innerHTML = '<div class="sb-coin">' + COIN_SVG + '</div><div class="sb-fee">' + FEE + ' COINS</div><div class="sb-sub">ENTRY FEE</div><div class="sb-line"></div><div class="sb-win">\uD83C\uDFC6 Win and get <b>' + FEE * 2 + '</b> coins</div>';
      fb.parentNode.insertBefore(box, fb);
    }

    wirePause(app); wireBurst(app);
    window.ArroutCoins = { FEE: FEE, canStake: canStake, stake: stake, settle: settle, fly: fly, paint: paintCoins };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
