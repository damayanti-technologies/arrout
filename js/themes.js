/* =====================================================================
   THEMES + DARK MODE + EYE COMFORT + THEME SHOP
   - 5 buyable themes (coins) change the colors, home screen, shop and the arrows themselves
   - Settings: Dark mode, Eye comfort
   ===================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  var KEY = 'arrout_themes_v1';

  /* ---------- theme data ---------- */
  function pal(o) { return o; }
  var THEMES = {
    classic: { name: 'Classic', emoji: '🐬', price: 0, desc: 'The original sky blue look.', hue: 0, arrow: null,
      L: null,
      D: pal({ bg1: '#0E1628', bg2: '#17233D', card: '#1F2D4A', text: '#E8EEF8', muted: '#9FB0C8', acc: '#6C8CFF', acc2: '#5BC0EB', p1: '#3B5BDB', p2: '#6C5CE7', pill: '#26335A', accText: '#A9B8FF', dot: '#3A4A6B', title: '#8FB0FF',
        cards: ['#26335A,#2E3F73', '#1F3B3A,#27504C', '#203A44,#2A4D5B', '#3A2F4A,#4B3E61', '#2E2B52,#3C3873'] }) },
    forest: { name: 'Forest', emoji: '🌲', price: 200, desc: 'Adventure jungle valley: palms, waterfall, mossy log & big leaves. Arrows become snakes!', hue: -85,
      arrow: { kind: 'snake', w: 1.35, colors: ['#2E8B3D', '#7CB518', '#12926B', '#A3B80F', '#3D9A2F', '#0F8B6D', '#D4A017', '#5FAD41'], pattern: { color: 'rgba(8,45,18,.5)', w: .42, dash: [.02, 1.9], cap: 'round' } },
      deco: null,
      L: pal({ bg1: '#9FD8FF', bg2: '#7FC8F2', card: '#FFF2D2', text: '#4A2A0E', muted: '#7A5530', acc: '#F2A31B', acc2: '#7CC243', p1: '#FFD65A', p2: '#F08A1A', pill: '#FFE9B8', accText: '#B8650A', dot: '#C9A15A', title: '#FFC83D', board: 'rgba(255,248,214,.30)',
        cards: ['#FFF4D8,#F6DFA6', '#F4F0CC,#E2DC9A', '#FFF0CC,#F1D89A', '#FCEBC8,#EBCB8C', '#EEF2CC,#D2E09A'] }),
      D: pal({ bg1: '#0B1E4A', bg2: '#1B3A6A', card: '#5A3A1C', text: '#FFE9B8', muted: '#D9BC84', acc: '#FFC83D', acc2: '#8BD14B', p1: '#E8A21E', p2: '#B8620A', pill: '#4A2E14', accText: '#FFD98A', dot: '#7A5A30', title: '#FFC83D', board: 'rgba(0,0,0,.25)',
        cards: ['#6B4624,#4A2E14', '#5E4A22,#403016', '#6A4A20,#4A3010', '#664020,#472A10', '#55482A,#3A3016'] }) },
    china: { name: 'China', emoji: '🐉', price: 350, desc: 'Swaying lanterns, gold borders & bamboo. Arrows become dragons!', hue: 165,
      arrow: { kind: 'dragon', w: 1.3, colors: ['#D62828', '#C1121F', '#B8860B', '#0F8A5F', '#E85D04', '#9D0208'], pattern: { color: '#FFD166', w: .3, dash: [.45, 1.0], cap: 'butt' } },
      deco: ['🏮', '🧧', '🎋'],
      L: pal({ bg1: '#FFF1D8', bg2: '#FFD3A6', card: '#FFF8EC', text: '#7A1010', muted: '#A65B3A', acc: '#D62828', acc2: '#F4B400', p1: '#F25C54', p2: '#D62828', pill: '#FFF8EC', accText: '#B71C1C', dot: '#E3B07A', title: '#C62828', board: 'rgba(255,248,236,.35)',
        cards: ['#FFD9C8,#FFB8A0', '#FFE7B0,#FFD27A', '#FFC9C9,#FF9E9E', '#FDE2A8,#F7C66B', '#F8D0A8,#EFAE72'] }),
      D: pal({ bg1: '#2A0D0D', bg2: '#461616', card: '#511D1D', text: '#FFE7C2', muted: '#E3B58A', acc: '#FF5A4F', acc2: '#FFC933', p1: '#C62828', p2: '#8E1B1B', pill: '#511D1D', accText: '#FFC933', dot: '#7A3A2A', title: '#FFC933',
        cards: ['#5A2020,#74302A', '#5A4220,#745A2A', '#5A1F2A,#742A38', '#5A3A20,#74502A', '#4A2A20,#643A2A'] }) },
    ocean: { name: 'Ocean', emoji: '🐠', price: 500, desc: 'Bubbles, seaweed, coral & sunbeams. Arrows swim as fish!', hue: 0,
      arrow: { kind: 'fish', w: 1.2, colors: ['#FF7F50', '#00B4D8', '#FFB703', '#2A9D8F', '#9B5DE5', '#F15BB5', '#4CC9F0'], pattern: { color: 'rgba(255,255,255,.85)', w: .46, dash: [.02, 2.1], cap: 'round' } },
      deco: ['🫧', '🐚', '🪸'],
      L: pal({ bg1: '#DDF4FF', bg2: '#8FD3F4', card: '#F2FBFF', text: '#0B3C5D', muted: '#3E7596', acc: '#1E88E5', acc2: '#00C2C7', p1: '#5BC0EB', p2: '#1E88E5', pill: '#F2FBFF', accText: '#0D5FA8', dot: '#6FB5D8', title: '#0D5FA8', board: 'rgba(255,255,255,.3)',
        cards: ['#CFEFFF,#A6DDF7', '#CFF5F0,#9FE6DC', '#D8E8FF,#B2CBFA', '#C8F1FF,#8FDAF2', '#D6F7EA,#A9E9D1'] }),
      D: pal({ bg1: '#06233A', bg2: '#0B3D5E', card: '#10507A', text: '#DDF4FF', muted: '#8FC7E6', acc: '#3AA0F0', acc2: '#19D3D8', p1: '#1E88E5', p2: '#0B5CA8', pill: '#10507A', accText: '#8FD8FF', dot: '#2C6C95', title: '#7CD3FF',
        cards: ['#0F4F7A,#17669C', '#0F5A62,#177A84', '#1B4A8A,#2561B0', '#0F5A7A,#1778A0', '#0F5A4C,#17806A'] }) },
    candy: { name: 'Candy', emoji: '🍭', price: 650, desc: 'Icing drips, candy-cane borders & lollipops. Arrows are candy!', hue: 135,
      arrow: { kind: 'candy', w: 1.5, colors: ['#FF5CA8', '#2EC4B6', '#FF9F1C', '#9D7BFF', '#5DD39E', '#FF6B6B'], pattern: { color: 'rgba(255,255,255,.92)', w: .98, dash: [1.1, 1.1], cap: 'butt' } },
      deco: ['🍬', '🍭', '🍩'],
      L: pal({ bg1: '#FFE9F4', bg2: '#FFC7E3', card: '#FFF6FB', text: '#8A1C5C', muted: '#B45A8C', acc: '#FF5CA8', acc2: '#6FD6F0', p1: '#FF8CC6', p2: '#FF5CA8', pill: '#FFF6FB', accText: '#C2185B', dot: '#F2A9CE', title: '#E91E8C', board: 'rgba(255,255,255,.35)',
        cards: ['#FFD6EA,#FFB3D9', '#D6F5FF,#A9E6FA', '#FFEFC2,#FFDC8A', '#E7D9FF,#CDB6FF', '#D9FFE3,#B0F1C4'] }),
      D: pal({ bg1: '#34132B', bg2: '#4F1D41', card: '#5E2550', text: '#FFE3F3', muted: '#F0A9D2', acc: '#FF6DB4', acc2: '#7FE0F5', p1: '#E0408E', p2: '#B02A6E', pill: '#5E2550', accText: '#FFB3DA', dot: '#8A3F72', title: '#FF9AD0',
        cards: ['#6A2A5A,#843872', '#2A5A6A,#387484', '#6A5A2A,#847038', '#4A2A6A,#603884', '#2A6A4A,#38845E'] }) },
    space: { name: 'Space', emoji: '🚀', price: 800, desc: 'Twinkling galaxy, ringed planet & neon frame. Arrows are rockets!', hue: 70, always: 'dark',
      arrow: { kind: 'rocket', w: .95, colors: ['#00E5FF', '#FF4DDA', '#B6FF3B', '#FFD43B', '#8C9CFF', '#FF8A3D'], pattern: { color: 'rgba(255,255,255,.9)', w: .34, dash: [.02, 1.7], cap: 'round' } },
      deco: ['⭐', '🪐', '✨'],
      L: pal({ bg1: '#150B38', bg2: '#33176F', card: '#2A1B63', text: '#F0E8FF', muted: '#B8A8E8', acc: '#7C4DFF', acc2: '#00E5FF', p1: '#7C4DFF', p2: '#00B8D4', pill: '#2A1B63', accText: '#9FE8FF', dot: '#5B4AB0', title: '#9FE8FF', board: 'rgba(40,24,100,.35)',
        cards: ['#3A2A7A,#5B3DB5', '#1F3F7A,#2F66C4', '#6A2A7A,#A13DB5', '#2A5A7A,#3D9DB5', '#4A2A7A,#7B3DB5'] }),
      D: null }
  };
  THEMES.space.D = THEMES.space.L;
  var ORDER = ['classic', 'forest', 'china', 'ocean', 'candy', 'space'];

  /* ---------- state ---------- */
  var S = function () { return window.arroutSettings || (window.arroutSettings = {}); };
  var st = { owned: ['classic'], active: 'classic' };
  try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.owned) st = j; } catch (e) {}
  if (st.owned.indexOf('classic') < 0) st.owned.push('classic');
  function saveSt() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function saveSettings() { try { localStorage.setItem('arrout_settings_v1', JSON.stringify(S())); } catch (e) {} }
  function cur() { return THEMES[st.active] || THEMES.classic; }

  /* ---------- apply theme / mode ---------- */
  function palette() {
    var T = cur(), dark = !!S().dark || T.always === 'dark';
    return dark ? (T.D || T.L) : T.L;       // null for classic light
  }
  function apply() {
    var root = document.documentElement, T = cur(), P = palette(), s = root.style;
    var vars = ['--u-bg1', '--u-bg2', '--u-card', '--u-pill', '--u-acc', '--u-acc2', '--u-p1', '--u-p2', '--u-acc-text', '--u-dot', '--u-title', '--u-board', '--u-c0', '--u-c1', '--u-c2', '--u-c3', '--u-c4',
      '--text-navy', '--text-slate', '--text-muted', '--text-light-muted', '--arrow-navy', '--bg-canvas'];
    vars.forEach(function (v) { s.removeProperty(v); });
    root.setAttribute('data-theme', st.active);
    if (P) {
      root.setAttribute('data-ui', 'on');
      s.setProperty('--u-bg1', P.bg1); s.setProperty('--u-bg2', P.bg2); s.setProperty('--u-card', P.card); s.setProperty('--u-pill', P.pill);
      s.setProperty('--u-acc', P.acc); s.setProperty('--u-acc2', P.acc2); s.setProperty('--u-p1', P.p1); s.setProperty('--u-p2', P.p2);
      s.setProperty('--u-acc-text', P.accText); s.setProperty('--u-dot', P.dot); s.setProperty('--u-title', P.title); s.setProperty('--u-board', P.board || 'transparent');
      P.cards.forEach(function (c, i) { var a = c.split(','); s.setProperty('--u-c' + i, 'linear-gradient(135deg,' + a[0] + ',' + a[1] + ')'); });
      s.setProperty('--text-navy', P.text); s.setProperty('--text-slate', P.text); s.setProperty('--text-muted', P.muted); s.setProperty('--text-light-muted', P.muted); s.setProperty('--bg-canvas', P.bg2);
      var dark = !!S().dark || T.always === 'dark';
      if (dark) s.setProperty('--arrow-navy', '#DCE6F5');
      root.setAttribute('data-dark', dark ? '1' : '0');
    } else { root.removeAttribute('data-ui'); root.setAttribute('data-dark', '0'); }
    if (T.arrow) root.setAttribute('data-arrow', T.arrow.kind); else root.removeAttribute('data-arrow');
    // deco emojis on the app frame
    var frame = document.querySelector('.mobile-app-frame');
    if (frame) {
      var d = T.deco; var url = '';
      if (d) {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><g font-size='26' opacity='.32'><text x='14' y='42'>" + d[0] + "</text><text x='128' y='96'>" + d[1] + "</text><text x='40' y='170'>" + d[2] + "</text><text x='168' y='206'>" + d[0] + "</text></g></svg>";
        url = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
      }
      frame.style.setProperty('--u-deco', url || 'none');
    }
    var ov = $('comfort-overlay'); if (ov) ov.style.display = S().comfort ? '' : 'none';
    var home = $('home-dolphin'); if (home) home.style.filter = T.hue ? 'hue-rotate(' + T.hue + 'deg)' : '';
  }

  /* ---------- CSS ---------- */
  var css = [
    'html[data-ui] body{background:var(--u-bg2)!important;color:var(--text-navy)}',
    'html[data-ui] .mobile-app-frame{background:linear-gradient(180deg,var(--u-bg1),var(--u-bg2))!important;isolation:isolate}',
    'html[data-theme] .mobile-app-frame::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:var(--u-deco,none);background-size:220px 220px}',
    'html[data-ui] .card-play,html[data-ui] .featured-play-card{background:linear-gradient(135deg,var(--u-p1),var(--u-p2))!important}',
    'html[data-ui] .card-pvp{background:var(--u-c0)!important}html[data-ui] .card-room{background:var(--u-c1)!important}html[data-ui] .card-daily{background:var(--u-c2)!important}',
    'html[data-ui] .card-tournament{background:var(--u-c3)!important}html[data-ui] .card-shop{background:var(--u-c4)!important}',
    'html[data-ui] .home-logo{color:var(--u-title)!important;-webkit-text-fill-color:var(--u-title)!important}',
    'html[data-ui] .home-icon-btn,html[data-ui] .home-coins{background:var(--u-pill)!important;color:var(--u-acc-text)!important}',
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
    'html[data-theme="space"] .cloud{display:none}',
    '#comfort-overlay{position:fixed;inset:0;z-index:99999;pointer-events:none;background:rgba(255,150,40,.17);mix-blend-mode:multiply}',
    /* themed arrows */
    'html[data-arrow] .arrow-path{stroke:var(--c)!important}',
    'html[data-arrow] .arrow-head{fill:transparent!important}',
    'html[data-arrow] .arrow-group.moving .arrow-path{stroke:var(--c)!important}',
    'html[data-arrow] .arrow-group.blocked{--c:#F87171!important}html[data-arrow] .arrow-group.hint-pulse{--c:#F59E0B!important}',
    'html[data-arrow] .arrow-head-deco .hc{fill:var(--c)}',
    'html[data-arrow] .arrow-in .arrow-deco{opacity:0;animation:arrowHeadIn .2s ease-out calc(var(--d,0s) + .3s) forwards}',
    'html[data-arrow] .arrow-in .arrow-head-deco{opacity:0;animation:arrowHeadIn .2s ease-out calc(var(--d,0s) + .35s) forwards}',
    'html[data-arrow="rocket"] .arrow-group{filter:drop-shadow(0 0 2.5px var(--c))}',
    /* shop + settings */
    '.shop-balance{display:flex;align-items:center;gap:6px;height:38px;padding:0 14px 0 9px;border-radius:19px;background:var(--u-pill,rgba(255,255,255,.9));font-weight:800;color:#8A5A00;box-shadow:0 6px 14px -8px rgba(200,140,20,.6)}',
    '.th-list{display:flex;flex-direction:column;gap:14px;padding-bottom:20px}',
    '.th-card{background:var(--u-card,#fff);border-radius:24px;overflow:hidden;box-shadow:var(--clay-shadow);display:flex;flex-direction:column}',
    '.th-card.on{box-shadow:0 0 0 3px var(--u-acc,#6C8CFF),var(--clay-shadow)}',
    '.th-prev{position:relative;height:118px;display:flex;align-items:center;justify-content:center}.th-prev svg{position:absolute;inset:0;width:100%;height:100%}',
    '.th-emoji{position:absolute;left:14px;top:10px;font-size:1.7rem;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}',
    '.th-body{display:flex;align-items:center;gap:12px;padding:12px 14px 14px}.th-info{flex:1;min-width:0}',
    '.th-name{font-weight:800;font-size:1.05rem;color:var(--text-navy)}.th-desc{font-size:.74rem;color:var(--text-muted);margin-top:2px;line-height:1.35}',
    '.th-btn{border:0;border-radius:16px;padding:10px 16px;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit;color:#fff;background:linear-gradient(135deg,#F5B83D,#F08A1A);white-space:nowrap;display:flex;align-items:center;gap:6px}',
    '.th-btn.equip{background:linear-gradient(135deg,#4A93F0,#6C7BF0)}.th-btn.cur{background:#D9E2EE;color:#6B7C93;cursor:default}',
    '.th-btn svg{width:16px;height:16px}',
    '.card-shop-now .card-3d-icon{background:#fff}'
  ].join('\n');

  /* ---------- arrow heads ---------- */
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function f(n) { return n.toFixed(2); }
  // draws head shapes facing +x at origin 0,0; u = unit size
  function headShapes(g, kind, u, col) {
    var sc = 'rgba(0,0,0,.28)';
    if (kind === 'snake') {
      el('ellipse', { cx: f(.2 * u), cy: 0, rx: f(1.0 * u), ry: f(.74 * u), class: 'hc', stroke: sc, 'stroke-width': f(.08 * u) }, g);
      el('path', { d: 'M' + f(1.1 * u) + ' 0 L' + f(1.65 * u) + ' 0 M' + f(1.65 * u) + ' 0 L' + f(1.95 * u) + ' ' + f(-.22 * u) + ' M' + f(1.65 * u) + ' 0 L' + f(1.95 * u) + ' ' + f(.22 * u), stroke: '#E11D48', 'stroke-width': f(.13 * u), fill: 'none', 'stroke-linecap': 'round' }, g);
      [-1, 1].forEach(function (s) { el('circle', { cx: f(.45 * u), cy: f(s * .4 * u), r: f(.24 * u), fill: '#FFF8C2' }, g); el('circle', { cx: f(.52 * u), cy: f(s * .4 * u), r: f(.11 * u), fill: '#111' }, g); });
    } else if (kind === 'dragon') {
      el('polygon', { points: [[-.5, -.72], [.5, -.62], [1.2, -.22], [1.35, 0], [1.2, .22], [.5, .62], [-.5, .72]].map(function (p) { return f(p[0] * u) + ',' + f(p[1] * u); }).join(' '), fill: '#FFC933', stroke: 'var(--c)', 'stroke-width': f(.16 * u), 'stroke-linejoin': 'round' }, g);
      [-1, 1].forEach(function (s) {
        el('path', { d: 'M' + f(-.1 * u) + ' ' + f(s * .62 * u) + ' L' + f(-.75 * u) + ' ' + f(s * 1.15 * u) + ' L' + f(.2 * u) + ' ' + f(s * .7 * u) + 'Z', class: 'hc' }, g);
        el('path', { d: 'M' + f(1.15 * u) + ' ' + f(s * .16 * u) + ' Q' + f(1.7 * u) + ' ' + f(s * .2 * u) + ' ' + f(1.95 * u) + ' ' + f(s * .8 * u), stroke: '#FFD166', 'stroke-width': f(.1 * u), fill: 'none', 'stroke-linecap': 'round' }, g);
        el('circle', { cx: f(.55 * u), cy: f(s * .32 * u), r: f(.21 * u), fill: '#fff', stroke: '#7A0A0A', 'stroke-width': f(.05 * u) }, g); el('circle', { cx: f(.62 * u), cy: f(s * .32 * u), r: f(.1 * u), fill: '#B00020' }, g);
        el('circle', { cx: f(1.12 * u), cy: f(s * .09 * u), r: f(.05 * u), fill: '#3a0606' }, g);
      });
    } else if (kind === 'fish') {
      el('path', { d: 'M' + f(-.2 * u) + ' ' + f(-.62 * u) + ' L' + f(.2 * u) + ' ' + f(-1.15 * u) + ' L' + f(.7 * u) + ' ' + f(-.6 * u) + 'Z', class: 'hc', opacity: '.8' }, g);
      el('ellipse', { cx: f(.25 * u), cy: 0, rx: f(1.05 * u), ry: f(.78 * u), class: 'hc', stroke: 'rgba(255,255,255,.7)', 'stroke-width': f(.09 * u) }, g);
      el('circle', { cx: f(.6 * u), cy: f(-.18 * u), r: f(.27 * u), fill: '#fff' }, g); el('circle', { cx: f(.68 * u), cy: f(-.18 * u), r: f(.13 * u), fill: '#0B3C5D' }, g);
      el('path', { d: 'M' + f(.95 * u) + ' ' + f(.18 * u) + ' Q' + f(1.1 * u) + ' ' + f(.3 * u) + ' ' + f(.9 * u) + ' ' + f(.42 * u), stroke: 'rgba(0,0,0,.35)', 'stroke-width': f(.07 * u), fill: 'none', 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M' + f(-.15 * u) + ' ' + f(-.35 * u) + ' Q' + f(-.3 * u) + ' 0 ' + f(-.15 * u) + ' ' + f(.35 * u), stroke: 'rgba(255,255,255,.55)', 'stroke-width': f(.08 * u), fill: 'none' }, g);
    } else if (kind === 'candy') {
      el('circle', { cx: f(.25 * u), cy: 0, r: f(.92 * u), class: 'hc', stroke: '#fff', 'stroke-width': f(.12 * u) }, g);
      el('path', { d: 'M' + f(.25 * u) + ' 0 m' + f(.1 * u) + ' 0 a' + f(.1 * u) + ' ' + f(.1 * u) + ' 0 1 1 ' + f(-.05 * u) + ' ' + f(-.1 * u) + ' a' + f(.35 * u) + ' ' + f(.35 * u) + ' 0 1 1 ' + f(.05 * u) + ' ' + f(.45 * u) + ' a' + f(.62 * u) + ' ' + f(.62 * u) + ' 0 1 1 ' + f(-.55 * u) + ' ' + f(-.7 * u), stroke: 'rgba(255,255,255,.9)', 'stroke-width': f(.14 * u), fill: 'none', 'stroke-linecap': 'round' }, g);
      el('circle', { cx: f(-.05 * u), cy: f(-.45 * u), r: f(.17 * u), fill: 'rgba(255,255,255,.75)' }, g);
    } else if (kind === 'rocket') {
      el('circle', { cx: f(.1 * u), cy: 0, r: f(1.1 * u), fill: col, opacity: '.18' }, g);
      el('path', { d: 'M' + f(1.5 * u) + ' 0 Q' + f(.9 * u) + ' ' + f(-.7 * u) + ' ' + f(-.2 * u) + ' ' + f(-.7 * u) + ' L' + f(-.2 * u) + ' ' + f(.7 * u) + ' Q' + f(.9 * u) + ' ' + f(.7 * u) + ' ' + f(1.5 * u) + ' 0Z', class: 'hc', stroke: '#fff', 'stroke-width': f(.1 * u), 'stroke-linejoin': 'round' }, g);
      el('circle', { cx: f(.5 * u), cy: 0, r: f(.28 * u), fill: '#E6FBFF', stroke: 'rgba(0,0,0,.35)', 'stroke-width': f(.06 * u) }, g);
      [-1, 1].forEach(function (s) { el('path', { d: 'M' + f(-.1 * u) + ' ' + f(s * .6 * u) + ' L' + f(-.8 * u) + ' ' + f(s * 1.0 * u) + ' L' + f(-.3 * u) + ' ' + f(s * .2 * u) + 'Z', fill: '#fff', opacity: '.9' }, g); });
    }
  }
  function placeHead(hg, hp, A, sw) {
    var pts = (hp.getAttribute('points') || '').trim().split(/\s+/).map(function (p) { var a = p.split(','); return [parseFloat(a[0]), parseFloat(a[1])]; });
    if (pts.length < 3 || isNaN(pts[0][0])) return;
    var tip = pts[0], bc = [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2];
    var s = Math.hypot(tip[0] - bc[0], tip[1] - bc[1]) || 1, dx = (tip[0] - bc[0]) / s, dy = (tip[1] - bc[1]) / s;
    var hx = bc[0] + dx * .55 * s, hy = bc[1] + dy * .55 * s, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    var tf = 'translate(' + f(hx) + ' ' + f(hy) + ') rotate(' + f(ang) + ')';
    // while an arrow flies out only the position changes, so move the existing shapes instead of rebuilding them every frame
    if (hg._g && hg._g.parentNode === hg) { hg._g.setAttribute('transform', tf); return; }
    hg.textContent = '';
    var g = el('g', { transform: tf }, hg); hg._g = g;
    headShapes(g, A.kind, Math.max(s * .95, sw * .8) * (A.kind === 'dragon' ? 1.25 : 1), '');
  }
  function themeInfo() { var T = cur(); return T.arrow ? T.arrow : null; }

  function hookEngine() {
    if (typeof BendingArrowEngine === 'undefined') return;
    var P = BendingArrowEngine.prototype;
    var og = P.createArrowSVGGroup;
    P.createArrowSVGGroup = function (arrow) {
      var g = og.apply(this, arguments), A = themeInfo(); if (!A) return g;
      var col = A.colors[arrow.id % A.colors.length], sw = (this.strokeWidth || 4) * A.w;
      g.style.setProperty('--c', col);
      var path = g.querySelector('.arrow-path'); path.setAttribute('stroke-width', sw.toFixed(1));
      if (A.pattern) {
        var d = el('path', { class: 'arrow-deco', d: path.getAttribute('d'), fill: 'none', stroke: A.pattern.color, 'stroke-width': f(sw * A.pattern.w), 'stroke-dasharray': A.pattern.dash.map(function (v) { return f(v * sw); }).join(' '), 'stroke-linecap': A.pattern.cap || 'round', 'stroke-linejoin': 'round' });
        d.style.pointerEvents = 'none'; path.parentNode.insertBefore(d, path.nextSibling);
      }
      var hg = el('g', { class: 'arrow-head-deco' }); hg.style.pointerEvents = 'none'; g.appendChild(hg);
      hg._A = A; hg._sw = sw; placeHead(hg, g.querySelector('.arrow-head'), A, sw);
      return g;
    };
    var od = P._drawAnim;
    P._drawAnim = function (an) {
      od.call(this, an);
      var g = an.arrow && an.arrow.element; if (!g) return;
      var dc = g.querySelector('.arrow-deco'); if (dc && an.pathEl) dc.setAttribute('d', an.pathEl.getAttribute('d'));
      var hg = g.querySelector('.arrow-head-deco'); if (hg && an.headEl) placeHead(hg, an.headEl, hg._A, hg._sw);
    };
  }

  /* ---------- shop ---------- */
  function previewSVG(T) {
    var P = T.L, A = T.arrow || { kind: 'plain', w: 1, colors: ['#152642'], pattern: null };
    var svg = el('svg', { viewBox: '0 0 300 118', preserveAspectRatio: 'xMidYMid slice' });
    var defs = el('defs', {}, svg);
    var bg = P ? 'linear-gradient(135deg,' + P.bg1 + ',' + P.bg2 + ')' : 'linear-gradient(135deg,#F2F8FF,#EAFAF8)';
    var paths = [
      [[30, 80], [80, 80], [80, 40], [150, 40]],
      [[60, 100], [190, 100], [190, 62], [250, 62]],
      [[120, 18], [250, 18], [250, 40]]
    ];
    paths.forEach(function (pts, i) {
      var col = A.colors[i % A.colors.length], sw = 6 * A.w, d = pts.map(function (p, k) { return (k ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
      var g = el('g', {}, svg); g.style.setProperty('--c', col);
      el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      if (A.pattern) el('path', { d: d, fill: 'none', stroke: A.pattern.color, 'stroke-width': f(sw * A.pattern.w), 'stroke-dasharray': A.pattern.dash.map(function (v) { return f(v * sw); }).join(' '), 'stroke-linecap': A.pattern.cap || 'round', 'stroke-linejoin': 'round' }, g);
      var a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      var hg = el('g', { transform: 'translate(' + b[0] + ' ' + b[1] + ') rotate(' + f(ang) + ')', class: 'arrow-head-deco' }, g);
      if (A.kind === 'plain') el('polygon', { points: '9,0 -4,6 -4,-6', fill: col }, hg); else headShapes(hg, A.kind, 8.5 * (A.kind === 'dragon' ? 1.25 : 1), col);
      hg.querySelectorAll('.hc').forEach(function (n) { n.setAttribute('fill', col); });
    });
    return { svg: svg, bg: bg };
  }
  function coins() { try { return window.storageManager.data.coins || 0; } catch (e) { return 0; } }
  function renderShop() {
    var box = $('shop-items-container'); if (!box) return;
    box.style.display = 'block';
    var tabs = document.querySelector('#screen-shop .shop-tab'); if (tabs && tabs.parentNode) tabs.parentNode.style.display = 'none';
    var ttl = document.querySelector('#screen-shop .screen-main-title'); if (ttl) ttl.textContent = 'Theme Shop';
    var pill = document.querySelector('#screen-shop .coin-pill');
    if (pill && !$('shop-balance')) { var b = document.createElement('div'); b.id = 'shop-balance'; b.className = 'shop-balance'; b.innerHTML = '<span id="shop-balance-icon"></span><span id="shop-coins" class="user-coin-count">0</span>'; pill.parentNode.replaceChild(b, pill); }
    var ic = $('shop-balance-icon'); if (ic && !ic.firstChild) ic.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F5B83D" stroke="#D98A0B" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#D98A0B" stroke-opacity=".7" stroke-width="1.4"/></svg>';
    $('shop-coins').textContent = coins().toLocaleString();
    box.innerHTML = ''; var list = document.createElement('div'); list.className = 'th-list'; box.appendChild(list);
    ORDER.forEach(function (id) {
      var T = THEMES[id], owned = st.owned.indexOf(id) >= 0, on = st.active === id;
      var card = document.createElement('div'); card.className = 'th-card' + (on ? ' on' : '');
      var prev = document.createElement('div'); prev.className = 'th-prev'; var pv = previewSVG(T); prev.style.background = pv.bg; prev.appendChild(pv.svg);
      var em = document.createElement('span'); em.className = 'th-emoji'; em.textContent = T.emoji; prev.appendChild(em);
      var body = document.createElement('div'); body.className = 'th-body';
      body.innerHTML = '<div class="th-info"><div class="th-name"></div><div class="th-desc"></div></div>';
      body.querySelector('.th-name').textContent = T.name; body.querySelector('.th-desc').textContent = T.desc;
      var btn = document.createElement('button'); btn.className = 'th-btn';
      if (on) { btn.classList.add('cur'); btn.textContent = 'Equipped'; }
      else if (owned) { btn.classList.add('equip'); btn.textContent = 'Equip'; }
      else { btn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFE27A" stroke="#B36F00" stroke-width="2"/></svg>' + T.price; }
      btn.addEventListener('click', function () { act(id, btn); });
      body.appendChild(btn); card.appendChild(prev); card.appendChild(body); list.appendChild(card);
    });
  }
  function snd(n) { try { var s = window.soundEngine; if (s && s[n]) s[n](); } catch (e) {} }
  function act(id, btn) {
    var T = THEMES[id];
    if (st.active === id) return;
    if (st.owned.indexOf(id) < 0) {
      if (coins() < T.price) { snd('playBlocked'); if (window.showToast) window.showToast('Not enough coins. ' + T.name + ' costs ' + T.price + '. You have ' + coins() + '.'); return; }
      try { window.storageManager.data.coins -= T.price; window.storageManager.save(); } catch (e) {}
      st.owned.push(id);
      if (window.ArroutCoins) window.ArroutCoins.fly(btn, $('shop-balance') || btn, 8, { gap: 60, dur: 600 });
      snd('playPowerup'); setTimeout(function () { snd('playVictory'); }, 350);
      if (window.showToast) window.showToast(T.name + ' theme unlocked!');
      try {
        var sm = window.storageManager;
        sm.unlockAchievement('fashionista');
        if (ORDER.every(function (k) { return st.owned.indexOf(k) >= 0; })) sm.unlockAchievement('royal_collector');
      } catch (e) {}
    } else snd('playClick');
    st.active = id; saveSt(); apply(); renderShop();
  }

  /* ---------- UI wiring ---------- */
  function boot() {
    var app = window.app; if (!app) return;
    var s = document.createElement('style'); s.id = 'theme-css'; s.textContent = css; document.head.appendChild(s);
    var ov = document.createElement('div'); ov.id = 'comfort-overlay'; ov.style.display = 'none'; document.body.appendChild(ov);

    // settings toggles
    ['dark', 'comfort'].forEach(function (k) {
      var c = $('setting-' + k); if (!c) return; c.checked = !!S()[k];
      c.addEventListener('change', function () { S()[k] = c.checked; saveSettings(); apply(); if (k === 'dark') snd('playClick'); });
    });
    // shop
    app.renderShop = renderShop;
    var sw = app.switchScreen.bind(app);
    hookEngine(); apply();
    window.ArroutThemes = { THEMES: THEMES, state: st, apply: apply, renderShop: renderShop, previewSVG: previewSVG };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 60); });
  else setTimeout(boot, 60);
})();
