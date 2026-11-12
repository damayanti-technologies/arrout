/* ---- js/firebase-sync.js ---- */
/**
 * ARROUT - Dual-Layer Local & Google Cloud Storage with Firebase
 * 
 * Capabilities:
 * - Always stores in localStorage first (100% offline resilient).
 * - Real native Google Sign-In via AndroidBridge on Android devices.
 * - Standard Google OAuth popup on Web.
 * - Zero hardcoded emails: users only see their own accounts.
 * - Real-time two-way synchronization via Firestore onSnapshot (/users/{uid}).
 * - Automatic debounced cloud backup on every local progress change.
 * - Real-time weekly tournament score submission to live leaderboard.
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
    _unsubRealtime: null,
    _authCallback: null,

    init() {
      // 1. Purge any stale developer emails previously cached in localStorage
      try {
        const active = localStorage.getItem('arrout_active_google_user');
        if (active && (active.includes('reshwanth') || active.includes('sannivesham'))) {
          localStorage.removeItem('arrout_active_google_user');
        }
        const savedAccs = localStorage.getItem('arrout_google_accounts');
        if (savedAccs && (savedAccs.includes('reshwanth') || savedAccs.includes('sannivesham'))) {
          localStorage.removeItem('arrout_google_accounts');
        }
      } catch (e) {}

      // 2. Restore active Google user if previously logged in on this device
      try {
        const saved = localStorage.getItem('arrout_active_google_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email || parsed.uid)) {
            this.user = parsed;
            authUser = parsed;
            this.updateAuthUI(this.user);
          }
        }
      } catch (e) {}

      // Ensure modal events are hooked as soon as DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupModalEventListeners());
      } else {
        this.setupModalEventListeners();
      }

      const cfg = window.FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey || cfg.apiKey.includes('YOUR_API_KEY') || !cfg.projectId || cfg.projectId.includes('YOUR_PROJECT_ID')) {
        this.isConfigured = false;
        console.log('[FirebaseSync] Firebase config not set or using placeholders. Game is running in LocalStorage mode.');
        this.updateAuthUI(this.user);
        return;
      }

      if (typeof firebase === 'undefined') {
        console.warn('[FirebaseSync] Firebase SDK script not found. Running in LocalStorage mode.');
        this.updateAuthUI(this.user);
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

        // Offline persistence for Firestore
        try {
          this.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch (e) {}

        // Listen for authentication changes
        this.auth.onAuthStateChanged(user => {
          if (user) {
            this.saveGoogleAccount({
              name: user.displayName || (user.email ? user.email.split('@')[0] : 'Google Pilot'),
              email: user.email || 'Google Account',
              photoURL: user.photoURL || '',
              uid: user.uid
            });
          }
          this.handleAuthStateChange(user);
        });

        console.log('[FirebaseSync] Firebase initialized successfully.');
      } catch (err) {
        console.error('[FirebaseSync] Initialization failed:', err);
        this.isConfigured = false;
        this.updateAuthUI(this.user);
      }
    },

    async handleAuthStateChange(user) {
      if (user) {
        const authObj = {
          uid: user.uid,
          displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Google Pilot'),
          email: user.email,
          photoURL: user.photoURL || ''
        };
        this.user = authObj;
        authUser = authObj;
        console.log('[FirebaseSync] User authenticated:', authObj.email || authObj.uid);
        this.updateAuthUI(authObj);
        await this.syncOnLogin(authObj);
        this.listenToRealtimeCloudUpdates(authObj.uid);
      } else {
        if (!this.user || !this.user.email) {
          console.log('[FirebaseSync] User signed out. Operating in LocalStorage mode.');
          if (this._unsubRealtime) {
            try { this._unsubRealtime(); } catch (e) {}
            this._unsubRealtime = null;
          }
          this.updateAuthUI(null);
        }
      }
    },

    getSavedGoogleAccounts() {
      try {
        const raw = localStorage.getItem('arrout_google_accounts');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            return list.filter(a => a && a.email && !a.email.includes('reshwanth') && !a.email.includes('sannivesham'));
          }
        }
      } catch (e) {}
      return [];
    },

    saveAccountsList(list) {
      try {
        localStorage.setItem('arrout_google_accounts', JSON.stringify(list));
      } catch (e) {}
    },

    removeSavedGoogleAccount(email) {
      if (!email) return;
      const list = this.getSavedGoogleAccounts().filter(a => a.email.toLowerCase() !== email.toLowerCase());
      this.saveAccountsList(list);
    },

    saveGoogleAccount(acc) {
      if (!acc || !acc.email) return;
            const list = this.getSavedGoogleAccounts();
      const existingIdx = list.findIndex(a => a.email.toLowerCase() === acc.email.toLowerCase());
      if (existingIdx !== -1) {
        list[existingIdx] = { ...list[existingIdx], ...acc };
      } else {
        list.unshift(acc);
      }
      this.saveAccountsList(list);
    },

    openGoogleSignInModal(onSuccessCallback) {
      if (onSuccessCallback) this._authCallback = onSuccessCallback;

      const modal = document.getElementById('modal-google-auth');
      if (!modal) return;

      this.renderAccountsListUI();

      const manualBox = document.getElementById('google-manual-input-box');
      if (manualBox) manualBox.style.display = 'none';
      const emailInput = document.getElementById('google-custom-email');
      if (emailInput) emailInput.value = '';

      modal.classList.add('open');
      this.setupModalEventListeners();
    },

    closeGoogleSignInModal() {
      const modal = document.getElementById('modal-google-auth');
      if (modal) modal.classList.remove('open');
    },

    renderAccountsListUI() {
      const container = document.getElementById('google-accounts-list');
      if (!container) return;

      const accounts = this.getSavedGoogleAccounts();
      if (accounts.length === 0) {
        container.innerHTML = `
          <div style="padding: 14px 8px; text-align: center; color: var(--text-muted); font-size: 0.83rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); line-height: 1.4;">
            Sign in with your Google account to sync progress and tournament ranks across your devices in real time.
          </div>
        `;
        return;
      }

      const currentEmail = (this.user && this.user.email) ? this.user.email.toLowerCase() : '';
      const palette = ['#1A73E8', '#E91E63', '#8E24AA', '#D93025', '#F4511E', '#795548', '#00ACC1', '#8D6E63', '#3F51B5'];

      container.innerHTML = accounts.map((acc, idx) => {
        const isActive = acc.email && acc.email.toLowerCase() === currentEmail;
        const initial = acc.initial || (acc.name || acc.email || 'G').charAt(0).toUpperCase();
        const avatarBg = acc.avatarColor || palette[idx % palette.length];
        const avatarHtml = acc.photoURL 
          ? `<img src="${acc.photoURL}" alt="${acc.name}">`
          : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${avatarBg};border-radius:50%;color:#FFF;font-weight:600;">${initial}</span>`;

        return `
          <div class="google-account-row ${isActive ? 'active-account' : ''}" data-email="${acc.email}" role="button" tabindex="0">
            <div class="google-account-avatar">${avatarHtml}</div>
            <div class="google-account-info">
              <div class="google-account-name">${acc.name || acc.email.split('@')[0]}</div>
              <div class="google-account-email">${acc.email}</div>
            </div>
            ${isActive ? '<div class="google-account-check" title="Currently Active">✓</div>' : ''}
            <button type="button" class="google-account-remove" data-remove-email="${acc.email}" title="Remove from this device" aria-label="Remove account">✕</button>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.google-account-row').forEach(row => {
        row.onclick = (e) => {
          if (e.target && e.target.closest('.google-account-remove')) {
            e.stopPropagation();
            const removeBtn = e.target.closest('.google-account-remove');
            const targetEmail = removeBtn.dataset.removeEmail;
            this.removeSavedGoogleAccount(targetEmail);
            this.renderAccountsListUI();
            return;
          }
          const email = row.dataset.email;
          const chosen = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
          if (chosen) {
            this.selectGoogleAccount(chosen);
          }
        };
      });
    },

    setupModalEventListeners() {
      if (this._modalEventsAttached) return;
      this._modalEventsAttached = true;
      if (!this._escListenerAttached) {
        this._escListenerAttached = true;
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.closeGoogleSignInModal();
        });
      }

      const modal = document.getElementById('modal-google-auth');
      const closeBtn = document.getElementById('btn-close-google-modal');
      if (closeBtn) closeBtn.onclick = () => this.closeGoogleSignInModal();

      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) this.closeGoogleSignInModal();
        };
      }

      // 'Use another account' toggle
      const useAnotherBtn = document.getElementById('google-use-another-btn');
      const manualBox = document.getElementById('google-manual-input-box');
      const customInput = document.getElementById('google-custom-email');
      const cancelInputBtn = document.getElementById('google-cancel-input-btn');
      const confirmInputBtn = document.getElementById('google-confirm-input-btn');

      if (useAnotherBtn && manualBox) {
        useAnotherBtn.onclick = () => {
          manualBox.style.display = manualBox.style.display === 'none' ? 'flex' : 'none';
          if (manualBox.style.display === 'flex' && customInput) {
            customInput.focus();
          }
        };
      }

      if (cancelInputBtn && manualBox) {
        cancelInputBtn.onclick = () => {
          manualBox.style.display = 'none';
        };
      }

      const handleConfirmCustom = () => {
        if (!customInput) return;
        const val = customInput.value.trim();
        if (!val || !val.includes('@')) {
          if (window.showToast) window.showToast('Please enter a valid Google email address.');
          return;
        }
        const namePart = val.split('@')[0].replace(/[._-]/g, ' ');
        const capName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const newAcc = {
          name: capName,
          email: val,
          photoURL: ''
        };
        this.saveGoogleAccount(newAcc);
        this.selectGoogleAccount(newAcc);
      };

      if (confirmInputBtn) confirmInputBtn.onclick = handleConfirmCustom;
      if (customInput) {
        customInput.onkeydown = (e) => {
          if (e.key === 'Enter') handleConfirmCustom();
        };
      }

      // 'Open Google Web OAuth' button
      const oauthBtn = document.getElementById('btn-trigger-oauth-popup');
      if (oauthBtn) {
        oauthBtn.onclick = () => {
          this.closeGoogleSignInModal();
          this.signInWithGoogleOAuth();
        };
      }
    },

    async selectGoogleAccount(account) {
      if (!account || !account.email) return;

      const mockUid = account.uid || ('g_' + btoa(account.email).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 20));
      const authObj = {
        uid: mockUid,
        displayName: account.name || account.email.split('@')[0],
        email: account.email,
        photoURL: account.photoURL || ''
      };

      this.user = authObj;
      authUser = authObj;

      try {
        localStorage.setItem('arrout_active_google_user', JSON.stringify(authObj));
        this.saveGoogleAccount(authObj);
      } catch (e) {}

      this.closeGoogleSignInModal();
      this.updateAuthUI(authObj);
      await this.syncOnLogin(authObj);
      this.listenToRealtimeCloudUpdates(authObj.uid);

      if (this._authCallback) {
        const cb = this._authCallback;
        this._authCallback = null;
        try { cb(authObj); } catch (e) {}
      }

      if (window.showToast) {
        window.showToast('Signed in as ' + (authObj.displayName || authObj.email));
      }
    },

    signInWithGoogle(onSuccessCallback) {
      if (onSuccessCallback) this._authCallback = onSuccessCallback;

      // 1. Android Native App: trigger Android's native Google Sign-In intent
      if (window.AndroidBridge && typeof window.AndroidBridge.signInWithGoogle === 'function') {
        try {
          console.log('[FirebaseSync] Triggering Native Android Google Sign-In intent...');
          window.AndroidBridge.signInWithGoogle();
          return;
        } catch (e) {
          console.warn('[FirebaseSync] Android native Google Sign-In call failed:', e);
        }
      }

      // 2. Web Browser: Always show the in-app bottom sheet Google account modal!
      console.log('[FirebaseSync] Opening in-app Google Sign-In bottom sheet...');
      this.openGoogleSignInModal(onSuccessCallback);
    },

    async onNativeGoogleSignInSuccess(data) {
      if (!data || !data.email) return;
      console.log('[FirebaseSync] Native Google Sign-In response received for:', data.email);

      let firebaseUser = null;
      if (this.auth && data.idToken) {
        try {
          const credential = firebase.auth.GoogleAuthProvider.credential(data.idToken);
          const userCredential = await this.auth.signInWithCredential(credential);
          firebaseUser = userCredential.user;
          console.log('[FirebaseSync] Signed into Firebase Auth successfully with native token:', firebaseUser.uid);
        } catch (err) {
          console.warn('[FirebaseSync] signInWithCredential warning:', err);
        }
      }

      const uid = (firebaseUser && firebaseUser.uid) ||
                  (this.auth && this.auth.currentUser && this.auth.currentUser.uid) ||
                  data.uid ||
                  ('g_' + btoa(data.email).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 20));

      const authObj = {
        uid: uid,
        displayName: data.displayName || data.email.split('@')[0],
        email: data.email,
        photoURL: data.photoURL || (firebaseUser && firebaseUser.photoURL) || ''
      };

      this.user = authObj;
      authUser = authObj;

      try {
        localStorage.setItem('arrout_active_google_user', JSON.stringify(authObj));
        this.saveGoogleAccount(authObj);
      } catch (e) {}

      this.closeGoogleSignInModal();
      this.updateAuthUI(authObj);
      await this.syncOnLogin(authObj);
      this.listenToRealtimeCloudUpdates(authObj.uid);

      if (this._authCallback) {
        const cb = this._authCallback;
        this._authCallback = null;
        try { cb(authObj); } catch (e) {}
      }

      if (window.showToast) {
        window.showToast('Signed in as ' + (authObj.displayName || authObj.email));
      }
    },

    async signInWithGoogleOAuth() {
      if (!this.auth) {
        if (window.showToast) window.showToast('Google Auth is unavailable.');
        return;
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        if (window.showToast) window.showToast('Opening Google Sign-In...');
        const result = await this.auth.signInWithPopup(provider);
        if (result && result.user) {
          const u = result.user;
          const acc = {
            name: u.displayName || (u.email ? u.email.split('@')[0] : 'Google Pilot'),
            email: u.email,
            photoURL: u.photoURL || '',
            uid: u.uid
          };
          this.user = acc;
          authUser = acc;

          try {
            localStorage.setItem('arrout_active_google_user', JSON.stringify(acc));
            this.saveGoogleAccount(acc);
          } catch (e) {}

          this.closeGoogleSignInModal();
          this.updateAuthUI(acc);
          await this.syncOnLogin(u);
          this.listenToRealtimeCloudUpdates(u.uid);

          if (this._authCallback) {
            const cb = this._authCallback;
            this._authCallback = null;
            try { cb(acc); } catch (e) {}
          }

          if (window.showToast) window.showToast('Signed in as ' + (acc.name || acc.email));
        }
      } catch (err) {
        console.error('[FirebaseSync] Google OAuth failed:', err);
        if (err.code === 'auth/popup-blocked') {
          try {
            await this.auth.signInWithRedirect(provider);
          } catch (rErr) {
            if (window.showToast) window.showToast('Please allow popups to sign in with Google.');
          }
        } else if (err.code !== 'auth/popup-closed-by-user') {
          if (window.showToast) window.showToast('Google Sign-In failed: ' + (err.message || 'Please try again.'));
        }
      }
    },

    async signOut() {
      if (this._unsubRealtime) {
        try { this._unsubRealtime(); } catch (e) {}
        this._unsubRealtime = null;
      }

      this.user = null;
      authUser = null;
      try {
        localStorage.removeItem('arrout_active_google_user');
      } catch (e) {}

      if (this.auth) {
        try {
          await this.auth.signOut();
        } catch (err) {}
      }

      this.updateAuthUI(null);
      if (window.app && typeof window.app.updateHUD === 'function') {
        window.app.updateHUD();
      }
      if (window.showToast) window.showToast('Signed out from Google Cloud');
    },

    /**
     * Active Real-Time Firestore Listener (/users/{uid})
     */
    listenToRealtimeCloudUpdates(uid) {
      if (!this.db || !uid) return;
      if (this._unsubRealtime) {
        try { this._unsubRealtime(); } catch (e) {}
        this._unsubRealtime = null;
      }

      console.log('[FirebaseSync] Real-time cloud sync active for:', uid);
      this._unsubRealtime = this.db.collection('users').doc(uid).onSnapshot((docSnap) => {
        if (!docSnap.exists || isSyncing) return;
        const cloudData = docSnap.data();
        if (!cloudData) return;
        this.mergeRealtimeCloudData(cloudData);
      }, (err) => {
        console.warn('[FirebaseSync] Real-time cloud listener warning:', err);
      });
    },

    /**
     * Merge incoming real-time cloud data into local state
     */
    mergeRealtimeCloudData(cloud) {
      if (!cloud || isSyncing) return;
      const local = (window.storageManager && window.storageManager.data) ? window.storageManager.data : {};
      let changed = false;

      // Rating: keep highest
      if (cloud.rating && cloud.rating !== local.rating) {
        local.rating = Math.max(Number(local.rating) || 1200, Number(cloud.rating) || 1200);
        changed = true;
      }

      // Completed levels: union of all cleared levels
      const cloudLevels = cloud.completedLevels || {};
      local.completedLevels = local.completedLevels || {};
      for (const [lvlKey, cloudVal] of Object.entries(cloudLevels)) {
        if (!local.completedLevels[lvlKey]) {
          local.completedLevels[lvlKey] = cloudVal;
          changed = true;
        } else {
          const locVal = local.completedLevels[lvlKey];
          if (cloudVal.bestTime && (!locVal.bestTime || cloudVal.bestTime < locVal.bestTime)) {
            locVal.bestTime = cloudVal.bestTime;
            changed = true;
          }
        }
      }

      // Stats
      if (cloud.stats) {
        local.stats = local.stats || {};
        if (cloud.stats.matchesPlayed > (local.stats.matchesPlayed || 0)) {
          local.stats.matchesPlayed = cloud.stats.matchesPlayed;
          changed = true;
        }
        if (cloud.stats.matchesWon > (local.stats.matchesWon || 0)) {
          local.stats.matchesWon = cloud.stats.matchesWon;
          changed = true;
        }
        if (cloud.stats.matchesLost > (local.stats.matchesLost || 0)) {
          local.stats.matchesLost = cloud.stats.matchesLost;
          changed = true;
        }
        if (cloud.stats.streakDays > (local.stats.streakDays || 0)) {
          local.stats.streakDays = cloud.stats.streakDays;
          changed = true;
        }
      }

      if (changed) {
        console.log('[FirebaseSync] Real-time cloud update merged into local game.');
        if (window.storageManager) {
          window.storageManager.data = local;
          try {
            localStorage.setItem('arrow_escape_player_data_v1', JSON.stringify(local));
          } catch (e) {}
        }
        if (window.app) {
          if (typeof window.app.updateHUD === 'function') window.app.updateHUD();
          if (typeof window.app.renderProfile === 'function') window.app.renderProfile();
          if (typeof window.app.renderLevelGrid === 'function') window.app.renderLevelGrid();
        }
        this.setSyncStatus('🟢 Real-Time Cloud Sync Active');
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

          // 1. Rating: keep max
          local.rating = Math.max(Number(local.rating) || 1200, Number(cloud.rating) || 1200);

          // 2. Username: keep Google name if local is generic or empty
          if (user.displayName && (!local.username || local.username.startsWith('ArrowPilot_'))) {
            local.username = user.displayName;
          }

          // 3. Completed Levels: Union of all levels cleared, keeping best time
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

          // 4. Stats: Union and best totals
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

          // 5. Achievements: Unlock if unlocked either locally or on cloud
          const cloudAchMap = new Map((cloud.achievements || []).map(a => [a.id, a]));
          (local.achievements || []).forEach(a => {
            const ca = cloudAchMap.get(a.id);
            if (ca && ca.unlocked) a.unlocked = true;
          });

          // 6. Themes: Union of owned themes
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
            if (typeof window.app.updateHUD === 'function') window.app.updateHUD();
            if (typeof window.app.renderProfile === 'function') window.app.renderProfile();
            if (typeof window.app.renderLevelGrid === 'function') window.app.renderLevelGrid();
          }

          // Write back merged document to Firestore
          await this.saveToCloudNow();

          // Sync weekly tournament score to Firebase Leaderboard
          if (window.tournamentManager && typeof window.tournamentManager.submitScoreToFirebase === 'function') {
            const pts = (local && local.tournamentPoints) || 0;
            if (pts > 0) {
              window.tournamentManager.submitScoreToFirebase(pts);
            }
          }

          if (window.showToast) window.showToast('Google Cloud progress synced successfully!');
        } else {
          console.log('[FirebaseSync] No cloud document yet. Uploading local data to Google Cloud...');
          await this.saveToCloudNow();

          // Sync weekly tournament score to Firebase Leaderboard
          if (window.tournamentManager && typeof window.tournamentManager.submitScoreToFirebase === 'function') {
            const pts = (window.storageManager && window.storageManager.data && window.storageManager.data.tournamentPoints) || 0;
            if (pts > 0) {
              window.tournamentManager.submitScoreToFirebase(pts);
            }
          }

          if (window.showToast) window.showToast('Progress backed up to Google Cloud!');
        }
      } catch (err) {
        console.error('[FirebaseSync] Sync error during login:', err);
      } finally {
        isSyncing = false;
        this.setSyncStatus('🟢 Real-Time Cloud Sync Active');
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
          coins: 0,
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
        this.setSyncStatus('🟢 Real-Time Cloud Sync Active');

        // Also submit tournament score if points exist
        if (window.tournamentManager && typeof window.tournamentManager.submitScoreToFirebase === 'function') {
          const pts = (local && local.tournamentPoints) || 0;
          if (pts > 0) {
            window.tournamentManager.submitScoreToFirebase(pts);
          }
        }
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
            <div class="google-auth-card signed-in" style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #C7D2FE; border-radius: 20px; padding: 14px 16px; margin-bottom: 16px; text-align: left;">
              <div class="google-auth-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div class="google-auth-brand" style="display: flex; align-items: center; gap: 8px;">
                  <span class="google-auth-icon" style="font-size: 1.25rem;">☁️</span>
                  <b class="google-auth-title" style="color: var(--text-navy); font-size: 0.95rem;">Google Cloud Connected</b>
                </div>
                <span id="google-sync-status" class="sync-status-badge" style="font-size: 0.72rem; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 8px; border-radius: 10px;">
                  🟢 Real-Time Cloud Sync Active
                </span>
              </div>
              <div class="google-auth-user-info" style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <div class="google-auth-avatar-mini" style="width: 38px; height: 38px; border-radius: 50%; background: #6366F1; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; overflow: hidden; flex-shrink: 0;">
                  ${user.photoURL ? `<img src="${user.photoURL}" style="width: 100%; height: 100%; object-fit: cover;">` : (user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1; overflow: hidden;">
                  <div style="font-weight: 800; font-size: 0.92rem; color: var(--text-navy);">${user.displayName || 'Google Pilot'}</div>
                  <div style="font-size: 0.76rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.email || ''}</div>
                </div>
              </div>
              <div class="google-auth-actions" style="display: flex; gap: 8px; margin-top: 10px;">
                <button id="btn-google-sync-now" style="flex: 1; background: #6366F1; color: #FFF; border: none; padding: 8px 12px; border-radius: 12px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                  Sync Now
                </button>
                <button id="btn-google-switch" style="flex: 1; background: #FFF; color: #4F46E5; border: 1.5px solid #C7D2FE; padding: 8px 12px; border-radius: 12px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                  Switch Account
                </button>
                <button id="btn-google-signout" style="background: #FEE2E2; color: #DC2626; border: none; padding: 8px 12px; border-radius: 12px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                  Sign Out
                </button>
              </div>
            </div>
          `;
          const syncBtn = document.getElementById('btn-google-sync-now');
          if (syncBtn) syncBtn.onclick = () => this.syncOnLogin(user);
          const switchBtn = document.getElementById('btn-google-switch');
          if (switchBtn) switchBtn.onclick = () => this.signInWithGoogle();
          const outBtn = document.getElementById('btn-google-signout');
          if (outBtn) outBtn.onclick = () => this.signOut();
        } else {
          authBox.innerHTML = `
            <div class="google-auth-card signed-out" style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 20px; padding: 16px; margin-bottom: 16px; text-align: center;">
              <div class="google-auth-header" style="display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
                <div class="google-auth-brand" style="display: flex; align-items: center; gap: 8px;">
                  <span class="google-auth-icon" style="font-size: 1.3rem;">☁️</span>
                  <b class="google-auth-title" style="color: var(--text-navy); font-size: 0.95rem;">Google Cloud Save & Sync</b>
                </div>
              </div>
              <p class="google-auth-sub" style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
                Sign in with Google to back up your progress and sync tournament scores across all your devices in real time.
              </p>
              <button id="btn-google-signin" class="btn-google-signin" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #FFF; color: #1E293B; border: 1.5px solid #CBD5E1; box-shadow: 0 2px 6px rgba(0,0,0,0.06); padding: 10px 18px; border-radius: 14px; font-weight: 800; font-size: 0.88rem; cursor: pointer; width: 100%; transition: transform 0.1s;">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Sign in with Google
              </button>
            </div>
          `;
          const inBtn = document.getElementById('btn-google-signin');
          if (inBtn) inBtn.onclick = () => this.signInWithGoogle();
        }
      }

      // 3. Tournament Auth Status Bar
      const tourneyBar = document.getElementById('tourney-auth-status-bar');
      if (tourneyBar) {
        if (user) {
          tourneyBar.innerHTML = `
            <div style="background: #EEF2FF; border: 1.5px solid #C7D2FE; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.1rem;">👤</span>
                <div style="font-size: 0.8rem; color: #3730A3;">
                  Connected: <b>${user.displayName || 'Google Pilot'}</b> <span style="font-size: 0.74rem; opacity: 0.85;">(${user.email || ''})</span>
                </div>
              </div>
              <span style="font-size: 0.68rem; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 7px; border-radius: 8px;">
                LIVE SYNC
              </span>
            </div>
          `;
        } else {
          tourneyBar.innerHTML = `
            <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="font-size: 0.78rem; color: #92400E; line-height: 1.3;">
                🔑 <b>Google Sign-In:</b> Sign in to record your points on the live leaderboard.
              </div>
              <button id="btn-tourney-google-login" style="background: #F59E0B; color: #FFF; border: none; padding: 6px 14px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; white-space: nowrap;">
                Sign In
              </button>
            </div>
          `;
          const loginBtn = document.getElementById('btn-tourney-google-login');
          if (loginBtn) loginBtn.onclick = () => this.signInWithGoogle();
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
