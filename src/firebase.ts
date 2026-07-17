import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL: The app will break without this line
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errCode = (error && typeof error === "object" && "code" in error) ? String((error as any).code) : "";
  const errMsg = error instanceof Error ? error.message : String(error);
  
  const isPermissionDenied = errCode === "permission-denied" || 
                             errMsg.toLowerCase().includes("permission-denied") || 
                             errMsg.toLowerCase().includes("insufficient permissions");

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };

  if (isPermissionDenied) {
    console.error("Firestore Security Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // Gracefully handle connectivity, unavailable, offline errors without throwing and crashing the app
    console.warn("Firestore Operation Warning (Local/Offline Mode Active): ", JSON.stringify(errInfo));
  }
}
