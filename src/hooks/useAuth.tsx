import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { auth, db } from '../services/firebase';
import type { UserProfile } from '../types/models';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileSubscription: Unsubscribe | undefined;

    return onAuthStateChanged(auth, async (nextUser) => {
      profileSubscription?.();
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', nextUser.uid);
      profileSubscription = onSnapshot(
        userRef,
        async (snapshot) => {
          if (!snapshot.exists()) {
            await setDoc(userRef, {
              id: nextUser.uid,
              email: nextUser.email ?? '',
              displayName: nextUser.displayName ?? nextUser.email?.split('@')[0] ?? 'Member',
              householdId: null,
              createdAt: serverTimestamp(),
            });
            return;
          }
          setProfile(snapshot.data() as UserProfile);
          setLoading(false);
        },
        () => {
          setProfile(null);
          setLoading(false);
        },
      );
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      },
      register: async (displayName, email, password) => {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );
        const cleanName = displayName.trim();
        await updateProfile(credential.user, { displayName: cleanName });
        await setDoc(doc(db, 'users', credential.user.uid), {
          id: credential.user.uid,
          email: credential.user.email ?? email.trim().toLowerCase(),
          displayName: cleanName,
          householdId: null,
          createdAt: serverTimestamp(),
        });
      },
      logout: () => signOut(auth),
    }),
    [loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
