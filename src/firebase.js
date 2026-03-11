import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

// TODO: 環境変数（.envファイル）からFirebase設定を読み込む
// Firebase Configuration - Hardcoded for build stability
const firebaseConfig = {
    apiKey: "AIzaSyDzWYTqLbGZA0lZ3YOVt6NWYacgVp67zpQ",
    authDomain: "itako-plaza-kenji.firebaseapp.com",
    projectId: "itako-plaza-kenji",
    storageBucket: "itako-plaza-kenji.firebasestorage.app",
    messagingSenderId: "588973200958",
    appId: "1:588973200958:web:16d8ceab44a39098b7636f"
};

console.log("Firebase Status:", {
    connected: !!firebaseConfig.apiKey,
    domain: firebaseConfig.authDomain
});

const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.authDomain);
console.log("Is Firebase Config Valid?", isConfigValid);

let app;
let auth;
let db;

const dummyAuthCallbacks = new Set();
let dummyCurrentUser = null;

if (isConfigValid) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    console.warn("Firebase config is missing. Authentication will not work.");
    auth = {
        onAuthStateChanged: (cb) => {
            dummyAuthCallbacks.add(cb);
            cb(dummyCurrentUser);
            return () => { dummyAuthCallbacks.delete(cb); };
        },
        get currentUser() { return dummyCurrentUser; }
    };
    db = {};
}

const triggerAuthChange = (user) => {
    dummyCurrentUser = user;
    dummyAuthCallbacks.forEach(cb => cb(user));
};

export { auth, db, triggerAuthChange };

const googleProvider = isConfigValid ? new GoogleAuthProvider() : null;

export const loginWithGoogle = async () => {
    if (!isConfigValid) {
        console.warn("Using dummy Google login");
        const user = { uid: 'dummy-google-user', displayName: 'GUEST (No Firebase)' };
        triggerAuthChange(user);
        return user;
    }
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Auth Error:", error);
        return null;
    }
};

export const logout = () => {
    if (isConfigValid) {
        signOut(auth);
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
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (error) {
        console.error("Auth Error:", error);
        return null;
    }
};

/**
 * 栞（ブックマーク）を保存
 */
export const saveBookmark = async (userMsg, aiMsg, charId) => {
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
 * 特定の場所の霊的エネルギーを更新
 */
export const updateLocationEnergy = async (locationId, amount = 10) => {
    if (!isConfigValid || !db) return;
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
    if (!isConfigValid || !db) return {};
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
