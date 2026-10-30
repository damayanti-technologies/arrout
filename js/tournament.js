/* ---- js/tournament.js ---- */
/**
 * ARROUT - Weekly Tournament with Local Storage & Firebase Global Leaderboard.
 * One hard puzzle per ISO week (same for everyone, chosen from the week id).
 * Entry unlocks after clearing 10 different levels in the week.
 * Best times are stored locally and synced to Firebase Global Leaderboards.
 */
class TournamentManager {
  // Deterministic pick of one of the 200 hardest levels (801-1000) from the week id
  getWeeklyLevel(weekId) {
    let h = 2166136261;
    for (let i = 0; i < weekId.length; i++) { h ^= weekId.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 801 + (h % 200);
  }

  getWeeklyInfo() {
    const sm = window.storageManager;
    sm.checkWeeklyReset();
    const weekId = sm.data.tournamentWeekId;
    const qualifyingCount = sm.data.tournamentQualifyingLevels.length;

    // Week ends Sunday 23:59:59 UTC (ISO weeks run Monday-Sunday)
    const now = new Date();
    const daysLeft = (7 - now.getUTCDay()) % 7; // Sunday -> 0
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysLeft, 23, 59, 59);
    const ms = Math.max(0, end - now.getTime());
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
    const timeRemaining = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;

    return {
      weekId,
      level: this.getWeeklyLevel(weekId),
      qualifyingCount,
      isEligible: qualifyingCount >= 10,
      timeRemaining,
      score: sm.data.tournamentScore
    };
  }

  recordTournamentResult(timeSec) {
    const rec = window.storageManager.recordTournamentResult(timeSec);
    this.submitScoreToFirebase(rec);
    return rec;
  }

  async submitScoreToFirebase(record) {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.apps.length) return;
      const db = firebase.firestore();
      const authUser = firebase.auth().currentUser;
      const sm = window.storageManager;
      const uid = authUser ? authUser.uid : (sm.data.playerId || ('p_' + Math.random().toString(36).slice(2, 10)));
      const username = (authUser && (authUser.displayName || authUser.email)) || sm.data.username || 'ArrowPilot';
      const photoURL = (authUser && authUser.photoURL) || '';
      const weekId = record.weekId || sm.data.tournamentWeekId;

      const scoreDoc = db.collection('tournaments').doc(weekId).collection('scores').doc(uid);
      const existing = await scoreDoc.get();

      if (existing.exists) {
        const oldData = existing.data();
        const bestTime = Math.min(Number(record.timeSec), Number(oldData.timeSec || 999999));
        await scoreDoc.set({
          uid,
          username,
          photoURL,
          timeSec: bestTime,
          runs: (oldData.runs || 0) + 1,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        await scoreDoc.set({
          uid,
          username,
          photoURL,
          timeSec: Number(record.timeSec),
          runs: record.runs || 1,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log('[Tournament] Successfully submitted score to Firebase Cloud Leaderboard!');
    } catch (e) {
      console.warn('[Tournament] Could not submit score to Firebase:', e);
    }
  }

  listenLeaderboard(weekId, onUpdate) {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.apps.length) return () => {};
      const db = firebase.firestore();
      return db.collection('tournaments').doc(weekId).collection('scores')
        .orderBy('timeSec', 'asc')
        .limit(25)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push(doc.data());
          });
          onUpdate(list);
        }, (err) => {
          console.warn('[Tournament] Leaderboard snapshot error:', err);
        });
    } catch (e) {
      return () => {};
    }
  }
}

window.tournamentManager = new TournamentManager();
