/* ---- js/app-links.js ---- */
/**
 * ARROUT - Android App Link & Chrome Intent Handler
 * 
 * Automatically detects when a user is browsing on an Android device outside the native app wrapper.
 * When installed, seamlessly opens the native Arrout app or displays a 1-tap "Open in App" banner.
 */
(function() {
  // Only run if on Android and NOT inside the Android WebView app wrapper
  var isAndroid = /Android/i.test(navigator.userAgent);
  if (!isAndroid || window.AndroidBridge) return;

  var currentPath = window.location.pathname || '/';
  var currentSearch = window.location.search || '';
  var cleanPath = currentPath.startsWith('/') ? currentPath : ('/' + currentPath);

  // Chrome Android Intent URI format
  var intentUrl = 'intent://arrout.damayanticrest.online' + cleanPath + currentSearch + '#Intent;scheme=https;package=com.webarrout.app;end';

  // Inject sleek banner on top of the mobile webpage
  function createOpenInAppBanner() {
    if (document.getElementById('arrout-open-app-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'arrout-open-app-banner';
    banner.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'right: 0',
      'background: #18191C',
      'color: #FFFFFF',
      'padding: 10px 14px',
      'display: flex',
      'align-items: center',
      'justify-content: space-between',
      'box-shadow: 0 4px 16px rgba(0,0,0,0.5)',
      'z-index: 999999',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'border-bottom: 1.5px solid rgba(255,255,255,0.1)'
    ].join(';');

    banner.innerHTML = [
      '<div style="display:flex;align-items:center;gap:10px;overflow:hidden;">',
      '  <div style="width:36px;height:36px;border-radius:10px;background:#FFF;display:flex;align-items:center;justify-content:center;flex-shrink:0;">',
      '    <img src="assets/logo-arrow.png" alt="Arrout" style="width:28px;height:28px;object-fit:contain;">',
      '  </div>',
      '  <div style="overflow:hidden;">',
      '    <div style="font-weight:700;font-size:0.88rem;color:#FFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Arrout: Arrow Out Game</div>',
      '    <div style="font-size:0.72rem;color:#9AA0A6;">Installed on this device</div>',
      '  </div>',
      '</div>',
      '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">',
      '  <a id="btn-banner-open-app" href="' + intentUrl + '" style="background:#2563EB;color:#FFF;padding:7px 14px;border-radius:12px;font-weight:700;font-size:0.78rem;text-decoration:none;display:inline-block;white-space:nowrap;box-shadow:0 2px 6px rgba(37,99,235,0.4);">OPEN IN APP</a>',
      '  <button id="btn-banner-close-app" style="background:transparent;border:none;color:#9AA0A6;font-size:1.1rem;padding:4px 6px;cursor:pointer;" aria-label="Close">✕</button>',
      '</div>'
    ].join('');

    document.body.prepend(banner);

    // Close button
    var closeBtn = document.getElementById('btn-banner-close-app');
    if (closeBtn) {
      closeBtn.onclick = function(e) {
        e.stopPropagation();
        banner.remove();
        try { sessionStorage.setItem('arrout_banner_dismissed', '1'); } catch (err) {}
      };
    }

    // Clicking anywhere on banner opens app
    banner.onclick = function(e) {
      if (e.target && (e.target.id === 'btn-banner-close-app' || e.target.closest('#btn-banner-close-app'))) return;
      window.location.href = intentUrl;
    };
  }

  // Attempt auto-launch on page load if coming from external referrer (like Google Search)
  function tryAutoLaunch() {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem('arrout_banner_dismissed') === '1'; } catch (e) {}
    if (dismissed) return;

    var ref = document.referrer || '';
    var isFromGoogleOrSearch = ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.') || !ref;

    // If navigated from search or external link, automatically trigger intent
    if (isFromGoogleOrSearch) {
      setTimeout(function() {
        var a = document.createElement('a');
        a.href = intentUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { a.remove(); }, 1000);
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      createOpenInAppBanner();
      tryAutoLaunch();
    });
  } else {
    createOpenInAppBanner();
    tryAutoLaunch();
  }
})();
