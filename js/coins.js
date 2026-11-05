/* =====================================================================
   COINS MODULE REMOVED
   ===================================================================== */
(function () {
  window.ArroutCoins = {
    FEE: 0,
    canStake: function () { return true; },
    stake: function (name, cb) { if (cb) cb(); },
    settle: function (outcome, name, cb) { if (cb) cb(); },
    fly: function () { return Promise.resolve(); },
    paint: function () {}
  };
})();
