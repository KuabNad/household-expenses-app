import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  /**
   * Firebase exposes this through its React Native conditional export.
   * TypeScript's generic package condition does not currently surface it.
   */
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
