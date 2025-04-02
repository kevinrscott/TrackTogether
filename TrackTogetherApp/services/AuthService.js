import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { auth, db } from "../config/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: user.email
        })

        return user;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in");
        return userCredential.user;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}

export { registerUser, loginUser, logoutUser };