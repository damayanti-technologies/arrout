/* ---- js/tournament.js ---- */
/**
 * ARROUT - Weekly Tournament with Local Storage & Firebase Global Leaderboard.
 * Points-based weekly championship: Players play normal levels of the game.
 * Each level cleared awards 1 Tournament Point.
 * 
 * Schedule:
 * - Monday 00:00 UTC through Saturday 23:59:59 UTC: Tournament Active! Points accumulate.
 * - Sunday: Results Day! Final standings locked, weekly champion declared.
 * - Monday 00:00 UTC: Reset for new week, points reset to 0.
 */
class TournamentManager {
  getWeeklyInfo() {
    const sm = window.storageManager;
    if (sm) sm.checkWeeklyReset();
    const weekId = (sm && sm.data && sm.data.tournamentWeekId) || this.getCurrentWeekId();
    const points = (sm && sm.data && Number(sm.data.tournamentPoints)) || 0;
    const levelsCount = (sm && sm.data && sm.data.tournamentWeeklyLevels && sm.data.tournamentWeeklyLevels.length) || points;

    // Week schedule: Monday through Saturday active, Sunday is Results Day
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isSunday = (utcDay === 0);

    let timeRemaining = '';
    let statusText = '';

    if (isSunday) {
      // Results day! Ends when Monday 00:00:00 UTC starts
      const nextMon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const ms = Math.max(0, nextMon.getTime() - now.getTime());
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      timeRemaining = `${h}h ${m}m`;
      statusText = 'Results Day • Winner Crowned';
    } else {
      // Monday - Saturday active! Ends Saturday 23:59:59 UTC (Sunday 00:00:00 UTC)
      const daysUntilSunday = 7 - utcDay;
      const endOfSat = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday, 0, 0, 0));
      const ms = Math.max(0, endOfSat.getTime() - now.getTime());
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      timeRemaining = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
      statusText = `Tournament Active • Ends in ${timeRemaining}`;
    }

    return {
      weekId,
      points,
      levelsCount,
      isSunday,
      timeRemaining,
      statusText
    };
  }

  getCurrentWeekId() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  async onLevelCompleted(points) {
    await this.submitScoreToFirebase(points);
  }

  async submitScoreToFirebase(points) {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.apps.length) return;
      const authUser = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) || (window.FirebaseSync && window.FirebaseSync.user);
      if (!authUser || !authUser.uid) return; // Only signed-in users can write to Firestore leaderboard per firestore.rules
      const db = firebase.firestore();
      const sm = window.storageManager;
      const uid = authUser.uid;
      const username = authUser.displayName || authUser.email || (sm && sm.data && sm.data.username) || 'ArrowPilot';
      const photoURL = authUser.photoURL || '';
      const weekId = (sm && sm.data && sm.data.tournamentWeekId) || this.getCurrentWeekId();
      const pts = Number(points !== undefined ? points : (sm && sm.data && sm.data.tournamentPoints) || 0);

      const scoreDoc = db.collection('tournaments').doc(weekId).collection('scores').doc(uid);
      const existing = await scoreDoc.get();

      if (existing.exists) {
        const oldData = existing.data();
        const maxPts = Math.max(pts, Number(oldData.points || oldData.levelsCompleted || 0));
        await scoreDoc.set({
          uid,
          username,
          photoURL,
          points: maxPts,
          levelsCompleted: maxPts,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        await scoreDoc.set({
          uid,
          username,
          photoURL,
          points: pts,
          levelsCompleted: pts,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log('[Tournament] Successfully submitted score to Firebase Cloud Leaderboard:', pts);
    } catch (e) {
      console.warn('[Tournament] Could not submit score to Firebase:', e);
    }
  }

  listenLeaderboard(weekId, onUpdate) {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.apps.length) return () => {};
      const db = firebase.firestore();
      return db.collection('tournaments').doc(weekId).collection('scores')
        .orderBy('points', 'desc')
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
