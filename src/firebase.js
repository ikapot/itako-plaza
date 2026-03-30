import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

// TODO: 環境変数（.envファイル）からFirebase設定を読み込む
// Firebase Configuration - Hardcoded for build stability
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("Firebase Status:", {
    connected: !!firebaseConfig.apiKey,
    domain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId
});

const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.authDomain);
if (!isConfigValid) {
    const isLocal = import.meta.env.DEV;
    const errorPrefix = isLocal ? "[LOCAL] " : "[PROD] ";
    const advice = isLocal 
        ? "Please restart 'npm run dev' to pick up changes in .env file."
        : "Check GitHub Secrets or Vercel Environment Variables. Names MUST start with VITE_FIREBASE_*.";
        
    console.error(`FIREBASE ERROR: ${errorPrefix}Missing essential config! ${advice}`, {
        missing_api_key: !firebaseConfig.apiKey,
        missing_auth_domain: !firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId || "MISSING"
    });
}
console.log("Is Firebase Config Valid?", isConfigValid);

let auth;
let db;

const authCallbacks = new Set();
let currentUser = null;

if (isConfigValid) {
    const app = initializeApp(firebaseConfig);
    const realAuth = getAuth(app);
    db = getFirestore(app);

    // Bridge real auth changes to our unified unified listeners
    realAuth.onAuthStateChanged((user) => {
        currentUser = user;
        authCallbacks.forEach(cb => cb(user));
    });
    
    // We export a wrapper that uses our unified listeners and realAuth's actual state
    auth = {
        onAuthStateChanged: (cb) => {
            authCallbacks.add(cb);
            cb(currentUser);
            return () => { authCallbacks.delete(cb); };
        },
        get currentUser() { return currentUser; },
        signOut: () => signOut(realAuth),
        // Pass through any other required functions if needed, 
        // but App.jsx mostly uses these and direct realAuth for popups
        _realAuth: realAuth 
    };
} else {
    console.warn("Firebase config is missing. Authentication will not work.");
    auth = {
        onAuthStateChanged: (cb) => {
            authCallbacks.add(cb);
            cb(currentUser);
            return () => { authCallbacks.delete(cb); };
        },
        get currentUser() { 
          if (!currentUser) return null;
          return {
            ...currentUser,
            getIdToken: async () => "dummy-id-token"
          };
        }
    };
    db = new Proxy({}, {
        get: (target, prop) => {
            if (prop === 'type' || prop === '_type') return 'Firestore';
            return () => ({}); 
        }
    });
}

const triggerAuthChange = (user) => {
    currentUser = user;
    authCallbacks.forEach(cb => cb(user));
};

export { auth, db, triggerAuthChange };

const googleProvider = isConfigValid ? new GoogleAuthProvider() : null;

export const loginWithGoogle = async () => {
    if (!isConfigValid) {
        console.warn("Using dummy Google login due to missing config");
        const user = { uid: 'dummy-google-user', displayName: 'GUEST (Local)' };
        triggerAuthChange(user);
        return user;
    }
    try {
        const result = await signInWithPopup(auth._realAuth || auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Auth Error:", error);
        if (error.code === 'auth/configuration-not-found' || error.message.includes('CONFIGURATION_NOT_FOUND')) {
           console.warn("Falling back to dummy login due to Firebase configuration error.");
           const user = { uid: 'dummy-google-err', displayName: 'GUEST (Fallback)' };
           triggerAuthChange(user);
           return user;
        }
        return null;
    }
};

export const logout = () => {
    if (isConfigValid) {
        try {
            signOut(auth._realAuth || auth);
        } catch (e) {
            triggerAuthChange(null);
        }
    } else {
        triggerAuthChange(null);
    }
};

export const loginAnonymously = async () => {
    if (!isConfigValid) {
        console.warn("Using dummy anonymous login");
        const user = { uid: 'dummy-anon-user', displayName: 'GUEST' };
        triggerAuthChange(user);
        return user;
    }
    try {
        const result = await signInAnonymously(auth._realAuth || auth);
        return result.user;
    } catch (error) {
        console.error("Auth Error:", error);
        if (error.code === 'auth/configuration-not-found' || error.message.includes('CONFIGURATION_NOT_FOUND')) {
            console.warn("Falling back to dummy guest login.");
            const user = { uid: 'dummy-anon-err', displayName: 'GUEST (Link)' };
            triggerAuthChange(user);
            return user;
        }
        return null;
    }
};

/**
 * 栞（ブックマーク）を保存
 */
export const saveBookmark = async (userMsg, aiMsg, charId) => {
    if (!isConfigValid || !db) {
        console.warn("SaveBookmark ignored: Firebase not connected.");
        return;
    }
    const user = auth.currentUser;
    if (!user) return;
    try {
        await addDoc(collection(db, "bookmarks"), {
            uid: user.uid,
            userMsg,
            aiMsg,
            charId,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Save Error:", e);
    }
};

/**
 * 保存された栞を全取得
 */
export const fetchBookmarks = async () => {
    if (!isConfigValid || !db) return [];
    const user = auth.currentUser;
    if (!user) return [];
    try {
        const q = query(
            collection(db, "bookmarks"),
            where("uid", "==", user.uid),
            orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
};

/**
 * NotebookLMの蓄積データを保存
 */
export const saveNotebookAccumulation = async (content) => {
    if (!isConfigValid || !db) return;
    const user = auth.currentUser;
    if (!user || !content.trim()) return;
    try {
        await addDoc(collection(db, "notebook_accumulations"), {
            uid: user.uid,
            content,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Save Accumulation Error:", e);
    }
};

/**
 * NotebookLMの蓄積データを全取得
 */
export const fetchNotebookAccumulations = async () => {
    if (!isConfigValid || !db) return [];
    const user = auth.currentUser;
    if (!user) return [];
    try {
        const q = query(
            collection(db, "notebook_accumulations"),
            where("uid", "==", user.uid),
            orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch {
        return [];
    }
};

/**
 * 霊的エコー（セマンティックキャッシュ）を検索
 */
export const findEchoInFirestore = async (systemPrompt, userMsg) => {
    if (!isConfigValid || !db) return null;
    const cacheKey = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
    try {
        const q = query(
            collection(db, "semantic_echoes"),
            where("key", "==", cacheKey),
            orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data().response;
        }
    } catch (e) {
        console.error("Find Echo Error:", e);
    }
    return null;
};

/**
 * 霊的エコーを保存
 */
export const saveEchoToFirestore = async (systemPrompt, userMsg, response) => {
    if (!isConfigValid || !db) return;
    const cacheKey = `${systemPrompt.substring(0, 50)}:${userMsg.trim()}`;
    try {
        await addDoc(collection(db, "semantic_echoes"), {
            key: cacheKey,
            response,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Save Echo Error:", e);
    }
};

/**
 * 特定の場所の霊的エネルギーを更新
 */
export const updateLocationEnergy = async (locationId, amount = 10) => {
    if (!isConfigValid || !db || typeof db.doc !== 'function') return;
    try {
        const locRef = doc(db, "location_energy", locationId);
        const snap = await getDoc(locRef);

        if (snap.exists()) {
            await updateDoc(locRef, {
                energy: increment(amount),
                lastInteraction: serverTimestamp()
            });
        } else {
            await setDoc(locRef, {
                energy: amount,
                lastInteraction: serverTimestamp()
            });
        }
    } catch (e) {
        console.error("Update Energy Error:", e);
    }
};

/**
 * 全場所の霊的エネルギーを取得
 */
export const fetchLocationEnergies = async () => {
    if (!isConfigValid || !db || typeof db.collection !== 'function') return {};
    try {
        const snapshot = await getDocs(collection(db, "location_energy"));
        const energies = {};
        snapshot.forEach(doc => {
            energies[doc.id] = doc.data().energy || 0;
        });
        return energies;
    } catch (e) {
        console.error("Fetch Energies Error:", e);
        return {};
    }
};

/**
 * 対話の記憶（Alaya）を Firestore に保存
 */
export const saveAlayaToFirestore = async (content) => {
    if (!isConfigValid || !db) return;
    const user = auth.currentUser;
    if (!user || !content.trim()) return;
    try {
        await setDoc(doc(db, "alaya", user.uid), {
            content,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Save Alaya Error:", e);
    }
};

/**
 * 対話の記憶（Alaya）を Firestore から取得
 */
export const fetchAlayaFromFirestore = async () => {
    if (!isConfigValid || !db) return null;
    const user = auth.currentUser;
    if (!user) return null;
    try {
        const snap = await getDoc(doc(db, "alaya", user.uid));
        if (snap.exists()) {
            return snap.data().content;
        }
    } catch (e) {
        console.error("Fetch Alaya Error:", e);
    }
    return null;
};
