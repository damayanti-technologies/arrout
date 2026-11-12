/* ---- js/promo.js ---- */
/**
 * ARROUT - App-Open Promotional Modal for Sannivesham
 * Shows high-quality promotional poster on app open.
 * Closes on 'X' tap.
 * Tapping anywhere on the image opens Google Play Store link:
 * https://play.google.com/store/apps/details?id=com.sannivesham.app
 */
(function() {
  const PROMO_URL = 'https://play.google.com/store/apps/details?id=com.sannivesham.app';

  function openPromoLink() {
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.openUrl === 'function') {
        window.AndroidBridge.openUrl(PROMO_URL);
      } else {
        window.open(PROMO_URL, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      window.location.href = PROMO_URL;
    }
  }

  let promoShown = false;

  function showPromo() {
    if (promoShown) return;
    promoShown = true;
    const modal = document.getElementById('modal-app-promo');
    if (!modal) return;
    modal.classList.add('open');
  }

  function closePromo(e) {
    promoShown = true;
    if (e) e.stopPropagation();
    const modal = document.getElementById('modal-app-promo');
    if (!modal) return;
    modal.classList.remove('open');
  }

  function initPromo() {
    const modal = document.getElementById('modal-app-promo');
    if (!modal) return;

    const closeBtn = document.getElementById('btn-close-app-promo');
    if (closeBtn) {
      closeBtn.onclick = (e) => closePromo(e);
    }

    const clickArea = document.getElementById('promo-image-container');
    if (clickArea) {
      clickArea.onclick = () => openPromoLink();
    }

    // Backdrop click outside card can also close
    modal.onclick = (e) => {
      if (e.target === modal) {
        closePromo(e);
      }
    };

    // Show after intro has finished fading out
    let tries = 0;
    const checkIntro = setInterval(() => {
      const intro = document.getElementById('intro');
      tries++;
      if (!intro || intro.style.display === 'none' || tries > 40) {
        clearInterval(checkIntro);
        setTimeout(showPromo, 300);
      }
    }, 200);
  }

  window.openPromoLink = openPromoLink;
  window.showPromo = showPromo;
  window.closePromo = closePromo;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPromo);
  } else {
    initPromo();
  }
})();
