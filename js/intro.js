/* ---- js/intro.js ---- */
/**
 * ARROUT - Cinematic Animated Intro
 * Ported exactly from Arrout (5).html with website theme colors & styling.
 */

(function initArroutIntro() {
  const D = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const DR = [['-150px', '0'], ['150px', '0'], ['0', '-90px'], ['0', '90px'], ['-150px', '0'], ['150px', '0']];

  function tile(mask, maxL, cols, rows) {
    const g = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => mask(x, y, cols, rows) ? -1 : -2));
    const fr = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && g[y][x] == -1;
    const deg = (x, y) => D.reduce((n, d) => n + fr(x + d[0], y + d[1]), 0);
    const sn = [];
    for (;;) {
      let best = null, bd = 9;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (g[y][x] == -1) {
            const d = deg(x, y) + Math.random() * 0.9;
            if (d < bd) { bd = d; best = [x, y]; }
          }
        }
      }
      if (!best) break;
      const id = sn.length, p = [best];
      g[best[1]][best[0]] = id;
      const len = 2 + Math.floor(Math.random() * (maxL - 1));
      while (p.length < len) {
        const [x, y] = p[p.length - 1];
        let o = null, od = 9;
        for (const d of D) {
          const nx = x + d[0], ny = y + d[1];
          if (fr(nx, ny)) {
            const q = deg(nx, ny) + Math.random() * 1.5;
            if (q < od) { od = q; o = [nx, ny]; }
          }
        }
        if (!o) break;
        p.push(o);
        g[o[1]][o[0]] = id;
      }
      if (p.length < 2) {
        let ok = false;
        for (const d of D) {
          const nx = best[0] + d[0], ny = best[1] + d[1];
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || g[ny][nx] < 0) continue;
          const s = sn[g[ny][nx]], a = s[0], b = s[s.length - 1];
          if (a[0] == nx && a[1] == ny) { s.unshift(best); ok = true; break; }
          if (b[0] == nx && b[1] == ny) { s.push(best); ok = true; break; }
        }
        if (!ok) { g[best[1]][best[0]] = -2; continue; }
        continue;
      }
      sn.push(p);
    }
    return sn;
  }

  function dirOf(p) {
    const a = p[p.length - 2], b = p[p.length - 1];
    return D.findIndex(v => v[0] == b[0] - a[0] && v[1] == b[1] - a[1]);
  }

  function freeIn(g, a, cols, rows) {
    const h = a.p[a.p.length - 1];
    let x = h[0] + D[a.dir][0], y = h[1] + D[a.dir][1];
    while (x >= 0 && y >= 0 && x < cols && y < rows) {
      if (g[y][x] >= 0 && g[y][x] !== a.id) return false;
      x += D[a.dir][0];
      y += D[a.dir][1];
    }
    return true;
  }

  function stuck(list, grid, cols, rows) {
    const g = grid.map(r => r.slice());
    let left = list.slice();
    for (;;) {
      const rem = left.filter(a => freeIn(g, a, cols, rows));
      if (!rem.length) return left;
      rem.forEach(a => a.p.forEach(([x, y]) => g[y][x] = -1));
      left = left.filter(a => !rem.includes(a));
      if (!left.length) return left;
    }
  }

  function sub(pts, s, e) {
    const o = [];
    for (let i = 0; i < pts.length - 1; i++) {
      if (e <= i || s >= i + 1) continue;
      const a = pts[i], b = pts[i + 1], t0 = Math.max(s, i) - i, t1 = Math.min(e, i + 1) - i;
      if (!o.length) o.push([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]);
      o.push([a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]);
    }
    return o;
  }

  function fx() {
    const itl = document.getElementById('itl');
    if (!itl) return;
    itl.innerHTML = [...'ARROUT'].map((c, i) =>
      '<span class="lt" style="--d:' + (2.6 + i * 0.1) + 's;--x:' + DR[i][0] + ';--y:' + DR[i][1] + '">' + c + '</span>'
    ).join('');
  }

  function bd() {
    const B = document.getElementById('bd');
    const I = document.getElementById('intro');
    if (!B || !I) return;

    const rect = I.getBoundingClientRect();
    const W = rect.width || window.innerWidth || 400;
    const H = rect.height || window.innerHeight || 700;
    const n = 9;
    const c = Math.floor(Math.min(W, 520) / n);
    const r = Math.floor(H / c);
    const dpr = window.devicePixelRatio || 1;
    const M = Math.max(n, r);

    let A = null, G;
    for (let t = 0; t < 8 && !A; t++) {
      const sn = tile(() => 1, 6, n, r);
      if (!sn) continue;
      G = Array.from({ length: r }, () => Array(n).fill(-1));
      const L = sn.map((p, id) => {
        if (Math.random() < 0.5) p.reverse();
        p.forEach(q => G[q[1]][q[0]] = id);
        return { id, p, dir: dirOf(p) };
      });
      for (let i = 0; i < 600; i++) {
        const st = stuck(L, G, n, r);
        if (!st.length) { A = L; break; }
        for (let k = Math.max(1, st.length >> 3); k > 0; k--) {
          const a = st[Math.floor(Math.random() * st.length)];
          a.p.reverse();
          a.dir = dirOf(a.p);
        }
      }
    }
    if (!A) return;

    const ox = (W - n * c) / 2;
    const oy = (H - r * c) / 2;

    A.forEach(a => {
      const h = a.p[a.p.length - 1];
      a.pts = a.p.map(q => [q[0] + 0.5, q[1] + 0.5]);
      a.x = a.pts.slice();
      for (let i = 1; i <= M + a.p.length + 2; i++) {
        a.x.push([h[0] + 0.5 + D[a.dir][0] * i, h[1] + 0.5 + D[a.dir][1] * i]);
      }
      a.L = a.p.length - 1;
      a.k = Math.hypot(h[0] - n / 2 + 0.5, h[1] - r / 2 + 0.5);
      a.d = -1;
    });

    B.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    B.innerHTML = '<canvas width="' + Math.round(W * dpr) + '" height="' + Math.round(H * dpr) + '" style="width:100%;height:100%"></canvas>';
    const cvs = B.querySelector('canvas');
    if (!cvs) return;
    const cx = cvs.getContext('2d');

    // Theme color blending: Dark Navy #152642 on Canvas Cream #FAF6F0
    const I0 = [21, 38, 66], B0 = [250, 246, 240];
    const col = al => 'rgba(' + I0.join(',') + ',' + al.toFixed(3) + ')';

    const fr = a => {
      const h = a.p[a.p.length - 1], v = D[a.dir];
      let x = h[0] + v[0], y = h[1] + v[1];
      while (x >= 0 && y >= 0 && x < n && y < r) {
        if (G[y][x] >= 0 && G[y][x] !== a.id) return false;
        x += v[0]; y += v[1];
      }
      return true;
    };

    // One single filled outline per arrow (body + head together), so transparency
    // is even and the head never looks like a separate part.
    const dp = (pts0, colorStr) => {
      let pts = [];
      pts0.forEach(q => {
        const l = pts[pts.length - 1];
        if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 1e-6) pts.push([q[0], q[1]]);
      });
      if (pts.length < 2) return;
      const hw = 0.065, HL = 0.4, HW = 0.26;

      // direction of the last segment (this is where the head points)
      let e = pts[pts.length - 1], q = pts[pts.length - 2];
      let dx = e[0] - q[0], dy = e[1] - q[1];
      let l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;

      // the body stops where the head's base starts (0.2 before the line's end)
      let trim = 0.2;
      while (trim > 0 && pts.length > 1) {
        const a2 = pts[pts.length - 2], b2 = pts[pts.length - 1];
        const sl = Math.hypot(b2[0] - a2[0], b2[1] - a2[1]);
        if (sl > trim + 1e-6) {
          const t = (sl - trim) / sl;
          pts[pts.length - 1] = [a2[0] + (b2[0] - a2[0]) * t, a2[1] + (b2[1] - a2[1]) * t];
          trim = 0;
        } else {
          trim -= sl;
          pts.pop();
        }
      }
      if (pts.length < 2) pts = [[e[0] - dx * 0.2 - dx * 0.001, e[1] - dy * 0.2 - dy * 0.001], [e[0] - dx * 0.2, e[1] - dy * 0.2]];

      // left / right edges of the body with mitred corners
      const n = pts.length, L = [], R = [];
      const dirs = [];
      for (let i = 0; i < n - 1; i++) {
        const ex = pts[i + 1][0] - pts[i][0], ey = pts[i + 1][1] - pts[i][1], el2 = Math.hypot(ex, ey) || 1;
        dirs.push([ex / el2, ey / el2]);
      }
      for (let i = 0; i < n; i++) {
        let nx, ny, k = hw;
        if (i === 0) { nx = -dirs[0][1]; ny = dirs[0][0]; }
        else if (i === n - 1) { nx = -dirs[n - 2][1]; ny = dirs[n - 2][0]; }
        else {
          const n1 = [-dirs[i - 1][1], dirs[i - 1][0]], n2 = [-dirs[i][1], dirs[i][0]];
          const dot = n1[0] * n2[0] + n1[1] * n2[1];
          k = hw / Math.max(0.2, 1 + dot);
          nx = n1[0] + n2[0]; ny = n1[1] + n2[1];
        }
        L.push([pts[i][0] + nx * k, pts[i][1] + ny * k]);
        R.push([pts[i][0] - nx * k, pts[i][1] - ny * k]);
      }

      const B = pts[n - 1];
      const px = -dy, py = dx;               // head's side direction
      cx.fillStyle = colorStr;
      cx.beginPath();
      L.forEach((m, i) => i ? cx.lineTo(m[0], m[1]) : cx.moveTo(m[0], m[1]));
      cx.lineTo(B[0] + px * HW, B[1] + py * HW);
      cx.lineTo(B[0] + dx * HL, B[1] + dy * HL);
      cx.lineTo(B[0] - px * HW, B[1] - py * HW);
      for (let i = n - 1; i >= 0; i--) cx.lineTo(R[i][0], R[i][1]);
      cx.closePath();
      cx.fill();
    };

    let last = performance.now(), acc = 0;
    const T0 = last;

    function lp(t) {
      if (I.dataset.x || I.style.display === 'none') return;
      const dt = Math.min(0.05, (t - last) / 1000);
      const el = (t - T0) / 1000;
      last = t;

      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      cx.setTransform(dpr * c, 0, 0, dpr * c, dpr * ox, dpr * oy);
      cx.lineWidth = 0.13;
      cx.lineCap = cx.lineJoin = 'round';

      if (el > 1.4) {
        acc = Math.min(3, acc + dt * 34);
        while (acc >= 1) {
          acc--;
          let b = null;
          A.forEach(a => {
            if (a.d < 0 && fr(a) && (!b || a.k < b.k)) b = a;
          });
          if (!b) break;
          b.d = 0;
          b.p.forEach(q => G[q[1]][q[0]] = -1);
        }
      }

      let live = 0;
      A.forEach(a => {
        if (a.d < 0) {
          dp(a.pts, col(Math.min(1, Math.max(0, (el - 0.15 - a.k * 0.055) / 0.45)) * 0.16));
          live++;
        } else if (a.d < M + a.L + 3) {
          a.d += dt * (16 + a.d * 1.8);
          dp(sub(a.x, a.d, a.d + a.L), col(0.16));
          live++;
        }
      });

      if (live) requestAnimationFrame(lp);
    }

    requestAnimationFrame(lp);
  }

  function startIntro() {
    const I = document.getElementById('intro');
    if (!I) return;

    fx();
    bd();

    const skip = () => {
      if (I.dataset.x) return;
      I.dataset.x = '1';
      I.style.transition = 'opacity 0.45s ease-out';
      I.style.opacity = '0';
      setTimeout(() => {
        I.style.display = 'none';
      }, 450);
    };

    I.addEventListener('click', skip);
    setTimeout(skip, 5200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIntro);
  } else {
    startIntro();
  }
})();
