import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import { DEFAULT_USERS } from '../data/mockData';
import { recordAuditLog, checkAndSeedFirestore } from './firebaseService';

export const authService = {
  // Sign in with Firebase Auth or mapped institutional accounts
  login: async (identifier: string, password: string): Promise<User> => {
    await checkAndSeedFirestore();

    const clean = identifier.trim().toLowerCase();
    let emailToUse = clean;

    // Check if user entered roll number, map to email
    if (!clean.includes('@')) {
      for (const k in DEFAULT_USERS) {
        if (DEFAULT_USERS[k].user.rollNo?.toLowerCase() === clean) {
          emailToUse = DEFAULT_USERS[k].user.email.toLowerCase();
          break;
        }
      }
      if (clean === 'admin') {
        emailToUse = 'warden@lbrce.ac.in';
      }
    }

    try {
      // 1. Attempt standard Firebase Auth sign-in
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const fbUser = userCredential.user;

      // Fetch user profile document from Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as User;
        await recordAuditLog('USER_LOGIN', { uid: fbUser.uid, name: profile.name, role: profile.role }, `Logged in via Firebase Auth (${profile.email})`);
        return profile;
      }

      // If document doesn't exist yet, check default accounts to seed user profile
      const defaultMatch = Object.values(DEFAULT_USERS).find((d) => d.user.email.toLowerCase() === emailToUse);
      const profile: User = defaultMatch ? { ...defaultMatch.user, id: fbUser.uid } : {
        id: fbUser.uid,
        name: fbUser.displayName || emailToUse.split('@')[0],
        email: emailToUse,
        role: emailToUse.includes('warden') ? 'admin' : 'student',
        phone: '+91 94901 88231',
      };

      await setDoc(userDocRef, profile);
      await recordAuditLog('USER_LOGIN', { uid: fbUser.uid, name: profile.name, role: profile.role }, `Logged in via Firebase Auth (${profile.email})`);
      return profile;
    } catch (firebaseErr: any) {
      console.warn('[Firebase Auth] Firebase sign-in attempt:', firebaseErr.code || firebaseErr.message);

      // Check if credentials match verified institutional default accounts
      const defaultMatch = Object.values(DEFAULT_USERS).find(
        (d) =>
          (d.user.email.toLowerCase() === emailToUse || d.user.rollNo?.toLowerCase() === clean) &&
          d.passwordHash === password
      );

      if (defaultMatch) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, defaultMatch.user.email, password);
          const userProfile: User = { ...defaultMatch.user, id: newCred.user.uid };
          await setDoc(doc(db, 'users', newCred.user.uid), userProfile);
          await recordAuditLog('USER_REGISTER', { uid: newCred.user.uid, name: userProfile.name, role: userProfile.role }, `Auto-provisioned institutional account in Firebase (${userProfile.email})`);
          return userProfile;
        } catch {
          await recordAuditLog('USER_LOGIN', { uid: defaultMatch.user.id, name: defaultMatch.user.name, role: defaultMatch.user.role }, `Authenticated with verified institutional credentials (${defaultMatch.user.email})`);
          return defaultMatch.user;
        }
      }

      throw new Error(firebaseErr.message || 'Authentication failed. Please verify credentials.');
    }
  },

  // Register brand new student account in Firebase
  registerStudent: async (data: {
    name: string;
    email: string;
    password: string;
    rollNo: string;
    branch: string;
    phone: string;
    gender: string;
    block: string;
    roomNo: string;
    parentName: string;
    parentPhone: string;
  }): Promise<User> => {
    await checkAndSeedFirestore();

    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const newUid = cred.user.uid;

    const newProfile: User = {
      id: newUid,
      name: data.name,
      email: data.email,
      rollNo: data.rollNo,
      role: 'student',
      branch: data.branch,
      phone: data.phone,
      gender: (data.gender === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
      block: data.block,
      roomNo: data.roomNo,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      year: 'I Year - I Sem',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    await setDoc(doc(db, 'users', newUid), newProfile);
    await recordAuditLog('USER_REGISTER', { uid: newUid, name: newProfile.name, role: 'student' }, `New Student registered via Firebase Auth: ${newProfile.name} [${newProfile.rollNo}]`);
    return newProfile;
  },

  // Sign out
  logout: async (currentUser?: User | null): Promise<void> => {
    try {
      if (currentUser) {
        await recordAuditLog('USER_LOGOUT', { uid: currentUser.id, name: currentUser.name, role: currentUser.role }, `User signed out`);
      }
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Sign out error:', err);
    }
  },

  // State listener
  onAuthChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
