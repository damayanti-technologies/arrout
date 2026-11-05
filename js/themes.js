/* =====================================================================
   DARK MODE + EYE COMFORT  (themes and the theme shop were removed)
   ===================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var S = function () { return window.arroutSettings || (window.arroutSettings = {}); };
  function saveSettings() { try { localStorage.setItem('arrout_settings_v1', JSON.stringify(S())); } catch (e) {} }
  function snd(n) { try { var s = window.soundEngine; if (s && s[n]) s[n](); } catch (e) {} }

  var DARK = { bg1: '#0E1628', bg2: '#17233D', card: '#1F2D4A', text: '#E8EEF8', muted: '#9FB0C8', acc: '#6C8CFF', acc2: '#5BC0EB', p1: '#3B5BDB', p2: '#6C5CE7', pill: '#26335A', accText: '#A9B8FF', dot: '#3A4A6B', title: '#8FB0FF',
    cards: ['#26335A,#2E3F73', '#1F3B3A,#27504C', '#203A44,#2A4D5B', '#3A2F4A,#4B3E61', '#2E2B52,#3C3873'] };

  function apply() {
    var root = document.documentElement, s = root.style, dark = !!S().dark;
    ['--u-bg1', '--u-bg2', '--u-card', '--u-pill', '--u-acc', '--u-acc2', '--u-p1', '--u-p2', '--u-acc-text', '--u-dot', '--u-title', '--u-board', '--u-c0', '--u-c1', '--u-c2', '--u-c3', '--u-c4',
      '--text-navy', '--text-slate', '--text-muted', '--text-light-muted', '--arrow-navy', '--bg-canvas'].forEach(function (v) { s.removeProperty(v); });
    if (dark) {
      var P = DARK;
      root.setAttribute('data-ui', 'on');
      s.setProperty('--u-bg1', P.bg1); s.setProperty('--u-bg2', P.bg2); s.setProperty('--u-card', P.card); s.setProperty('--u-pill', P.pill);
      s.setProperty('--u-acc', P.acc); s.setProperty('--u-acc2', P.acc2); s.setProperty('--u-p1', P.p1); s.setProperty('--u-p2', P.p2);
      s.setProperty('--u-acc-text', P.accText); s.setProperty('--u-dot', P.dot); s.setProperty('--u-title', P.title); s.setProperty('--u-board', 'transparent');
      P.cards.forEach(function (c, i) { var a = c.split(','); s.setProperty('--u-c' + i, 'linear-gradient(135deg,' + a[0] + ',' + a[1] + ')'); });
      s.setProperty('--text-navy', P.text); s.setProperty('--text-slate', P.text); s.setProperty('--text-muted', P.muted); s.setProperty('--text-light-muted', P.muted); s.setProperty('--bg-canvas', P.bg2);
      s.setProperty('--arrow-navy', '#DCE6F5');
      root.setAttribute('data-dark', '1');
    } else { root.removeAttribute('data-ui'); root.setAttribute('data-dark', '0'); }
    var ov = $('comfort-overlay'); if (ov) ov.style.display = S().comfort ? '' : 'none';
  }

  var css = [
    'html[data-ui] body{background:var(--u-bg2)!important;color:var(--text-navy)}',
    'html[data-ui] .mobile-app-frame{background:linear-gradient(180deg,var(--u-bg1),var(--u-bg2))!important;isolation:isolate}',
    'html[data-ui] .card-play,html[data-ui] .featured-play-card{background:linear-gradient(135deg,var(--u-p1),var(--u-p2))!important}',
    'html[data-ui] .card-pvp{background:var(--u-c0)!important}html[data-ui] .card-room{background:var(--u-c1)!important}html[data-ui] .card-daily{background:var(--u-c2)!important}',
    'html[data-ui] .card-tournament{background:var(--u-c3)!important}',
    'html[data-ui] .home-logo{color:var(--u-title)!important;-webkit-text-fill-color:var(--u-title)!important}',
    'html[data-ui] .home-icon-btn{background:var(--u-pill)!important;color:var(--u-acc-text)!important}',
    'html[data-ui] .quote-bubble{background:var(--u-card)!important;color:var(--u-acc-text)!important}',
    'html[data-ui] .card-heading,html[data-ui] .card-desc-text{color:var(--text-navy)}html[data-ui] .card-play .card-heading,html[data-ui] .card-play .card-heading *{color:#fff!important}',
    'html[data-ui] .card-3d-icon,html[data-ui] .card-arrow-circle{background:var(--u-card)!important}',
    'html[data-ui] .home-dots i{background:var(--u-dot)!important}html[data-ui] .home-dots i.on{background:var(--u-acc)!important}',
    'html[data-ui] .btn-primary-clay{background:linear-gradient(135deg,var(--u-acc),var(--u-acc2))!important;color:#fff!important}',
    'html[data-ui] .btn-back-soft,html[data-ui] .btn-circle-action,html[data-ui] .remaining-pill,html[data-ui] .diff-badge-pill,html[data-ui] .powerup-circle-btn,html[data-ui] .modal-clay-card,html[data-ui] .level-clay-card,html[data-ui] .diff-filter-pill{background:var(--u-card)!important;color:var(--text-navy)!important}',
    'html[data-ui] .diff-filter-pill.active{background:var(--u-acc)!important;color:#fff!important}',
    'html[data-ui] .modal-stats-soft{background:var(--u-bg1)!important}',
    'html[data-ui] .global-toast{background:var(--u-card)!important;color:var(--text-navy)!important}',
    'html[data-ui] [style*="background: #FFF;"],html[data-ui] [style*="background: #FFFFFF"],html[data-ui] [style*="linear-gradient(135deg, #EBF8F2"],html[data-ui] [style*="linear-gradient(135deg, #FFF1EE"]{background:var(--u-card)!important}',
    'html[data-ui] [style*="background: rgb(255, 255, 255)"],html[data-ui] [style*="background-color: rgb(255, 255, 255)"]{background:var(--u-card)!important}',
    'html[data-ui] #profile-username-input,html[data-ui] #room-code-input,html[data-ui] #room-link{background:var(--u-bg1)!important;color:var(--text-navy)!important;border-color:var(--u-dot)!important}',
    'html[data-ui] [style*="background: #F1F5F9"],html[data-ui] [style*="background: #EDF2F7"]{background:var(--u-bg1)!important;color:var(--text-navy)!important}',
    'html[data-ui] .opt-seg{background:var(--u-bg1)}html[data-ui] .opt-seg button.on{background:var(--u-card);color:var(--u-acc-text)}html[data-ui] .opt-title{border-top-color:var(--u-dot)}',
    'html[data-ui] .svg-grid-dots circle{fill:var(--u-dot)!important}',
    'html[data-ui] .tool-label,html[data-ui] .screen-main-title,html[data-ui] #puzzle-level-title{color:var(--text-navy)}',
    'html[data-ui] .lvl-card-num{color:var(--text-navy)}',
    'html[data-ui] .vx-row{background:var(--u-bg1);color:var(--text-navy)}html[data-ui] .vx-row.win{background:var(--u-acc);color:#fff}',
    '#comfort-overlay{position:fixed;inset:0;z-index:99999;pointer-events:none;background:rgba(255,150,40,.17);mix-blend-mode:multiply}'
  ].join('\n');

  function boot() {
    var s = document.createElement('style'); s.id = 'theme-css'; s.textContent = css; document.head.appendChild(s);
    var ov = document.createElement('div'); ov.id = 'comfort-overlay'; ov.style.display = 'none'; document.body.appendChild(ov);
    ['dark', 'comfort'].forEach(function (k) {
      var c = $('setting-' + k); if (!c) return; c.checked = !!S()[k];
      c.addEventListener('change', function () { S()[k] = c.checked; saveSettings(); apply(); if (k === 'dark') snd('playClick'); });
    });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 60); });
  else setTimeout(boot, 60);
})();
