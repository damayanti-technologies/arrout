# Arrout / Arrow Escape: what changed in v2.1.0

## Bugs fixed
- Router ran twice on every navigation (popstate + hashchange). Now `hashchange` only.
- Coin counter showed 2450 at 0 coins.
- Cleared levels/stars never showed (read `clearedLevels`, data is `completedLevels`).
- Profile showed fake stats/achievements; now real data from storage.
- Weekly Tournament was fake; now a real offline weekly puzzle (Levels 801-1000, picked from the ISO week), unlocked after 10 different levels, best time kept on device.
- Achievements that could never unlock now work (battle wins call `recordBattle`; themes unlock Stylist / Theme Collector).
- "Reset Local Progress" now clears everything (`StorageManager.resetAll`, incl. themes, daily streak, battle cap).
- Google Fonts URL for Lilita One / Cinzel / Fredoka One / Orbitron was malformed; fonts are now linked in `index.html`.
- Back button no longer replays old levels (moving on from a level replaces the history entry).
- Week id uses UTC everywhere and is zero-padded.

## Design fixes
- Battle is labelled as a computer opponent; max 5 paid (coin) battles per day. Rooms show an "offline mode" note when only same-browser tabs can connect.
- Levels re-ordered easiest to hardest (1 = 15 arrows, 1000 = 70 arrows) with shapes mixed; difficulty labels follow the ramp. NOTE: level numbers changed, so old saved "cleared" numbers now point at different levels.
- Levels unlock in order; typed URLs can no longer jump to locked levels, daily/room/battle puzzles, or random levels > 1000.
- Forgiving taps on dense boards (nearest arrow within 0.8 cell).
- Daily bonus is ignored if the device clock is set earlier than the last daily clear.
- Privacy policy and delete-account page rewritten to match what the game really does (local storage only, Google Fonts, no ads/analytics). If your Android build adds ads, sign-in or cloud save, update them first.

## Structure
- The 5.5 MB single `index.html` is split into `css/`, `js/`, `levels-*.js` (deferred) and `assets/`.
- Removed dead code: old 5x5 engine, old generator (collision check was broken), MultiplayerEngine, old shop catalogue, unused storage functions, engine.undo(), fake leaderboard screen.
- Arrow-head animation no longer rebuilds SVG every frame.
- Added lang, utf-8 charset, theme-color, favicon, aria-labels; fixed duplicate SVG ids.

## Not changed (needs a decision from you)
- Real online battles, rooms across devices and global leaderboards need a backend (e.g. Firebase). Coins stay editable on the device until then.
- `js/modes.js`, `coins.js`, `rooms.js`, `themes.js` still wrap `app` methods after startup; merging them into `ArroutApp` is a bigger refactor.
- `js/levels.js` still contains the old level generator (only its shape-mask helper is used).
