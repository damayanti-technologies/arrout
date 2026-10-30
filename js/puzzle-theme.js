/* Gameplay screen: plain themed background, theme art only in the corners */
(function () {
  var BG = {
    forest: ['#F7EDCB', '#E9D6A2', '#112A1B', '#0A1A10'], china: ['#FFF3DC', '#FFE0B2', '#2A0D0D', '#3A1414'],
    ocean: ['#E6F7FF', '#BFE6FA', '#06233A', '#0A3556'], candy: ['#FFF3FA', '#FFD9EC', '#34132B', '#4A1B3D'], space: ['#0A0522', '#1B0F48', '#0A0522', '#1B0F48']
  };
  var css = '', M = 'radial-gradient(circle at 0 0,#000 80px,transparent 150px),radial-gradient(circle at 100% 0,#000 80px,transparent 150px),radial-gradient(circle at 0 100%,#000 80px,transparent 150px),radial-gradient(circle at 100% 100%,#000 80px,transparent 150px)';
  css += 'html[data-screen="puzzle"] #theme-art-bg svg{display:none!important}html[data-screen="puzzle"] #theme-art-fg{-webkit-mask-image:' + M + ';mask-image:' + M + '}';
  Object.keys(BG).forEach(function (t) {
    var c = BG[t];
    css += 'html[data-screen="puzzle"][data-theme="' + t + '"] #theme-art-bg{background:linear-gradient(180deg,' + c[0] + ',' + c[1] + ')}';
    css += 'html[data-screen="puzzle"][data-theme="' + t + '"][data-dark="1"] #theme-art-bg{background:linear-gradient(180deg,' + c[2] + ',' + c[3] + ')}';
  });
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function sync() { var p = document.getElementById('screen-puzzle'); var on = p && p.classList.contains('active'); if (on) document.documentElement.setAttribute('data-screen', 'puzzle'); else document.documentElement.removeAttribute('data-screen'); }
  function boot() { var p = document.getElementById('screen-puzzle'); if (!p) return; new MutationObserver(sync).observe(p, { attributes: true, attributeFilter: ['class'] }); sync(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 250); }); else setTimeout(boot, 250);
})();
