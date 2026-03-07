import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from "firebase/firestore";

// TODO: User needs to provide actual config if they want to use their own project
const firebaseConfig = {
    apiKey: "AIzaSyCX6vE8yK-S89L0M",
    authDomain: "itako-plaza.firebaseapp.com",
    projectId: "itako-plaza",
    storageBucket: "itako-plaza.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
