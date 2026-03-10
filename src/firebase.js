import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from "firebase/firestore";

// TODO: 環境変数（.envファイル）からFirebase設定を読み込む
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.authDomain;

let app;
let auth;
let db;

if (isConfigValid) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    console.warn("Firebase config is missing. Authentication will not work.");
    // Dummy objects to prevent early crashes
    auth = { onAuthStateChanged: (cb) => { cb(null); return () => { }; }, currentUser: null };
    db = {};
}

export { auth, db };

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Auth Error:", error);
        return null;
    }
};

export const logout = () => signOut(auth);

export const loginAnonymously = async () => {
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
    } catch (e) {
        console.error("Fetch Accumulation Error:", e);
        return [];
    }
};
