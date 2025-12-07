
import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
  ReactNode,
} from 'react';
import {
  UserData, 
  Task, 
  Reward, 
  InventoryItem, 
  Transaction, 
} from './types'; 
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { getInitialUserData } from './data'; // ✅ 從 data.ts 導入

// --- HELPERS ---
const removeUndefined = (obj: any): any => { /* ... simplified for brevity */ };

// --- CONTEXT DEFINITION ---
interface UserDataContextType {
  userData: UserData | null;
  userDataLoading: boolean;
  isPointsAnimating: boolean;
  updateUserData: (updates: Partial<UserData>) => void;
  addToast: (message: string, type?: 'success' | 'celebrate') => void;
  handleUseItem: (itemId: number, callbacks: { onStartParentChildTime?: (item: InventoryItem) => void }) => void;
  // ... other functions would be listed here
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useUserData must be used within a UserDataProvider');
  return context;
};

// --- PROVIDER COMPONENT ---
interface UserDataProviderProps {
  children: ReactNode;
  addToast: (message: string, type?: 'success' | 'celebrate') => void;
}

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children, addToast }) => {
  const { currentUser, authLoading } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [isPointsAnimating, setIsPointsAnimating] = useState(false);
  const dataRef = useRef<UserData | null>(userData);

  useEffect(() => { dataRef.current = userData; }, [userData]);

  useEffect(() => {
    if (authLoading) {
      console.log('[UserContext] Auth is loading. Waiting...');
      setUserDataLoading(true);
      return;
    }

    if (!currentUser) {
      console.log('[UserContext] Auth complete, no user. Resetting state.');
      setUserData(null);
      setUserDataLoading(false);
      return;
    }
    
    console.log(`[UserContext] User ${currentUser.uid} authenticated. Setting up Firestore listener.`);
    setUserDataLoading(true);

    const docRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        console.log('[UserContext] Firestore document snapshot received.');
        setUserData(snapshot.data() as UserData);
      } else {
        console.log('[UserContext] Firestore document does not exist. Creating it...');
        try {
          const initialData = getInitialUserData(currentUser.uid);
          await setDoc(docRef, initialData); // Using the imported function
        } catch (error) {
          console.error('[UserContext] Error creating initial user document:', error);
          addToast('建立使用者資料時發生錯誤');
        }
      }
      setUserDataLoading(false);
      console.log('[UserContext] userDataLoading set to false.');
    }, (error) => {
      console.error('[UserContext] Firestore snapshot listener error:', error);
      addToast('讀取使用者資料時發生錯誤');
      setUserDataLoading(false);
    });

    return () => {
      console.log('[UserContext] Cleaning up Firestore listener.');
      unsubscribe();
    };
  }, [currentUser, authLoading, addToast]);

  const updateUserData = useCallback(async (updates: Partial<UserData>) => {
    if (!currentUser?.uid) return;
    const docRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(docRef, updates, { merge: true });
    } catch (error) {
      console.error('Error updating user data:', error);
      addToast('資料儲存失敗');
    }
  }, [currentUser, addToast]);
  
  const handleUseItem = useCallback(
    (itemId: number, callbacks: { onStartParentChildTime?: (item: InventoryItem) => void }) => {
      if (!dataRef.current) return;
      const item = dataRef.current.inventory.find((i) => i.id === itemId);
      if (item) {
        if (item.action === 'parent_child_time') {
          callbacks.onStartParentChildTime?.(item);
        }
        const newInventory = dataRef.current.inventory.map((i) =>
          i.id === itemId ? { ...i, used: true } : i
        );
        updateUserData({ inventory: newInventory });
        addToast(`已使用 ${item.name}！`);
      }
    },
    [updateUserData, addToast]
  );


  const value = {
    userData,
    userDataLoading,
    isPointsAnimating,
    updateUserData,
    addToast,
    handleUseItem,
    // ... other functions would be returned here
  } as UserDataContextType;

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
