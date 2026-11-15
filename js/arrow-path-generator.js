/* ---- js/arrow-path-generator.js ---- */
/**
 * ARROUT - Level lookup.
 * Every campaign level is pre-built, verified solvable and stored in levels data (levels-5000.js),
 * ordered from easiest to hardest. This class only decodes the requested level for the engine.
 */
class BendingPuzzleGenerator {
  static maxLevel() {
    return (window.ARROUT_LEVEL_COUNT || (window.ARROUT_LEVELS && window.ARROUT_LEVELS.length) || (window.ARROUT_LEVELS_1000 && window.ARROUT_LEVELS_1000.length) || 5000);
  }

  static generateLevel(levelNum = 1) {
    const max = this.maxLevel();
    const num = Math.min(max, Math.max(1, Math.floor(Number(levelNum)) || 1));
    const all = window.ARROUT_LEVELS || window.ARROUT_LEVELS_1000;
    const raw = all && all[num - 1];
    if (!raw) throw new Error('Level data not loaded for level ' + num);
    const lvl = window.arroutDecodeLevel(raw);
    return {
      level: lvl.level,
      difficulty: lvl.difficulty,
      shapeType: lvl.shape,
      shapeName: lvl.shapeName,
      icon: lvl.icon,
      cols: lvl.cols,
      rows: lvl.rows,
      arrowCount: lvl.arrowCount,
      occupiedCellCount: lvl.occupiedCellCount,
      prims: lvl.prims,
      ar: lvl.ar,
      arrows: lvl.arrows.map(a => ({
        id: a.id,
        points: a.points.map(p => ({ x: p.x, y: p.y })),
        dir: a.dir,
        dirNum: a.dirNum,
        length: a.length
      }))
    };
  }
}

window.BendingPuzzleGenerator = BendingPuzzleGenerator;
