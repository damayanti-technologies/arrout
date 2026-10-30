/* ---- js/arrow-path-generator.js ---- */
/**
 * ARROUT - Level lookup.
 * Every campaign level (1-1000) is pre-built, verified solvable and stored in levels-1000.js,
 * ordered from easiest to hardest. This class only decodes the requested level for the engine.
 * (The old fallback generator was removed: it could not detect collisions, so its
 * "guaranteed solvable" claim was false, and no level ever reached it.)
 */
class BendingPuzzleGenerator {
  static generateLevel(levelNum = 1) {
    const num = Math.min(1000, Math.max(1, Math.floor(Number(levelNum)) || 1));
    const raw = window.ARROUT_LEVELS_1000 && window.ARROUT_LEVELS_1000[num - 1];
    if (!raw) throw new Error('Level data not loaded (levels-1000.js)');
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
