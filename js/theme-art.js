/* =====================================================================
   THEME ART PACK – illustrated scenes + frames for Forest, China, Ocean, Candy, Space
   Layers are injected into .mobile-app-frame (behind / in front of the UI)
   ===================================================================== */
(function () {
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function n(v) { return Math.round(v * 10) / 10; }
  var W = 440, H = 840;

  /* ---------- shared pieces ---------- */
  function leaf(x, y, r, s, c) { return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(r) + ') scale(' + n(s) + ')"><path d="M0 0C7-11 24-11 34 0C24 11 7 11 0 0Z" fill="' + c + '" stroke="rgba(0,40,10,.4)" stroke-width="1"/><path d="M2 0H30" stroke="rgba(255,255,255,.38)" stroke-width="1.2"/></g>'; }
  function shroom(x, y, s, cap, dots) {
    var d = dots ? '<circle cx="-6" cy="-9" r="2.6" fill="#fff"/><circle cx="5" cy="-12" r="2.2" fill="#fff"/><circle cx="9" cy="-5" r="1.8" fill="#fff"/><circle cx="-1" cy="-5" r="1.6" fill="#fff"/>' : '<path d="M-9 -6Q0 -12 9 -6" stroke="rgba(255,255,255,.4)" stroke-width="2" fill="none"/>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-4 0Q-6 -9 -3 -12H3Q6 -9 4 0Z" fill="#F3E6C4" stroke="rgba(60,30,10,.4)" stroke-width="1"/><path d="M-16 -10A16 14 0 0 1 16 -10Q0 -5 -16 -10Z" fill="' + cap + '" stroke="rgba(60,20,5,.5)" stroke-width="1.2"/>' + d + '</g>';
  }
  function flower(x, y, s, c) { var p = ''; for (var i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; p += '<ellipse cx="' + n(Math.cos(a) * 6) + '" cy="' + n(Math.sin(a) * 6) + '" rx="5" ry="3.4" transform="rotate(' + (i * 72) + ' ' + n(Math.cos(a) * 6) + ' ' + n(Math.sin(a) * 6) + ')" fill="' + c + '" stroke="rgba(90,10,10,.35)" stroke-width=".8"/>'; } return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + p + '<circle r="3" fill="#FFD84D"/></g>'; }
  function butterfly(x, y, s, c1, c2, d) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="ta-float" style="animation-delay:' + d + 's"><g class="ta-flap" style="animation-delay:' + d + 's"><path d="M0 0C-8-14-24-14-22-2C-21 6-8 6 0 0Z" fill="' + c1 + '" stroke="#5a2a08" stroke-width="1"/><path d="M0 0C8-14 24-14 22-2C21 6 8 6 0 0Z" fill="' + c1 + '" stroke="#5a2a08" stroke-width="1"/><path d="M0 1C-6 8-14 14-8 14C-3 14 0 8 0 1Z" fill="' + c2 + '"/><path d="M0 1C6 8 14 14 8 14C3 14 0 8 0 1Z" fill="' + c2 + '"/></g><rect x="-1" y="-6" width="2" height="14" rx="1" fill="#3a1a05"/></g></g>'; }
  function star4(x, y, r, c) { return '<path d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + c + '"/>'; }
  function svgWrap(inner, par) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="' + (par || 'xMidYMid slice') + '" style="width:100%;height:100%;display:block">' + inner + '</svg>'; }

  /* ================= FOREST – adventure jungle valley (painted-style vector scene) ================= */
  function cloudG(x, y, s, d, dur) {
    var P = [[0, 0, 30], [30, -14, 38], [66, -6, 34], [96, 6, 26], [44, 10, 30], [-24, 8, 22]], o = '';
    P.forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + (p[1] + 7) + '" r="' + p[2] + '" fill="#BCD9F2"/>'; });
    P.forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#fff"/>'; });
    o += '<path d="M-10 -6Q20 -26 50 -12M40 -26Q70 -36 96 -14" stroke="#E4F1FF" stroke-width="5" fill="none" stroke-linecap="round"/>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="ta-drift" style="animation-duration:' + dur + 's;animation-delay:-' + d + 's">' + o + '</g></g>';
  }
  function birdG(x, y, s, d) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="ta-bird" style="animation-delay:-' + d + 's"><path d="M-12 2Q-6 -8 0 0Q6 -8 12 2Q6 -3 0 4Q-6 -3 -12 2Z" fill="#fff" stroke="#A9C4DC" stroke-width=".8"/></g></g>'; }
  function palmG(x, y, h, lean, u, flip) {
    var tx = x + lean, ty = y - h, o = '';
    o += '<path d="M' + x + ' ' + y + 'C' + (x + lean * .1) + ' ' + (y - h * .5) + ' ' + (tx - lean * .4) + ' ' + (ty + h * .3) + ' ' + tx + ' ' + ty + '" stroke="#3E2511" stroke-width="15" fill="none" stroke-linecap="round"/>';
    o += '<path d="M' + x + ' ' + y + 'C' + (x + lean * .1) + ' ' + (y - h * .5) + ' ' + (tx - lean * .4) + ' ' + (ty + h * .3) + ' ' + tx + ' ' + ty + '" stroke="#8A5A2A" stroke-width="10" fill="none" stroke-linecap="round"/>';
    o += '<path d="M' + x + ' ' + y + 'C' + (x + lean * .1) + ' ' + (y - h * .5) + ' ' + (tx - lean * .4) + ' ' + (ty + h * .3) + ' ' + tx + ' ' + ty + '" stroke="#5A3818" stroke-width="10" fill="none" stroke-dasharray="1.6 7" opacity=".7"/>';
    var fr = '';
    for (var i = 0; i < 9; i++) {
      var a = (-175 + i * 21) * Math.PI / 180, L = 74 + (i % 3) * 14, ex = Math.cos(a) * L, ey = Math.sin(a) * L + L * .32, cx = Math.cos(a) * L * .5, cy = Math.sin(a) * L * .5 - L * .22;
      var d = 'M0 0Q' + n(cx) + ' ' + n(cy) + ' ' + n(ex) + ' ' + n(ey);
      fr += '<path d="' + d + '" stroke="#1E5A22" stroke-width="13" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="#2F8F32" stroke-width="12" fill="none" stroke-dasharray="1.8 3.4"/><path d="' + d + '" stroke="#8BD14B" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>';
    }
    o += '<g transform="translate(' + tx + ' ' + ty + ')"><g class="ta-crown">' + fr + '<circle cx="-4" cy="6" r="6" fill="#6B3E1A"/><circle cx="6" cy="8" r="6" fill="#7A4A20"/></g></g>';
    return flip ? '<g transform="translate(' + W + ' 0) scale(-1 1)">' + o + '</g>' : o;
  }
  function bigLeaf(x, y, rot, s, u, dark) {
    var f = dark ? 'url(#' + u + 'lg2)' : 'url(#' + u + 'lg)';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')"><path d="M0 0C-26-40-18-96 18-118C34-104 46-118 70-110C66-92 84-86 98-76C86-62 104-46 100-30C86-30 80-12 62-10C54 12 20 18 0 0Z" fill="' + f + '" stroke="#1E4D14" stroke-width="3" stroke-linejoin="round"/><path d="M0 0C14-30 34-62 70-92" stroke="#1E4D14" stroke-width="2.6" fill="none"/><path d="M12-22L-10-34M24-40L2-58M38-58L24-80M26-34L58-36M44-54L76-60M54-72L80-84" stroke="#D8F58A" stroke-width="1.8" fill="none" opacity=".75"/><path d="M18-118C34-80 40-40 20-4" stroke="#fff" stroke-width="2" fill="none" opacity=".25"/></g>';
  }
  function curl(x, y, s, c) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0C14-10 28-2 24 12C20 24 6 22 8 12C10 6 18 8 16 14" stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round"/></g>'; }
  function forestBg(dark, u) {
    var R = rng(31), s = '';
    s += '<defs><linearGradient id="' + u + 'sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E8FE0"/><stop offset=".45" stop-color="#6FBDF2"/><stop offset=".75" stop-color="#C8EBFF"/><stop offset="1" stop-color="#E9F8E0"/></linearGradient>' +
      '<linearGradient id="' + u + 'rk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A4128"/><stop offset=".5" stop-color="#8E6B45"/><stop offset="1" stop-color="#6B4E30"/></linearGradient>' +
      '<linearGradient id="' + u + 'hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D5F0F5" stop-opacity=".0"/><stop offset="1" stop-color="#D5F0F5" stop-opacity=".75"/></linearGradient>' +
      '<linearGradient id="' + u + 'rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD9F0"/><stop offset="1" stop-color="#3FA7D8"/></linearGradient>' +
      '<radialGradient id="' + u + 'sun" cx=".5" cy=".18" r=".55"><stop offset="0" stop-color="#FFFBE0" stop-opacity=".85"/><stop offset="1" stop-color="#FFFBE0" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'sk)"/><rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'sun)"/>';
    // swirling cloud ring
    s += '<g opacity=".55" fill="none" stroke="#fff" stroke-linecap="round"><path d="M60 150C120 90 300 80 380 150" stroke-width="16" opacity=".5"/><path d="M90 210C160 150 280 150 350 205" stroke-width="12" opacity=".5"/></g>';
    s += cloudG(30, 120, 1.15, 0, 60) + cloudG(250, 80, 1.3, 20, 80) + cloudG(330, 190, .9, 10, 70) + cloudG(90, 250, .8, 30, 90) + cloudG(210, 330, .7, 5, 75);
    s += birdG(110, 90, 1, 0) + birdG(300, 130, .8, 2) + birdG(360, 60, .7, 4) + birdG(60, 200, .6, 1) + birdG(250, 230, .5, 3);
    // far blue mountains
    s += '<rect x="0" y="560" width="440" height="290" fill="#4E8F3A"/><rect x="0" y="640" width="440" height="200" fill="#3F7A2F"/><g transform="translate(0 -215)">';
    s += '<path d="M0 470L40 420L90 450L150 390L210 440L280 380L340 430L400 400L440 430V560H0Z" fill="#9CC8D6"/><path d="M0 500L60 455L120 490L190 440L260 485L330 450L440 495V580H0Z" fill="#7FB8A8"/>';
    // cliffs (left light, right big)
    s += '<path d="M440 330C420 340 410 380 392 400C384 440 396 470 380 520C372 560 392 600 380 700L440 700Z" fill="url(#' + u + 'rk)" stroke="#3E2A16" stroke-width="2"/><path d="M440 330C420 336 408 362 392 380C412 372 420 392 440 384Z" fill="#7CC243" stroke="#2E6B1E" stroke-width="1.6"/>';
    s += '<path d="M392 420L412 428M386 470L420 480M384 520L424 512M384 570L424 580M382 620L424 612" stroke="#3E2A16" stroke-width="2" opacity=".55"/>';
    s += '<path d="M0 420C20 430 40 470 58 500C66 540 50 580 62 700H0Z" fill="url(#' + u + 'rk)" opacity=".92" stroke="#3E2A16" stroke-width="2"/><path d="M0 420C16 428 36 452 52 470C40 456 18 452 0 458Z" fill="#8BD14B" stroke="#2E6B1E" stroke-width="1.6"/>';
    // misty valley hills with trees
    s += '<path d="M0 560C60 520 140 540 220 520C300 502 380 530 440 510V700H0Z" fill="#6DB35A"/><path d="M0 600C80 570 160 590 240 566C320 548 380 580 440 560V720H0Z" fill="#4E9E3F"/>';
    for (var i = 0; i < 46; i++) { var tx = 30 + R() * 380, ty = 520 + R() * 80, r = 6 + R() * 9; s += '<circle cx="' + n(tx) + '" cy="' + n(ty) + '" r="' + n(r) + '" fill="' + (i % 3 ? '#2F7A2F' : '#3F9A3A') + '"/><circle cx="' + n(tx - 2) + '" cy="' + n(ty - 3) + '" r="' + n(r * .55) + '" fill="#8BD14B" opacity=".6"/>'; }
    s += '<rect x="0" y="440" width="' + W + '" height="200" fill="url(#' + u + 'hz)"/>';
    // river
    s += '<path d="M200 520C190 550 250 560 230 590C210 620 270 640 250 690L320 690C330 650 270 630 290 600C310 570 250 556 262 520Z" fill="url(#' + u + 'rv)" stroke="#2A7FA8" stroke-width="1.5"/><path d="M215 540C225 548 240 548 245 560M240 600C250 612 262 614 268 626" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7"/>';
    // front earth cliff + waterfall
    s += '<path d="M0 690C60 668 130 684 200 676C240 672 300 682 320 686C380 680 410 672 440 676V840H0Z" fill="#7A5230"/><path d="M0 690C60 668 130 684 200 676C240 672 300 682 320 686C380 680 410 672 440 676V700C400 694 370 704 320 704C260 696 220 700 190 696C130 704 60 688 0 704Z" fill="#7CC243" stroke="#2E6B1E" stroke-width="2"/>';
    s += '<rect x="268" y="700" width="62" height="110" fill="url(#' + u + 'rv)" opacity=".95"/>';
    for (var w = 0; w < 7; w++) s += '<line class="ta-wf" x1="' + (274 + w * 8.6) + '" y1="700" x2="' + (274 + w * 8.6) + '" y2="810" stroke="#fff" stroke-width="3" stroke-dasharray="14 12" opacity=".85" style="animation-delay:-' + n(R() * 2) + 's"/>';
    s += '<ellipse cx="300" cy="812" rx="42" ry="10" fill="#fff" opacity=".7"/>';
    // palms
    s += palmG(46, 700, 250, 34, u, false) + palmG(84, 700, 170, -10, u, false) + palmG(60, 700, 120, 40, u, true);
    s += '</g>';
    // sun rays
    [[70, 40, 150, 260], [190, 60, 190, 360], [300, 40, 150, 440]].forEach(function (r) { s += '<polygon points="' + r[0] + ',0 ' + (r[0] + r[1]) + ',0 ' + (r[0] + r[2]) + ',' + r[3] + ' ' + (r[0] + r[2] - 60) + ',' + r[3] + '" fill="#FFFBE0" opacity=".16"/>'; });
    if (dark) { s += '<rect width="' + W + '" height="' + H + '" fill="#06143A" opacity=".62"/>'; for (var k = 0; k < 50; k++) s += '<circle class="ta-tw" cx="' + n(R() * W) + '" cy="' + n(R() * 380) + '" r="' + n(.6 + R() * 1.4) + '" fill="#fff" style="animation-delay:-' + n(R() * 4) + 's"/>'; s += '<circle cx="340" cy="90" r="30" fill="#FFF6C8"/><circle cx="330" cy="82" r="30" fill="#0A1B45" opacity=".0"/>'; }
    for (var f = 0; f < 18; f++) s += '<circle class="ta-ff" cx="' + n(40 + R() * 360) + '" cy="' + n(500 + R() * 260) + '" r="' + n(1.4 + R() * 1.8) + '" fill="#FFF3A0" style="animation-delay:-' + n(R() * 6) + 's;animation-duration:' + n(3 + R() * 4) + 's"/>';
    return svgWrap(s);
  }
  function forestFg(dark, u) {
    var R = rng(17), s = '';
    s += '<defs><linearGradient id="' + u + 'lg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3E9A2C"/><stop offset=".55" stop-color="#8BD02E"/><stop offset="1" stop-color="#E4F27A"/></linearGradient>' +
      '<linearGradient id="' + u + 'lg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1F6B25"/><stop offset=".6" stop-color="#3FA02E"/><stop offset="1" stop-color="#8BD14B"/></linearGradient>' +
      '<linearGradient id="' + u + 'lo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0B24A"/><stop offset=".5" stop-color="#C98A2E"/><stop offset="1" stop-color="#7A4E1C"/></linearGradient></defs>';
    // top-left & top-right dark branches with leaves (like the reference corners)
    s += '<path d="M-10 190C30 130 70 90 100 40C112 20 130 6 160 -10" stroke="#241608" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M-10 190C30 130 70 90 100 40C112 20 130 6 160 -10" stroke="#4A3018" stroke-width="15" fill="none" stroke-linecap="round"/>';
    s += '<path d="M450 250C410 190 370 140 350 90C340 60 330 30 300 -10" stroke="#241608" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M450 250C410 190 370 140 350 90C340 60 330 30 300 -10" stroke="#4A3018" stroke-width="13" fill="none" stroke-linecap="round"/>';
    for (var i = 0; i < 16; i++) { var t = i / 15; s += bigLeaf(-6 + t * 120, 180 - t * 160 + R() * 20, -110 + R() * 220, .22 + R() * .2, u, true); }
    for (var j = 0; j < 14; j++) { var t2 = j / 13; s += bigLeaf(444 - t2 * 130, 240 - t2 * 230 + R() * 20, -110 + R() * 220, .2 + R() * .2, u, true); }
    // hanging vines with curls
    [[40, 90, 120], [120, 40, 90], [380, 130, 110], [330, 60, 100]].forEach(function (v, k) {
      s += '<path d="M' + v[0] + ' ' + v[1] + 'C' + (v[0] - 14) + ' ' + (v[1] + v[2] * .4) + ' ' + (v[0] + 14) + ' ' + (v[1] + v[2] * .7) + ' ' + v[0] + ' ' + (v[1] + v[2]) + '" stroke="#2F7A2A" stroke-width="3.4" fill="none" stroke-linecap="round"/>' + curl(v[0], v[1] + v[2], 1, '#2F7A2A');
      for (var q = 1; q < 5; q++) s += leaf(v[0] + (q % 2 ? 3 : -3), v[1] + v[2] * q / 5, q % 2 ? 30 : 150, .55, '#4FB233');
    });
    // left & right mid-edge tropical foliage
    for (var a = 0; a < 7; a++) s += bigLeaf(-8, 330 + a * 58, -70 + R() * 50 + (a % 2) * 30, .38 + R() * .22, u, a % 2);
    for (var b = 0; b < 7; b++) s += '<g transform="translate(' + W + ' 0) scale(-1 1)">' + bigLeaf(-8, 380 + b * 52, -70 + R() * 50 + (b % 2) * 30, .38 + R() * .22, u, b % 2) + '</g>';
    // mossy golden log across the bottom
    s += '<path d="M-20 812C60 770 130 760 200 770C270 780 330 800 460 770" stroke="#4A2E10" stroke-width="54" fill="none" stroke-linecap="round"/><path d="M-20 806C60 764 130 754 200 764C270 774 330 794 460 764" stroke="url(#' + u + 'lo)" stroke-width="44" fill="none" stroke-linecap="round"/><path d="M-20 790C60 748 130 738 200 748C270 758 330 778 460 748" stroke="#FFD27A" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>';
    s += '<path d="M-20 786C60 744 130 734 200 744C270 754 330 774 460 744" stroke="#2E6B1E" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M-20 786C60 744 130 734 200 744C270 754 330 774 460 744" stroke="#8BD14B" stroke-width="12" fill="none" stroke-dasharray="7 5" stroke-linecap="round"/>';
    for (var r = 0; r < 8; r++) s += '<ellipse cx="' + (30 + r * 58) + '" cy="' + (792 - Math.sin(r * .9) * 12) + '" rx="5" ry="12" fill="none" stroke="#5A3410" stroke-width="2" opacity=".55"/>';
    // foreground big leaves, bottom corners
    s += bigLeaf(-6, 850, -35, 1.5, u, false) + bigLeaf(30, 850, -62, 1.2, u, true) + bigLeaf(-10, 700, -20, 1.05, u, true) + bigLeaf(0, 850, -10, 1, u, false);
    s += '<g transform="translate(' + W + ' 0) scale(-1 1)">' + bigLeaf(-6, 850, -38, 1.5, u, false) + bigLeaf(32, 850, -64, 1.2, u, true) + bigLeaf(-8, 690, -22, 1.05, u, true) + bigLeaf(4, 850, -8, 1, u, false) + '</g>';
    // flowers + grass tufts
    [[88, 806, 1.1], [112, 818, .9], [352, 808, 1.1], [330, 820, .9], [214, 760, .8]].forEach(function (p) { s += flower(p[0], p[1], p[2], '#F2442E'); });
    for (var g = 0; g < 26; g++) s += leaf(R() * W, 828 + R() * 14, -120 + R() * 60, .5 + R() * .4, ['#4FB233', '#8BD14B', '#2F8F2F'][g % 3]);
    s += butterfly(340, 330, 1.2, '#FF8A2B', '#FFD04D', 0) + butterfly(80, 470, 1, '#7FD0FF', '#E9F7FF', -1.5);
    // glints
    for (var k = 0; k < 8; k++) s += '<g class="ta-tw" style="animation-delay:-' + n(R() * 4) + 's">' + star4(n(40 + R() * 360), n(120 + R() * 600), n(4 + R() * 4), '#FFFBE0') + '</g>';
    if (dark) s += '<rect width="' + W + '" height="' + H + '" fill="#06143A" opacity=".28"/>';
    return svgWrap(s);
  }

  /* ================= CHINA ================= */
  function lantern(x, y, len, sc, d) {
    return '<g transform="translate(' + x + ' 0)"><g class="ta-swing" style="animation-delay:-' + d + 's"><line x1="0" y1="0" x2="0" y2="' + len + '" stroke="#C9972B" stroke-width="2"/><g transform="translate(0 ' + len + ') scale(' + sc + ')"><rect x="-12" y="-4" width="24" height="8" rx="2" fill="#E8B33A"/><ellipse cx="0" cy="30" rx="26" ry="28" fill="#D62828" stroke="#8E1414" stroke-width="2"/><path d="M0 2C-16 14-16 46 0 58M0 2C16 14 16 46 0 58M0 2V58" stroke="#F4B400" stroke-width="1.6" fill="none" opacity=".85"/><rect x="-12" y="56" width="24" height="7" rx="2" fill="#E8B33A"/><path d="M-8 63V84M0 63V92M8 63V84" stroke="#F4B400" stroke-width="2.4" stroke-linecap="round"/><text x="0" y="38" font-size="20" text-anchor="middle" fill="#FFD166" font-family="serif">福</text></g></g></g>';
  }
  function chinaBg(dark, u) {
    var R = rng(5), s = '', top = dark ? '#2A0D0D' : '#FFF3DC', bot = dark ? '#461616' : '#FFC995';
    s += '<defs><linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bot + '"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'g)"/>';
    s += '<circle cx="320" cy="250" r="96" fill="' + (dark ? '#FFC933' : '#F4B400') + '" opacity="' + (dark ? .16 : .3) + '"/>';
    for (var i = 0; i < 7; i++) { var cx = 40 + R() * 360, cy = 160 + R() * 520; s += '<g transform="translate(' + n(cx) + ' ' + n(cy) + ')" fill="none" stroke="#E8B33A" stroke-width="2" opacity="' + (dark ? .22 : .38) + '" stroke-linecap="round"><path d="M-40 0C-40-14-22-18-14-8C-8-16 8-16 14-8C22-18 40-14 40 0"/><path d="M-26 8C-26 0-14-2-10 4C-4-2 4-2 10 4C14-2 26 0 26 8"/></g>'; }
    s += '<path d="M0 700L70 620L120 670L190 590L260 680L330 610L440 700V840H0Z" fill="' + (dark ? 'rgba(120,30,30,.55)' : 'rgba(214,40,40,.18)') + '"/><path d="M0 760L90 690L160 740L250 670L340 750L440 700V840H0Z" fill="' + (dark ? 'rgba(90,20,20,.7)' : 'rgba(184,50,30,.22)') + '"/>';
    for (var p = 0; p < 18; p++) s += '<ellipse class="ta-fall" cx="' + n(R() * W) + '" cy="-10" rx="5" ry="3" fill="#FF9FB5" opacity=".85" style="animation-delay:-' + n(R() * 12) + 's;animation-duration:' + n(8 + R() * 8) + 's"/>';
    return svgWrap(s);
  }
  function chinaFg(dark, u) {
    var s = '';
    s += '<rect x="9" y="9" width="' + (W - 18) + '" height="' + (H - 18) + '" rx="22" fill="none" stroke="#E8B33A" stroke-width="3.5" opacity=".95"/><rect x="17" y="17" width="' + (W - 34) + '" height="' + (H - 34) + '" rx="16" fill="none" stroke="#B71C1C" stroke-width="1.5" opacity=".8"/>';
    [[9, 9, 1, 1], [W - 9, 9, -1, 1], [9, H - 9, 1, -1], [W - 9, H - 9, -1, -1]].forEach(function (c) { s += '<g transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ' ' + c[3] + ')"><path d="M0 40C0 10 10 0 40 0" stroke="#F4B400" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="7" fill="#D62828" stroke="#F4B400" stroke-width="2.4"/></g>'; });
    s += '<rect x="0" y="0" width="' + W + '" height="26" fill="#B71C1C"/><rect x="0" y="22" width="' + W + '" height="4" fill="#F4B400"/>';
    s += lantern(60, 26, 40, 1, 0) + lantern(150, 26, 18, .75, 1.3) + lantern(290, 26, 22, .8, .6) + lantern(380, 26, 46, 1, 2);
    // bamboo
    [[24, 640], [44, 700], [W - 26, 650], [W - 48, 710]].forEach(function (b, i) { var x = b[0]; s += '<g><rect x="' + (x - 5) + '" y="' + b[1] + '" width="10" height="' + (H - b[1]) + '" fill="#4E9A3A" stroke="#245A2A" stroke-width="1.5"/>'; for (var j = 0; j < 6; j++) s += '<rect x="' + (x - 6.5) + '" y="' + (b[1] + 20 + j * 28) + '" width="13" height="4" rx="2" fill="#2F6E2F"/>'; s += leaf(x + 4, b[1] + 40, -30, .9, '#6DBE45') + leaf(x - 4, b[1] + 90, -150, .8, '#3FA34D') + '</g>'; });
    return svgWrap(s);
  }

  /* ================= OCEAN ================= */
  function oceanBg(dark, u) {
    var R = rng(3), s = '', c = dark ? ['#0B4A78', '#0A3556', '#041A2E'] : ['#BFEBFF', '#6FC3EE', '#2A86C8'];
    s += '<defs><linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'g)"/>';
    [[90, 60, 130, 300, 560], [210, 90, 150, 380, 700], [330, 60, 110, 470, 640]].forEach(function (r) { s += '<polygon points="' + r[0] + ',0 ' + (r[0] + r[1]) + ',0 ' + r[3] + ',' + r[4] + ' ' + (r[3] - r[2]) + ',' + r[4] + '" fill="#fff" opacity="' + (dark ? .06 : .2) + '"/>'; });
    for (var f = 0; f < 4; f++) { var fx = 40 + R() * 300, fy = 160 + R() * 460; s += '<g transform="translate(' + n(fx) + ' ' + n(fy) + ') scale(' + n(.7 + R() * .6) + ')" opacity="' + (dark ? .22 : .28) + '" fill="#fff"><ellipse cx="0" cy="0" rx="20" ry="9"/><path d="M-18 0L-32 -9V9Z"/></g>'; }
    for (var b = 0; b < 22; b++) { var r = 2 + R() * 6; s += '<circle class="ta-rise" cx="' + n(30 + R() * 380) + '" cy="' + H + '" r="' + n(r) + '" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.75)" stroke-width="1.2" style="animation-delay:-' + n(R() * 14) + 's;animation-duration:' + n(9 + R() * 9) + 's"/>'; }
    s += '<path d="M0 790C70 770 120 800 200 785C290 768 360 800 440 780V840H0Z" fill="' + (dark ? '#2C4A5A' : '#F1DDA4') + '"/>';
    return svgWrap(s);
  }
  function seaweed(x, h, col, d) { return '<g class="ta-sway" style="animation-delay:-' + d + 's"><path d="M' + x + ' ' + H + 'C' + (x - 22) + ' ' + (H - h * .3) + ' ' + (x + 22) + ' ' + (H - h * .6) + ' ' + x + ' ' + (H - h) + '" stroke="' + col + '" stroke-width="10" fill="none" stroke-linecap="round"/></g>'; }
  function coral(x, y, sc, col) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" stroke="' + col + '" stroke-width="9" stroke-linecap="round" fill="none"><path d="M0 0V-40M0 -20L-16 -38M0 -28L16 -50M-16 -38L-24 -52M16 -50L26 -62"/></g>'; }
  function oceanFg(dark, u) {
    var s = '';
    s += '<path d="M0 0H' + W + 'V26C390 40 350 12 300 26C250 40 210 12 160 26C110 40 60 12 0 26Z" fill="#fff" opacity="' + (dark ? .18 : .55) + '"/>';
    s += seaweed(14, 330, '#2A9D6F', 0) + seaweed(40, 220, '#3DBE7E', 1.2) + seaweed(W - 16, 360, '#2A9D6F', .6) + seaweed(W - 44, 240, '#3DBE7E', 1.9) + seaweed(70, 120, '#58D68D', .4) + seaweed(W - 76, 130, '#58D68D', 1.5);
    s += coral(104, 800, 1, '#FF7F6B') + coral(140, 812, .7, '#FFB347') + coral(W - 110, 802, 1.1, '#E75A9B') + coral(W - 150, 814, .7, '#FF7F6B');
    s += '<g transform="translate(225 818)"><path d="M-18 0Q-18 -22 0 -22Q18 -22 18 0Z" fill="#FFD1DC" stroke="#E07A9B" stroke-width="2"/><path d="M0 -22V0M-9 -20L-12 0M9 -20L12 0" stroke="#E07A9B" stroke-width="1.6"/></g>';
    s += '<g transform="translate(300 826)"><path d="M0 -12L3.5 -4L12 -3.5L5.5 2L7.5 11L0 6.5L-7.5 11L-5.5 2L-12 -3.5L-3.5 -4Z" fill="#FF8A5B" stroke="#C4552B" stroke-width="1.5"/></g>';
    return svgWrap(s);
  }

  /* ================= CANDY ================= */
  function candyBg(dark, u) {
    var R = rng(9), s = '', c = dark ? ['#34132B', '#5E2550'] : ['#FFF0F8', '#FFC1DF'], cols = ['#FF5CA8', '#2EC4B6', '#FF9F1C', '#9D7BFF', '#5DD39E', '#FFD84D'];
    s += '<defs><linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'g)"/>';
    for (var i = 0; i < 60; i++) s += '<rect x="' + n(R() * W) + '" y="' + n(R() * H) + '" width="12" height="4.4" rx="2.2" transform="rotate(' + n(R() * 180) + ' ' + n(R() * W) + ' ' + n(R() * H) + ')" fill="' + cols[i % cols.length] + '" opacity="' + (dark ? .35 : .5) + '"/>';
    for (var j = 0; j < 14; j++) s += '<circle cx="' + n(R() * W) + '" cy="' + n(R() * H) + '" r="' + n(6 + R() * 14) + '" fill="#fff" opacity="' + (dark ? .06 : .35) + '"/>';
    return svgWrap(s);
  }
  function candyFg(dark, u) {
    var s = '', cols = ['#FF5CA8', '#2EC4B6', '#FF9F1C', '#9D7BFF', '#5DD39E'];
    s += '<defs><pattern id="' + u + 'p" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="26" height="26" fill="#fff"/><rect width="13" height="26" fill="#FF3D8B"/></pattern></defs>';
    s += '<rect x="0" y="0" width="22" height="' + H + '" fill="url(#' + u + 'p)" stroke="#fff" stroke-width="2"/><rect x="' + (W - 22) + '" y="0" width="22" height="' + H + '" fill="url(#' + u + 'p)" stroke="#fff" stroke-width="2"/>';
    s += '<path d="M0 0H' + W + 'V30C420 30 420 62 400 62C380 62 380 34 356 34C336 34 340 78 314 78C290 78 296 36 266 36C240 36 244 52 222 52C196 52 206 30 176 30C148 30 154 70 128 70C102 70 112 34 84 34C58 34 66 60 44 60C22 60 28 30 0 30Z" fill="#fff" stroke="#FFB3D9" stroke-width="2"/><path d="M0 0H' + W + 'V14H0Z" fill="#FFD6EA"/>';
    [[70, 800, 0], [W - 70, 800, 1]].forEach(function (l) { var c = cols[l[2] * 2]; s += '<g transform="translate(' + l[0] + ' ' + l[1] + ')"><rect x="-3" y="-4" width="6" height="64" rx="3" fill="#fff" stroke="#E0A8C8" stroke-width="1.5"/><circle cx="0" cy="-30" r="34" fill="' + c + '" stroke="#fff" stroke-width="4"/><path d="M0 -30m6 0a6 6 0 1 1 -3 -5a14 14 0 1 1 3 22a24 24 0 1 1 -25 -30" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".92"/></g>'; });
    for (var i = 0; i < 9; i++) { var x = 60 + i * 40; s += '<g transform="translate(' + x + ' ' + H + ')"><path d="M-18 0Q-18 -34 0 -34Q18 -34 18 0Z" fill="' + cols[i % cols.length] + '" stroke="rgba(255,255,255,.9)" stroke-width="2.4"/><circle cx="-6" cy="-20" r="1.8" fill="#fff"/><circle cx="4" cy="-24" r="1.8" fill="#fff"/><circle cx="8" cy="-14" r="1.8" fill="#fff"/><circle cx="-2" cy="-10" r="1.8" fill="#fff"/></g>'; }
    return svgWrap(s);
  }

  /* ================= SPACE ================= */
  function spaceBg(dark, u) {
    var R = rng(21), s = '';
    s += '<defs><linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0522"/><stop offset=".6" stop-color="#1E1050"/><stop offset="1" stop-color="#2D1470"/></linearGradient><radialGradient id="' + u + 'n1" cx=".25" cy=".25" r=".5"><stop offset="0" stop-color="#7C4DFF" stop-opacity=".5"/><stop offset="1" stop-color="#7C4DFF" stop-opacity="0"/></radialGradient><radialGradient id="' + u + 'n2" cx=".8" cy=".7" r=".5"><stop offset="0" stop-color="#00E5FF" stop-opacity=".32"/><stop offset="1" stop-color="#00E5FF" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + u + 'pl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFB86B"/><stop offset=".6" stop-color="#E5603A"/><stop offset="1" stop-color="#7A2A5A"/></radialGradient></defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'g)"/><rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'n1)"/><rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'n2)"/>';
    for (var i = 0; i < 110; i++) s += '<circle class="ta-tw" cx="' + n(R() * W) + '" cy="' + n(R() * H) + '" r="' + n(.5 + R() * 1.6) + '" fill="#fff" style="animation-delay:-' + n(R() * 5) + 's;animation-duration:' + n(2 + R() * 3) + 's"/>';
    for (var k = 0; k < 7; k++) s += '<g class="ta-tw" style="animation-delay:-' + n(R() * 4) + 's">' + star4(n(R() * W), n(R() * H), n(5 + R() * 7), '#CFF6FF') + '</g>';
    s += '<g transform="translate(350 150)"><ellipse cx="0" cy="6" rx="86" ry="18" fill="none" stroke="#FFD43B" stroke-width="6" opacity=".55" transform="rotate(-18)"/><circle r="46" fill="url(#' + u + 'pl)"/><path d="M-44 -6Q0 8 44 -10" stroke="rgba(255,255,255,.25)" stroke-width="5" fill="none"/><ellipse cx="0" cy="6" rx="86" ry="18" fill="none" stroke="#FFD43B" stroke-width="6" opacity=".9" transform="rotate(-18)" stroke-dasharray="132 140" stroke-dashoffset="-70"/></g>';
    s += '<circle cx="64" cy="610" r="26" fill="#9FB4E8"/><circle cx="54" cy="602" r="6" fill="rgba(0,0,0,.2)"/><circle cx="74" cy="620" r="4" fill="rgba(0,0,0,.2)"/>';
    s += '<g class="ta-shoot"><line x1="0" y1="0" x2="-90" y2="-40" stroke="url(#' + u + 'sg)" stroke-width="2.4" stroke-linecap="round"/><circle r="3" fill="#fff"/></g><defs><linearGradient id="' + u + 'sg"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
    return svgWrap(s);
  }
  function spaceFg(dark, u) {
    var s = '<rect x="7" y="7" width="' + (W - 14) + '" height="' + (H - 14) + '" rx="26" fill="none" stroke="#00E5FF" stroke-width="2" opacity=".6" style="filter:drop-shadow(0 0 5px #00E5FF)"/>';
    [[7, 7, 1, 1], [W - 7, 7, -1, 1], [7, H - 7, 1, -1], [W - 7, H - 7, -1, -1]].forEach(function (c) { s += '<path transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ' ' + c[3] + ')" d="M0 46V26Q0 0 26 0H46" stroke="#FF4DDA" stroke-width="4" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 5px #FF4DDA)"/>'; });
    return svgWrap(s);
  }

  var ART = {
    forest: { bg: forestBg, fg: forestFg }, china: { bg: chinaBg, fg: chinaFg }, ocean: { bg: oceanBg, fg: oceanFg },
    candy: { bg: candyBg, fg: candyFg }, space: { bg: spaceBg, fg: spaceFg }
  };
  var uid = 0;
  function build(id, dark, layer) { var a = ART[id]; return a ? a[layer](dark, 'ta' + (++uid) + layer[0]) : ''; }

  /* ---------- CSS ---------- */
  var css = '' +
    '#theme-art-bg,#theme-art-fg{position:absolute;inset:0;pointer-events:none}#theme-art-bg{z-index:0}#theme-art-fg{z-index:4}' +
    'html[data-theme="classic"] #theme-art-bg,html[data-theme="classic"] #theme-art-fg{display:none}' +
    'html[data-theme]:not([data-theme="classic"]) .mobile-app-frame::before,html[data-theme]:not([data-theme="classic"]) .home-bg{display:none!important}' +
    '.ta-drift{animation:taDrift 70s ease-in-out infinite alternate}@keyframes taDrift{from{transform:translateX(-30px)}to{transform:translateX(40px)}}.ta-bird{animation:taBird 14s ease-in-out infinite alternate}@keyframes taBird{from{transform:translate(-40px,6px)}to{transform:translate(60px,-14px)}}.ta-crown{animation:taCrown 5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 60%}@keyframes taCrown{from{transform:rotate(-2deg)}to{transform:rotate(2.5deg)}}.ta-wf{animation:taWf 1s linear infinite}@keyframes taWf{to{stroke-dashoffset:-26}}' +
    '.ta-float{animation:taFloat 5s ease-in-out infinite}@keyframes taFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,-18px)}}' +
    '.ta-flap{animation:taFlap .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 50%}@keyframes taFlap{from{transform:scaleX(1)}to{transform:scaleX(.35)}}' +
    '.ta-ff{animation:taFF 4s ease-in-out infinite;filter:drop-shadow(0 0 4px #FFE98A)}@keyframes taFF{0%,100%{opacity:.15;transform:translate(0,0)}50%{opacity:1;transform:translate(8px,-14px)}}' +
    '.ta-swing{animation:taSwing 3.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 0}@keyframes taSwing{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}' +
    '.ta-fall{animation:taFall 11s linear infinite}@keyframes taFall{from{transform:translate(0,0) rotate(0)}to{transform:translate(-60px,860px) rotate(360deg)}}' +
    '.ta-rise{animation:taRise 12s linear infinite}@keyframes taRise{from{transform:translateY(0)}to{transform:translateY(-880px)}}' +
    '.ta-sway{animation:taSway 3.8s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes taSway{0%,100%{transform:skewX(-5deg)}50%{transform:skewX(5deg)}}' +
    '.ta-tw{animation:taTw 3s ease-in-out infinite}@keyframes taTw{0%,100%{opacity:.25}50%{opacity:1}}' +
    '.ta-shoot{animation:taShoot 7s linear infinite;opacity:0}@keyframes taShoot{0%{transform:translate(440px,60px);opacity:0}4%{opacity:1}14%{transform:translate(120px,200px);opacity:0}100%{transform:translate(120px,200px);opacity:0}}' +
    /* forest: wooden + parchment UI */
    'html[data-theme="forest"] .home-logo,html[data-theme="forest"] .screen-main-title,html[data-theme="forest"] .card-heading,html[data-theme="forest"] .th-name{font-family:"Lilita One","Fredoka One","Libre Baskerville",sans-serif!important;letter-spacing:2px}' +
    'html[data-theme="forest"] .home-logo{color:#FFC83D!important;-webkit-text-fill-color:#FFC83D!important;-webkit-text-stroke:1.6px #7A3A00;font-size:1.9rem!important;padding:8px 26px 6px!important;border-radius:20px;background:linear-gradient(180deg,#7C8594,#454C59)!important;border:3px solid #272C36;text-shadow:0 3px 0 #B45A00,0 5px 0 rgba(0,0,0,.35)!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.3),inset 0 -4px 0 rgba(0,0,0,.25),0 6px 0 #1B1F27,0 12px 16px rgba(0,0,0,.35)}' +
    'html[data-theme="forest"][data-ui] .mode-grid-card,html[data-theme="forest"][data-ui] .level-clay-card,html[data-theme="forest"][data-ui] .modal-clay-card,html[data-theme="forest"] .th-card{border:4px solid #C98A2E!important;outline:3px solid #5A3410;outline-offset:-1px;border-radius:20px;box-shadow:inset 0 0 0 3px #FFE3A0,0 6px 0 #4A2A0C,0 14px 18px -4px rgba(0,0,0,.4)!important}' +
    'html[data-theme="forest"][data-ui] .mode-grid-card:not(.card-play) .card-heading,html[data-theme="forest"][data-ui] .mode-grid-card:not(.card-play) .card-desc-text{color:var(--text-navy)!important}' +
    'html[data-theme="forest"][data-ui] .card-play,html[data-theme="forest"][data-ui] .featured-play-card{background:linear-gradient(180deg,#FFD65A,#F08A1A)!important}' +
    'html[data-theme="forest"][data-ui] .card-play .card-heading{color:#fff!important;-webkit-text-stroke:1.2px #8A4A00;text-shadow:0 3px 0 #B45A00}' +
    'html[data-theme="forest"][data-ui] .btn-primary-clay,html[data-theme="forest"] .th-btn:not(.cur):not(.equip){background:linear-gradient(180deg,#8BD14B,#3E9A2C)!important;border:3px solid #2A5A14;box-shadow:0 4px 0 #1E4510}' +
    'html[data-theme="forest"] .th-btn.equip{background:linear-gradient(180deg,#FFD65A,#F08A1A)!important;border:3px solid #8A4A00}' +
    'html[data-theme="forest"] .th-btn.cur{background:#5A3410!important;color:#FFE3A0!important}' +
    'html[data-theme="forest"] .th-card.on{box-shadow:0 0 0 3px #8BD14B,0 6px 0 #4A2A0C!important}' +
    /* china */
    'html[data-theme="china"] .app-viewport,html[data-theme="china"] .app-header{padding-left:28px!important;padding-right:28px!important}' +
    'html[data-theme="china"][data-ui] .mode-grid-card,html[data-theme="china"][data-ui] .level-clay-card,html[data-theme="china"][data-ui] .modal-clay-card,html[data-theme="china"] .th-card{border:2.5px solid #E8B33A!important;box-shadow:0 0 0 2px #B71C1C,0 8px 16px -6px rgba(120,10,10,.45)!important}' +
    'html[data-theme="china"] .home-logo{color:#B71C1C!important;-webkit-text-fill-color:#B71C1C!important;text-shadow:0 2px 0 #F4B400!important}' +
    /* ocean */
    'html[data-theme="ocean"][data-ui] .mode-grid-card,html[data-theme="ocean"][data-ui] .level-clay-card,html[data-theme="ocean"][data-ui] .modal-clay-card{border:2px solid rgba(255,255,255,.85)!important;backdrop-filter:blur(3px)}' +
    'html[data-theme="ocean"] .app-viewport,html[data-theme="ocean"] .app-header{padding-left:30px!important;padding-right:30px!important}' +
    /* candy */
    'html[data-theme="candy"] .app-viewport,html[data-theme="candy"] .app-header{padding-left:32px!important;padding-right:32px!important}' +
    'html[data-theme="candy"] .home-logo,html[data-theme="candy"] .card-heading,html[data-theme="candy"] .screen-main-title{font-family:"Fredoka One","Fredoka","Righteous",sans-serif!important}' +
    'html[data-theme="candy"][data-ui] .mode-grid-card,html[data-theme="candy"][data-ui] .level-clay-card,html[data-theme="candy"][data-ui] .modal-clay-card{border:3px solid #fff!important;border-radius:26px;box-shadow:0 6px 0 rgba(255,92,168,.45),0 12px 18px -6px rgba(200,40,120,.35)!important}' +
    /* space */
    'html[data-theme="space"] .app-viewport,html[data-theme="space"] .app-header{padding-left:26px!important;padding-right:26px!important}' +
    'html[data-theme="space"] .home-logo,html[data-theme="space"] .screen-main-title,html[data-theme="space"] .card-heading{font-family:"Orbitron","Righteous",sans-serif!important;letter-spacing:3px}' +
    'html[data-theme="space"][data-ui] .mode-grid-card,html[data-theme="space"][data-ui] .level-clay-card,html[data-theme="space"][data-ui] .modal-clay-card,html[data-theme="space"] .th-card{border:1.5px solid rgba(0,229,255,.55)!important;box-shadow:0 0 14px rgba(124,77,255,.55),inset 0 0 12px rgba(0,229,255,.12)!important;backdrop-filter:blur(4px)}' +
    'html[data-theme="space"] .home-logo{color:#9FE8FF!important;-webkit-text-fill-color:#9FE8FF!important;text-shadow:0 0 12px #00E5FF!important}' +
    /* shop preview art */
    '.th-prev .ta-prev{position:absolute;inset:0;overflow:hidden}.th-prev .ta-prev svg{position:absolute;inset:0;width:100%;height:100%}';

  var dark = function () { return document.documentElement.getAttribute('data-dark') === '1'; };
  function render() {
    var frame = document.querySelector('.mobile-app-frame'); if (!frame) return;
    var id = document.documentElement.getAttribute('data-theme') || 'classic';
    var bg = document.getElementById('theme-art-bg'), fg = document.getElementById('theme-art-fg');
    if (!bg) { bg = document.createElement('div'); bg.id = 'theme-art-bg'; frame.insertBefore(bg, frame.firstChild); fg = document.createElement('div'); fg.id = 'theme-art-fg'; frame.insertBefore(fg, bg.nextSibling); }
    var key = id + (dark() ? 'D' : 'L'); if (bg.dataset.key === key) return; bg.dataset.key = key;
    bg.innerHTML = build(id, dark(), 'bg'); fg.innerHTML = build(id, dark(), 'fg');
  }
  function decoratePreviews() {
    var order = ['classic', 'forest', 'china', 'ocean', 'candy', 'space'];
    document.querySelectorAll('#shop-items-container .th-card').forEach(function (card, i) {
      var id = order[i], prev = card.querySelector('.th-prev'); if (!prev || !ART[id] || prev.querySelector('.ta-prev')) return;
      var d = document.createElement('div'); d.className = 'ta-prev';
      d.innerHTML = build(id, false, 'bg').replace('xMidYMid slice', 'xMidYMin slice') + build(id, false, 'fg').replace('xMidYMid slice', 'xMidYMin slice');
      d.querySelectorAll('svg').forEach(function (v, k) { v.setAttribute('preserveAspectRatio', 'xMidYMin slice'); if (k) v.style.position = 'absolute'; });
      prev.insertBefore(d, prev.firstChild);
      var em = prev.querySelector('.th-emoji'); if (em) em.style.zIndex = 3;
      prev.querySelectorAll(':scope > svg').forEach(function (v) { v.style.zIndex = 2; });
    });
  }
  function boot() {
    // fonts are linked statically in index.html (the old URL here was missing 'family=' before Cinzel)
    var st = document.createElement('style'); st.id = 'theme-art-css'; st.textContent = css; document.head.appendChild(st);
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-dark', 'data-ui'] });
    var box = document.getElementById('shop-items-container');
    if (box) new MutationObserver(decoratePreviews).observe(box, { childList: true });
    render(); decoratePreviews();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 200); }); else setTimeout(boot, 200);
})();
