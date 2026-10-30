/* ---- js/arrow-path-engine.js ---- */
/**
 * ARROUT - Bending Path Arrow Engine
 * Gameplay feel ported from the Arrout prototype:
 *  - Tap any cell of an arrow (not just the thin line) to fly it out
 *  - Arrow glides along its exact bends and ACCELERATES off the board
 *  - Pinch / mouse-wheel zoom (0.6x - 6x) and drag to pan, tap vs drag detection
 *  - Wrong tap: arrow flashes red, board shakes with a red edge glow, buzz + vibration
 *  - Cheer milestones at 25% / 50% / 75% (onMilestone) and confetti on a win
 *  - Hint (limited to 3 per level) and Undo power-ups
 * Works headless (no container) so the level generator can use it for collision checks.
 */

class BendingArrowEngine {
  constructor(options = {}) {
    this.container = options.container;
    this.cols = options.cols || 11;
    this.rows = options.rows || 15;
    this.arrows = new Map();
    this.shapeType = 'diamond';
    this.shapeMask = null;
    this.hearts = 3;
    this.maxHearts = 3;
    this.hints = 3;
    this.isLocked = false;
    this.moveHistory = [];
    this.anims = [];
    this.view = { s: 1, ox: 0, oy: 0 };
    this.dead = false;
    this.raf = 0;
    this.lastFrame = 0;
    this.hintId = null;
    this.guide = false;

    this.onEscape = options.onEscape || (() => {});
    this.onBlocked = options.onBlocked || (() => {});
    this.onHeartsChange = options.onHeartsChange || (() => {});
    this.onHintsChange = options.onHintsChange || (() => {});
    this.onGuideChange = options.onGuideChange || (() => {});
    this.onCountChange = options.onCountChange || (() => {});
    this.onMilestone = options.onMilestone || (() => {});
    this.onFail = options.onFail || (() => {});
    this.onComplete = options.onComplete || (() => {});
  }

  /* ------------------------------------------------------------------ */
  /* Loading                                                            */
  /* ------------------------------------------------------------------ */

  loadPuzzle(puzzleData) {
    this._stopLoop();
    this.anims = [];

    this.cols = puzzleData.cols || 11;
    this.rows = puzzleData.rows || 15;
    this.shapeType = puzzleData.shapeType || puzzleData.shape || 'diamond';
    this.shapeName = puzzleData.shapeName || 'Shape';

    // Mask function: support user generator maskOf or fallback
    if (puzzleData.prims && puzzleData.ar && typeof window.maskOf === 'function') {
      const mk = window.maskOf(puzzleData.prims, puzzleData.ar);
      this.shapeMask = (x, y) => mk(x, y, this.cols, this.rows);
    } else {
      this.shapeMask = puzzleData.shapeMask || null;
    }

    this.arrows.clear();
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(-1));
    this.hearts = 3;
    this.hints = 3;
    this.hintId = null;
    this.guide = !!(window.arroutSettings && window.arroutSettings.guide);   // 'Guide lines at start' option
    this.isLocked = false;
    this.won = false;
    this.moveHistory = [];
    this.view = { s: 1, ox: 0, oy: 0 };
    this.startTime = Date.now();

    puzzleData.arrows.forEach(a => {
      const pts = a.points.map(p => ({ x: p.x, y: p.y }));
      this.arrows.set(a.id, {
        id: a.id,
        points: pts,
        dir: a.dir,
        dirNum: a.dirNum,
        element: null
      });

      pts.forEach(p => {
        if (p.y >= 0 && p.y < this.rows && p.x >= 0 && p.x < this.cols) {
          this.grid[p.y][p.x] = a.id;
        }
      });
    });

    this.total = this.arrows.size;
    this.cleared = 0;
    this.milestonesGiven = 0;

    this.onHeartsChange(this.hearts, this.maxHearts);
    this.onHintsChange(this.hints);
    this.onGuideChange(this.guide);
    this.onCountChange(this.arrows.size);

    if (this.container) {
      this.render(true);
    }
  }

  destroy() {
    clearTimeout(this._introT);
    this.dead = true;
    this.isLocked = true;
    this._stopLoop();
    this.anims = [];
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                          */
  /* ------------------------------------------------------------------ */

  render(intro = false) {
    // Arrows still flying out when we re-render have already escaped logically
    this.cleared += this.anims.length;
    this.anims = [];

    this.container.innerHTML = '';

    const viewW = 400;
    const viewH = 560;
    this.viewW = viewW;
    this.viewH = viewH;
    const padMinX = 22;
    const padMinY = 22;

    const maxSpanX = viewW - padMinX * 2;
    const maxSpanY = viewH - padMinY * 2;

    const cellStep = Math.min(
      maxSpanX / Math.max(1, this.cols - 1),
      maxSpanY / Math.max(1, this.rows - 1)
    );

    this.cellW = cellStep;
    this.cellH = cellStep;
    this.padX = (viewW - cellStep * (this.cols - 1)) / 2;
    this.padY = (viewH - cellStep * (this.rows - 1)) / 2;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'board-svg-canvas');
    svg.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.touchAction = 'none';
    svg.style.userSelect = 'none';
    svg.style.webkitUserSelect = 'none';
    this.svg = svg;

    // Everything that zooms / pans lives inside this group
    const root = document.createElementNS(NS, 'g');
    root.setAttribute('class', 'board-root');
    this.rootG = root;
    svg.appendChild(root);

    // Grid dots
    const dotsGroup = document.createElementNS(NS, 'g');
    dotsGroup.setAttribute('class', 'svg-grid-dots');
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const inShape = !this.shapeMask || this.shapeMask(c, r);
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', this.padX + c * this.cellW);
        circle.setAttribute('cy', this.padY + r * this.cellH);
        circle.setAttribute('r', inShape ? String(Math.max(1.1, Math.min(2.0, this.cellW * 0.1))) : '0.8');
        circle.setAttribute('fill', inShape ? '#CBD5E1' : '#E2E8F0');
        circle.setAttribute('opacity', inShape ? '0.9' : '0.22');
        dotsGroup.appendChild(circle);
      }
    }
    root.appendChild(dotsGroup);

    // Ruler guide: faint lines through every row and column (Arrout's 📏 tool)
    const guideG = document.createElementNS(NS, 'g');
    guideG.setAttribute('class', 'board-guide');
    guideG.setAttribute('stroke', '#6366F1');
    guideG.setAttribute('stroke-opacity', '0.16');
    guideG.setAttribute('stroke-width', (this.cellW * 0.22).toFixed(2));
    guideG.style.pointerEvents = 'none';
    guideG.style.display = this.guide ? '' : 'none';
    const FAR = 3000;
    for (let c = 0; c < this.cols; c++) {
      const x = this.padX + c * this.cellW;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', -FAR); l.setAttribute('y2', FAR);
      guideG.appendChild(l);
    }
    for (let r = 0; r < this.rows; r++) {
      const y = this.padY + r * this.cellH;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('x1', -FAR); l.setAttribute('x2', FAR);
      guideG.appendChild(l);
    }
    this.guideG = guideG;
    root.appendChild(guideG);

    // Dynamic stroke and head size proportional to grid density
    this.strokeWidth = Math.max(2.4, Math.min(5.2, this.cellW * 0.22));
    this.arrowHeadSize = Math.max(5.0, Math.min(10.5, this.cellW * 0.45));

    this.arrows.forEach(arrow => {
      const g = this.createArrowSVGGroup(arrow, this.padX, this.padY, this.cellW, this.cellH);
      arrow.element = g;
      if (intro) {
        // New level: arrows draw themselves in as a sweep from top-left to bottom-right
        const mid = arrow.points[Math.floor(arrow.points.length / 2)];
        const delay = ((mid.x + mid.y) / Math.max(1, this.cols + this.rows)) * 0.9 + Math.random() * 0.2;
        g.classList.add('arrow-in');
        g.style.setProperty('--d', delay.toFixed(2) + 's');
      }
      root.appendChild(g);
    });

    this.container.appendChild(svg);
    if (intro) {
      clearTimeout(this._introT);
      this._introT = setTimeout(() => {
        if (this.rootG) this.rootG.querySelectorAll('.arrow-in').forEach(el => el.classList.remove('arrow-in'));
      }, 1700);
    }
    this._applyView();
    this._bindPointer(svg);
  }

  getPixelPos(gridX, gridY, padX = this.padX, padY = this.padY, stepX = this.cellW, stepY = this.cellH) {
    return {
      x: padX + gridX * stepX,
      y: padY + gridY * stepY
    };
  }

  createArrowSVGGroup(arrow, padX, padY, stepX, stepY) {
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'arrow-group');
    g.setAttribute('data-id', arrow.id);

    let pathD = '';
    arrow.points.forEach((pt, idx) => {
      const px = this.getPixelPos(pt.x, pt.y, padX, padY, stepX, stepY);
      pathD += (idx === 0 ? `M ${px.x} ${px.y}` : ` L ${px.x} ${px.y}`);
    });

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('class', 'arrow-path');
    path.setAttribute('pathLength', '1');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#152642');
    path.setAttribute('stroke-width', (this.strokeWidth || 5).toFixed(1));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    g.appendChild(path);

    const headPt = arrow.points[arrow.points.length - 1];
    const headPx = this.getPixelPos(headPt.x, headPt.y, padX, padY, stepX, stepY);

    const headPolygon = document.createElementNS(NS, 'polygon');
    headPolygon.setAttribute('class', 'arrow-head');
    headPolygon.setAttribute('fill', '#152642');
    const { dx, dy } = this.getDirVector(arrow.dir);
    headPolygon.setAttribute('points', this.computeArrowheadPoints(headPx, { dx, dy }, this.arrowHeadSize || 9));
    g.appendChild(headPolygon);

    return g;
  }

  computeArrowheadPoints(headPx, dirVec, size = 9) {
    const nx = -dirVec.dy;
    const ny = dirVec.dx;

    const tip = {
      x: headPx.x + dirVec.dx * (size * 0.45),
      y: headPx.y + dirVec.dy * (size * 0.45)
    };
    const bc = {
      x: headPx.x - dirVec.dx * (size * 0.55),
      y: headPx.y - dirVec.dy * (size * 0.55)
    };
    const b1 = { x: bc.x + nx * size * 0.65, y: bc.y + ny * size * 0.65 };
    const b2 = { x: bc.x - nx * size * 0.65, y: bc.y - ny * size * 0.65 };

    return `${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${b1.x.toFixed(1)},${b1.y.toFixed(1)} ${b2.x.toFixed(1)},${b2.y.toFixed(1)}`;
  }

  getDirVector(dir) {
    switch (dir) {
      case 'UP': return { dx: 0, dy: -1 };
      case 'DOWN': return { dx: 0, dy: 1 };
      case 'LEFT': return { dx: -1, dy: 0 };
      case 'RIGHT': return { dx: 1, dy: 0 };
      default: return { dx: 0, dy: -1 };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Zoom + pan + tap (pointer events, works for touch and mouse)        */
  /* ------------------------------------------------------------------ */

  _applyView() {
    if (!this.rootG) return;
    const v = this.view;
    this.rootG.setAttribute('transform', `translate(${v.ox.toFixed(2)} ${v.oy.toFixed(2)}) scale(${v.s.toFixed(4)})`);
  }

  // Client (screen) pixels -> SVG viewBox units
  _toSvg(clientX, clientY) {
    const svg = this.svg;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0, k: 1 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y, k: ctm.a || 1 };
  }

  _zoomAt(factor, clientX, clientY) {
    const v = this.view;
    const n = Math.min(6, Math.max(0.6, v.s * factor));
    const f = n / v.s;
    const u = this._toSvg(clientX, clientY);
    v.ox = u.x - (u.x - v.ox) * f;
    v.oy = u.y - (u.y - v.oy) * f;
    v.s = n;
    this._applyView();
  }

  _bindPointer(svg) {
    const ptr = new Map();
    let moved = 0;
    let pinchDist = 0;
    const self = this;

    svg.addEventListener('pointerdown', (e) => {
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
      moved = 0;
      if (ptr.size === 2) {
        const [a, b] = [...ptr.values()];
        pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
    });

    svg.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId)) return;
      const o = ptr.get(e.pointerId);
      if (ptr.size === 1) {
        const dx = e.clientX - o[0];
        const dy = e.clientY - o[1];
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 8) {
          const k = self._toSvg(e.clientX, e.clientY).k || 1;
          self.view.ox += dx / k;
          self.view.oy += dy / k;
          self._applyView();
        }
      } else {
        ptr.set(e.pointerId, [e.clientX, e.clientY]);
        const [a, b] = [...ptr.values()];
        const nd = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinchDist > 0) self._zoomAt(nd / pinchDist, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        pinchDist = nd;
        moved = 99;
      }
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
    });

    svg.addEventListener('pointerup', (e) => {
      if (ptr.size === 1 && moved <= 8) self._tapAt(e.clientX, e.clientY);
      ptr.delete(e.pointerId);
    });
    svg.addEventListener('pointercancel', (e) => ptr.delete(e.pointerId));

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      self._zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX, e.clientY);
    }, { passive: false });
  }

  // Tap a cell: any cell of an arrow counts (not just the thin line)
  _tapAt(clientX, clientY) {
    if (this.isLocked || this.dead) return;
    const u = this._toSvg(clientX, clientY);
    const v = this.view;
    const bx = (u.x - v.ox) / v.s;
    const by = (u.y - v.oy) / v.s;
    const fx = (bx - this.padX) / this.cellW;
    const fy = (by - this.padY) / this.cellH;
    const gx = Math.round(fx);
    const gy = Math.round(fy);
    let id = (gx >= 0 && gy >= 0 && gx < this.cols && gy < this.rows) ? this.grid[gy][gx] : -1;
    if (id < 0) {
      // Forgiving taps on dense boards: pick the nearest arrow cell within ~0.8 of a cell
      let best = 0.8 * 0.8;
      for (let yy = Math.floor(fy); yy <= Math.ceil(fy); yy++) {
        for (let xx = Math.floor(fx); xx <= Math.ceil(fx); xx++) {
          if (xx < 0 || yy < 0 || xx >= this.cols || yy >= this.rows) continue;
          const a = this.grid[yy][xx];
          if (a < 0) continue;
          const d = (xx - fx) * (xx - fx) + (yy - fy) * (yy - fy);
          if (d < best) { best = d; id = a; }
        }
      }
    }
    if (id < 0) return;
    this.handleArrowTap(id);
  }

  /* ------------------------------------------------------------------ */
  /* Game rules                                                         */
  /* ------------------------------------------------------------------ */

  checkArrowCollision(arrowId) {
    const arrow = this.arrows.get(arrowId);
    if (!arrow) return { blocked: true };

    const head = arrow.points[arrow.points.length - 1];
    const { dx, dy } = this.getDirVector(arrow.dir);

    let x = head.x + dx;
    let y = head.y + dy;
    while (x >= 0 && y >= 0 && x < this.cols && y < this.rows) {
      if (this.grid && this.grid[y] && this.grid[y][x] >= 0 && this.grid[y][x] !== arrowId) {
        return { blocked: true, blockerId: this.grid[y][x] };
      }
      x += dx;
      y += dy;
    }

    return { blocked: false };
  }

  handleArrowTap(arrowId) {
    if (this.isLocked || this.dead) return;
    const arrow = this.arrows.get(arrowId);
    if (!arrow) return;

    const collision = this.checkArrowCollision(arrowId);
    if (collision.blocked) {
      this.executeBlocked(arrow);
    } else {
      this.executeEscape(arrow);
    }
  }

  executeBlocked(arrow) {
    const snd = window.soundEngine;
    if (snd) { snd.playBlocked(); snd.vibrate([60, 40, 60]); }

    if (this.hearts > 0) {
      this.hearts--;
      this.onHeartsChange(this.hearts, this.maxHearts);
    }

    // Arrow flashes red for half a second
    if (arrow.element) {
      const el = arrow.element;
      el.classList.remove('blocked');
      void el.getBoundingClientRect();
      el.classList.add('blocked');
      setTimeout(() => el.classList.remove('blocked'), 500);
    }

    // Whole board shakes with a red edge glow
    const card = this.container && this.container.closest ? this.container.closest('.puzzle-board-card') : null;
    if (card) {
      card.classList.remove('bad');
      void card.offsetWidth;
      card.classList.add('bad');
    }

    this.onBlocked(arrow);

    if (this.hearts <= 0) {
      this.isLocked = true;
      setTimeout(() => { if (!this.dead) this.onFail(); }, 500);
    }
  }

  executeEscape(arrow) {
    const snd = window.soundEngine;
    if (snd) { snd.playEscape(); snd.vibrate(12); }

    this.arrows.delete(arrow.id);
    this.moveHistory.push(arrow);

    // Free the cells immediately so the next tap can escape right behind it
    if (this.grid) {
      arrow.points.forEach(p => {
        if (this.grid[p.y] && this.grid[p.y][p.x] === arrow.id) {
          this.grid[p.y][p.x] = -1;
        }
      });
    }

    if (this.hintId === arrow.id) this.hintId = null;
    this.setGuide(false);
    this.onCountChange(this.arrows.size);
    this.onEscape(arrow, this.arrows.size);

    if (arrow.element && this.container) {
      arrow.element.classList.remove('hint-pulse', 'blocked', 'arrow-in');
      arrow.element.classList.add('moving');
      this._startAnim(arrow);
    } else {
      this._finishEscape(arrow);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Escape animation (accelerating glide along the exact bends)        */
  /* ------------------------------------------------------------------ */

  _startAnim(arrow) {
    const pts = arrow.points.map(p => [p.x, p.y]);
    const len = pts.length;
    const head = pts[len - 1];
    const { dx, dy } = this.getDirVector(arrow.dir);
    const n = Math.max(this.cols, this.rows) + len + 2;
    for (let i = 1; i <= n; i++) pts.push([head[0] + dx * i, head[1] + dy * i]);

    // cumulative length in cell units
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const bodyLen = cum[len - 1];

    this.anims.push({
      arrow,
      pts,
      cum,
      bodyLen,
      d: 0,
      done: Math.max(this.cols, this.rows) + len + 1,
      pathEl: arrow.element.querySelector('.arrow-path'),
      headEl: arrow.element.querySelector('.arrow-head')
    });

    this._startLoop();
  }

  _startLoop() {
    if (this.raf || this.dead) return;
    this.lastFrame = performance.now();
    const step = (now) => {
      this.raf = 0;
      if (this.dead) return;
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      this._tick(dt);
      if (this.anims.length && !this.dead) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  _stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  _tick(dt) {
    dt *= (window.arroutSettings && window.arroutSettings.speedMul) || 1;   // Arrow speed option
    for (const an of this.anims.slice()) {
      an.d += dt * (16 + an.d * 1.8);   // speeds up the further it goes
      if (an.d > an.done) {
        this.anims = this.anims.filter(x => x !== an);
        if (an.arrow.element && an.arrow.element.parentNode) an.arrow.element.parentNode.removeChild(an.arrow.element);
        this._finishEscape(an.arrow);
        continue;
      }
      this._drawAnim(an);
    }
  }

  // Visible slice of the extended path: [d, d + bodyLen]
  _drawAnim(an) {
    const { pts, cum, bodyLen } = an;
    const s = an.d;
    const e = an.d + bodyLen;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      if (e <= cum[i] || s >= cum[i + 1]) continue;
      const segLen = cum[i + 1] - cum[i] || 1;
      const t0 = (Math.max(s, cum[i]) - cum[i]) / segLen;
      const t1 = (Math.min(e, cum[i + 1]) - cum[i]) / segLen;
      const a = pts[i];
      const b = pts[i + 1];
      if (!out.length) out.push([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]);
      out.push([a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]);
    }
    if (out.length < 2) return;

    let d = '';
    const px = out.map(p => this.getPixelPos(p[0], p[1]));
    px.forEach((p, i) => { d += (i === 0 ? `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}` : ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`); });
    an.pathEl.setAttribute('d', d);

    const last = px[px.length - 1];
    const prev = px[px.length - 2];
    const L = Math.hypot(last.x - prev.x, last.y - prev.y) || 1;
    an.headEl.setAttribute('points', this.computeArrowheadPoints(last, { dx: (last.x - prev.x) / L, dy: (last.y - prev.y) / L }, this.arrowHeadSize || 9));
  }

  // Called once an arrow has fully left the board
  _finishEscape(arrow) {
    if (this.dead) return;
    this.cleared++;

    const T = [25, 50, 75];
    const pct = (this.cleared / Math.max(1, this.total)) * 100;
    while (this.milestonesGiven < 3 && pct >= T[this.milestonesGiven] && this.arrows.size > 0) {
      const m = T[this.milestonesGiven];
      this.milestonesGiven++;
      if (!window.arroutSettings || window.arroutSettings.cheer !== false) {
        if (window.soundEngine) { window.soundEngine.playMilestone(); window.soundEngine.vibrate(30); }
        this.onMilestone(m);
      }
    }
    // skip the cheer if the level just ended
    if (this.arrows.size === 0) this.milestonesGiven = 3;

    if (this.arrows.size === 0 && this.anims.length === 0 && !this.won) {
      this.won = true;
      this.isLocked = true;
      const elapsed = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
      if (window.soundEngine) {
        window.soundEngine.playVictory();
        window.soundEngine.vibrate([80, 50, 80, 50, 160]);
      }
      BendingArrowEngine.confetti();
      setTimeout(() => {
        if (!this.dead) this.onComplete({ totalTime: elapsed, moves: this.moveHistory.length });
      }, 900);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Power-ups                                                          */
  /* ------------------------------------------------------------------ */

  useHint() {
    if (this.hints <= 0 || this.isLocked) return false;
    for (const [id, arrow] of this.arrows.entries()) {
      if (!this.checkArrowCollision(id).blocked) {
        if (arrow.element) {
          arrow.element.classList.remove('hint-pulse');
          void arrow.element.getBoundingClientRect();
          arrow.element.classList.add('hint-pulse');
          this.hintId = id;
          this.hints--;
          this.onHintsChange(this.hints);
          if (window.soundEngine) window.soundEngine.playPowerup();
          return true;
        }
      }
    }
    return false;
  }

  setGuide(on) {
    if (this.guide === on) return;
    this.guide = on;
    if (this.guideG) this.guideG.style.display = on ? '' : 'none';
    this.onGuideChange(on);
  }

  toggleGuide() {
    if (this.isLocked) return false;
    this.setGuide(!this.guide);
    return this.guide;
  }

  /* ------------------------------------------------------------------ */
  /* Win confetti (90 pieces, same as the Arrout prototype)             */
  /* ------------------------------------------------------------------ */

  static confetti() {
    if (typeof document === 'undefined') return;
    if (window.arroutSettings && window.arroutSettings.confetti === false) return;
    const wrap = document.getElementById('confetti-canvas-wrapper');
    if (!wrap) return;
    const c = document.createElement('canvas');
    const W = c.width = wrap.clientWidth;
    const H = c.height = wrap.clientHeight;
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    wrap.appendChild(c);
    const x = c.getContext('2d');
    const CL = ['#2f80ed', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
    const P = Array.from({ length: 90 }, () => ({
      x: W / 2, y: H * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 3,
      r: 3 + Math.random() * 4,
      c: CL[(Math.random() * 5) | 0],
      a: Math.random() * 6
    }));
    let f = 0;
    (function loop() {
      x.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.2;
        x.fillStyle = p.c;
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.a);
        x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        x.restore();
      });
      if (++f < 130) requestAnimationFrame(loop);
      else if (c.parentNode) c.parentNode.removeChild(c);
    })();
  }
}

window.BendingArrowEngine = BendingArrowEngine;
