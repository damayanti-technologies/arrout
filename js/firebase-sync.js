/* ---- js/firebase-sync.js ---- */
/**
 * ARROUT - Dual-Layer Local & Google Cloud Storage with Firebase
 * 
 * Capabilities:
 * - Always stores in localStorage first (100% offline resilient).
 * - Optional Google Sign-In via Firebase Auth.
 * - Bidirectional high-water-mark merge upon Google sign-in (never overwrites or loses progress).
 * - Automatic debounced cloud backup to Cloud Firestore (/users/{uid}) on every local progress change.
 * - Profile avatar, name, and status updates across the entire app.
 */

(function () {
  const SYNC_DEBOUNCE_MS = 1500;
  let syncTimer = null;
  let authUser = null;
  let isSyncing = false;
  let isInitialized = false;

  const FirebaseSync = {
    user: null,
    db: null,
    auth: null,
    isConfigured: false,

    init() {
      const cfg = window.FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey || cfg.apiKey.includes('YOUR_API_KEY') || !cfg.projectId || cfg.projectId.includes('YOUR_PROJECT_ID')) {
        this.isConfigured = false;
        console.log('[FirebaseSync] Firebase config not set or using placeholders. Game is running in 100% LocalStorage mode.');
        this.updateAuthUI(null);
        return;
      }

      if (typeof firebase === 'undefined') {
        console.warn('[FirebaseSync] Firebase SDK script not found. Running in LocalStorage mode.');
        this.updateAuthUI(null);
        return;
      }

      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.isConfigured = true;
        isInitialized = true;

        // Try offline persistence for Firestore
        try {
          this.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch (e) {}

        // Listen for authentication changes
        this.auth.onAuthStateChanged(user => {
          this.handleAuthStateChange(user);
        });

        console.log('[FirebaseSync] Firebase initialized successfully.');
      } catch (err) {
        console.error('[FirebaseSync] Initialization failed:', err);
        this.isConfigured = false;
        this.updateAuthUI(null);
      }
    },

    async handleAuthStateChange(user) {
      this.user = user;
      authUser = user;

      if (user) {
        console.log('[FirebaseSync] User signed in:', user.displayName || user.email || user.uid);
        this.updateAuthUI(user);
        await this.syncOnLogin(user);
      } else {
        console.log('[FirebaseSync] User signed out. Operating in LocalStorage mode.');
        this.updateAuthUI(null);
      }
    },

    async signInWithGoogle() {
      if (!this.isConfigured) {
        this.showConfigPrompt();
        return;
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        if (window.showToast) window.showToast('Signing in with Google...');
        await this.auth.signInWithPopup(provider);
      } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
          try {
            await this.auth.signInWithRedirect(provider);
          } catch (rErr) {
            console.error('Redirect sign in error:', rErr);
            if (window.showToast) window.showToast('Sign in failed: ' + (rErr.message || rErr.code));
          }
        } else if (err.code !== 'auth/popup-closed-by-user') {
          console.error('Sign-in error:', err);
          if (window.showToast) window.showToast('Google Sign-in failed: ' + (err.message || err.code));
        }
      }
    },

    async signOut() {
      if (!this.auth) return;
      try {
        await this.auth.signOut();
        if (window.showToast) window.showToast('Signed out from Google Cloud');
      } catch (err) {
        console.error('Sign out error:', err);
      }
    },

    /**
     * Bidirectional smart merge when logging in:
     * Never loses progress. Combines local and cloud progress taking the best records.
     */
    async syncOnLogin(user) {
      if (!this.db || !user) return;
      isSyncing = true;
      this.setSyncStatus('Syncing with Google Cloud...');

      try {
        const userRef = this.db.collection('users').doc(user.uid);
        const docSnap = await userRef.get();
        const local = (window.storageManager && window.storageManager.data) ? window.storageManager.data : {};

        let themesState = { owned: ['classic'], active: 'classic' };
        try {
          const tRaw = localStorage.getItem('arrout_themes_v1');
          if (tRaw) themesState = JSON.parse(tRaw);
        } catch (e) {}

        if (docSnap.exists) {
          const cloud = docSnap.data();
          console.log('[FirebaseSync] Cloud data found. Merging local and cloud data...');

          // 1. Coins: keep whichever is higher
          local.coins = Math.max(Number(local.coins) || 0, Number(cloud.coins) || 0);

          // 2. Rating: keep max
          local.rating = Math.max(Number(local.rating) || 1200, Number(cloud.rating) || 1200);

          // 3. Username: keep Google name if local is generic or empty
          if (user.displayName && (!local.username || local.username.startsWith('ArrowPilot_'))) {
            local.username = user.displayName;
          }

          // 4. Completed Levels: Union of all levels cleared, keeping best time
          const localLevels = local.completedLevels || {};
          const cloudLevels = cloud.completedLevels || {};
          const mergedLevels = { ...cloudLevels };

          for (const [lvlKey, localVal] of Object.entries(localLevels)) {
            if (!mergedLevels[lvlKey]) {
              mergedLevels[lvlKey] = localVal;
            } else {
              const cloudVal = mergedLevels[lvlKey];
              mergedLevels[lvlKey] = {
                clearedAt: Math.max(cloudVal.clearedAt || 0, localVal.clearedAt || 0),
                difficulty: localVal.difficulty || cloudVal.difficulty,
                bestTime: (cloudVal.bestTime && localVal.bestTime) 
                  ? Math.min(cloudVal.bestTime, localVal.bestTime) 
                  : (localVal.bestTime || cloudVal.bestTime)
              };
            }
          }
          local.completedLevels = mergedLevels;

          // 5. Stats: Union and best totals
          local.stats = local.stats || {};
          const cloudStats = cloud.stats || {};
          local.stats.levelsCompleted = Object.keys(mergedLevels).length;
          local.stats.matchesPlayed = Math.max(local.stats.matchesPlayed || 0, cloudStats.matchesPlayed || 0);
          local.stats.matchesWon = Math.max(local.stats.matchesWon || 0, cloudStats.matchesWon || 0);
          local.stats.matchesLost = Math.max(local.stats.matchesLost || 0, cloudStats.matchesLost || 0);
          local.stats.streakDays = Math.max(local.stats.streakDays || 0, cloudStats.streakDays || 0);
          if (cloudStats.fastestTime) {
            local.stats.fastestTime = local.stats.fastestTime 
              ? Math.min(local.stats.fastestTime, cloudStats.fastestTime) 
              : cloudStats.fastestTime;
          }

          // 6. Achievements: Unlock if unlocked either locally or on cloud
          const cloudAchMap = new Map((cloud.achievements || []).map(a => [a.id, a]));
          (local.achievements || []).forEach(a => {
            const ca = cloudAchMap.get(a.id);
            if (ca && ca.unlocked) a.unlocked = true;
          });

          // 7. Themes: Union of owned themes
          const cloudThemes = cloud.themes || { owned: ['classic'], active: 'classic' };
          const mergedOwnedThemes = Array.from(new Set([
            ...(themesState.owned || ['classic']),
            ...(cloudThemes.owned || ['classic'])
          ]));
          themesState.owned = mergedOwnedThemes;
          themesState.active = themesState.active || cloudThemes.active || 'classic';
          try {
            localStorage.setItem('arrout_themes_v1', JSON.stringify(themesState));
            if (window.ArroutThemes && window.ArroutThemes.state) {
              window.ArroutThemes.state.owned = mergedOwnedThemes;
            }
          } catch (e) {}

          // Save merged data locally
          if (window.storageManager) {
            window.storageManager.data = local;
            window.storageManager.save();
          }

          // Update HUD and views
          if (window.app) {
            window.app.updateHUD();
            if (window.app.renderProfile) window.app.renderProfile();
            if (window.app.renderLevelGrid) window.app.renderLevelGrid();
          }

          // Write back merged document to Firestore to bring cloud fully up to date
          await this.saveToCloudNow();
          if (window.showToast) window.showToast('Google Cloud progress synced successfully!');
        } else {
          console.log('[FirebaseSync] No cloud document yet. Uploading local data to Google Cloud...');
          await this.saveToCloudNow();
          if (window.showToast) window.showToast('Progress backed up to Google Cloud!');
        }
      } catch (err) {
        console.error('[FirebaseSync] Sync error during login:', err);
      } finally {
        isSyncing = false;
        this.setSyncStatus('🟢 Cloud Backup Active');
      }
    },

    /**
     * Debounced save to Firestore triggered whenever storageManager.save() runs
     */
    scheduleCloudSync() {
      if (!this.db || !this.user) return;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        this.saveToCloudNow();
      }, SYNC_DEBOUNCE_MS);
    },

    async saveToCloudNow() {
      if (!this.db || !this.user) return;

      try {
        const local = (window.storageManager && window.storageManager.data) ? window.storageManager.data : {};
        let themesState = { owned: ['classic'], active: 'classic' };
        try {
          const tRaw = localStorage.getItem('arrout_themes_v1');
          if (tRaw) themesState = JSON.parse(tRaw);
        } catch (e) {}

        const profileData = {
          displayName: String(this.user.displayName || local.username || 'ArrowPilot').slice(0, 100),
          username: String(local.username || 'ArrowPilot').slice(0, 50),
          playerId: String(local.playerId || 'AE-000000').slice(0, 50),
          rating: Number(local.rating) || 1200
        };
        if (this.user.email) profileData.email = String(this.user.email).slice(0, 200);
        if (this.user.photoURL) profileData.photoURL = String(this.user.photoURL).slice(0, 500);

        const payload = {
          userId: this.user.uid,
          coins: Math.max(0, Number(local.coins) || 0),
          rating: Number(local.rating) || 1200,
          username: String(this.user.displayName || local.username || 'ArrowPilot').slice(0, 50),
          playerId: String(local.playerId || 'AE-000000').slice(0, 50),
          profile: profileData,
          stats: {
            levelsCompleted: Number((local.stats && local.stats.levelsCompleted) || Object.keys(local.completedLevels || {}).length) || 0,
            matchesPlayed: Number((local.stats && local.stats.matchesPlayed) || 0),
            matchesWon: Number((local.stats && local.stats.matchesWon) || 0),
            matchesLost: Number((local.stats && local.stats.matchesLost) || 0),
            streakDays: Number((local.stats && local.stats.streakDays) || 0),
            fastestTime: Number((local.stats && local.stats.fastestTime) || 0),
            totalPuzzlesSolved: Number((local.stats && local.stats.levelsCompleted) || Object.keys(local.completedLevels || {}).length) || 0
          },
          completedLevels: local.completedLevels || {},
          achievements: (local.achievements || []).map(a => ({ id: a.id, unlocked: !!a.unlocked })),
          themes: themesState,
          settings: local.settings || {},
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.db.collection('users').doc(this.user.uid).set(payload, { merge: true });
        this.setSyncStatus('🟢 Cloud Backup Active');
      } catch (err) {
        console.warn('[FirebaseSync] Cloud sync write failed (will retry):', err);
        this.setSyncStatus('⚠️ Cloud Sync Pending (Offline)');
      }
    },

    setSyncStatus(msg) {
      const el = document.getElementById('google-sync-status');
      if (el) el.textContent = msg;
    },

    updateAuthUI(user) {
      // 1. Large avatar and thumbnail avatar
      const largeAvatar = document.getElementById('profile-avatar-large');
      const thumbnails = document.querySelectorAll('.user-avatar-display');

      if (user && user.photoURL) {
        if (largeAvatar) {
          largeAvatar.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #6366F1;">`;
        }
        thumbnails.forEach(el => {
          el.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        });
      } else {
        if (largeAvatar) {
          largeAvatar.innerHTML = '🎯';
        }
        thumbnails.forEach(el => {
          el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#334155"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" /></svg>`;
        });
      }

      // 2. Auth Card inside Profile screen
      const authBox = document.getElementById('profile-google-auth-box');
      if (authBox) {
        if (user) {
          authBox.innerHTML = `
            <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #C7D2FE; border-radius: 20px; padding: 14px 16px; margin-bottom: 16px; text-align: left;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.2rem;">☁️</span>
                  <b style="color: #3730A3; font-size: 0.95rem;">Google Cloud Save</b>
                </div>
                <span id="google-sync-status" style="font-size: 0.72rem; font-weight: 700; color: #16A34A; background: #DCFCE7; padding: 2px 8px; border-radius: 8px;">🟢 Cloud Backup Active</span>
              </div>
              <div style="font-size: 0.8rem; color: #4338CA; margin-bottom: 10px;">
                Connected: <b>${user.displayName || 'Google Pilot'}</b> (${user.email || 'Google Account'})
              </div>
              <div style="display: flex; gap: 8px;">
                <button id="btn-google-sync-now" style="flex: 1; background: #4F46E5; color: #FFF; border: none; padding: 8px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                  🔄 Sync Now
                </button>
                <button id="btn-google-signout" style="background: #FFF; color: #DC2626; border: 1px solid #FECACA; padding: 8px 14px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                  Sign Out
                </button>
              </div>
            </div>
          `;
          const syncBtn = document.getElementById('btn-google-sync-now');
          if (syncBtn) syncBtn.onclick = () => this.syncOnLogin(user);
          const outBtn = document.getElementById('btn-google-signout');
          if (outBtn) outBtn.onclick = () => this.signOut();
        } else {
          authBox.innerHTML = `
            <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 20px; padding: 16px; margin-bottom: 16px; text-align: center;">
              <div style="font-size: 1.4rem; margin-bottom: 4px;">☁️</div>
              <b style="color: var(--text-navy); font-size: 0.95rem; display: block; margin-bottom: 4px;">Google Cloud Save & Sync</b>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
                Sign in with Google to back up your progress, coins, and themes across all your devices.
              </p>
              <button id="btn-google-signin" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #FFF; color: #1E293B; border: 1.5px solid #CBD5E1; box-shadow: 0 2px 6px rgba(0,0,0,0.06); padding: 10px 18px; border-radius: 14px; font-weight: 800; font-size: 0.88rem; cursor: pointer; width: 100%; transition: transform 0.1s;">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Sign in with Google
              </button>
            </div>
          `;
          const inBtn = document.getElementById('btn-google-signin');
          if (inBtn) inBtn.onclick = () => this.signInWithGoogle();
        }
      }
    },

    showConfigPrompt() {
      const existing = localStorage.getItem('arrout_custom_firebase_config') || '';
      const input = prompt(
        "Firebase Setup:\n\nPaste your Firebase Web App Config JSON from the Firebase Console (or update js/firebase-config.js):\n\nExample:\n{\n  \"apiKey\": \"AIzaSy...\",\n  \"authDomain\": \"...\",\n  \"projectId\": \"...\",\n  \"storageBucket\": \"...\",\n  \"messagingSenderId\": \"...\",\n  \"appId\": \"...\"\n}",
        existing || '{\n  "apiKey": "",\n  "authDomain": "",\n  "projectId": "",\n  "storageBucket": "",\n  "messagingSenderId": "",\n  "appId": ""\n}'
      );

      if (input && input.trim()) {
        try {
          const parsed = JSON.parse(input.trim());
          if (!parsed.apiKey || !parsed.projectId) throw new Error('Missing apiKey or projectId');
          localStorage.setItem('arrout_custom_firebase_config', JSON.stringify(parsed));
          window.FIREBASE_CONFIG = parsed;
          alert('Firebase configuration saved! Reloading to initialize Google Auth...');
          location.reload();
        } catch (e) {
          alert('Invalid JSON configuration: ' + e.message);
        }
      }
    }
  };

  // Automatically hook into StorageManager.save so any game progression backs up to Cloud
  function hookStorageManager() {
    if (!window.StorageManager) return;
    const origSave = window.StorageManager.prototype.save;
    window.StorageManager.prototype.save = function () {
      const res = origSave.apply(this, arguments);
      FirebaseSync.scheduleCloudSync();
      return res;
    };
  }

  // Hook app.renderProfile to always refresh auth UI when profile screen is opened
  function hookApp() {
    if (window.app && window.app.renderProfile) {
      const origRenderProfile = window.app.renderProfile.bind(window.app);
      window.app.renderProfile = function () {
        origRenderProfile();
        FirebaseSync.updateAuthUI(FirebaseSync.user);
      };
    }
  }

  // Initialize
  function boot() {
    hookStorageManager();
    hookApp();
    FirebaseSync.init();
    window.FirebaseSync = FirebaseSync;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
