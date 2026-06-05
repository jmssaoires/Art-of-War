import { initializeApp } from 'firebase/app';
import { 
  getAuth as getRealAuth, 
  signInWithPopup as realSignInWithPopup, 
  GoogleAuthProvider as RealGoogleAuthProvider, 
  signInAnonymously as realSignInAnonymously, 
  updateProfile as realUpdateProfile,
  signOut as realSignOut,
  onAuthStateChanged as realOnAuthStateChanged,
  signInWithEmailAndPassword as realSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore as getRealFirestore,
  doc as realDoc,
  setDoc as realSetDoc,
  updateDoc as realUpdateDoc,
  addDoc as realAddDoc,
  deleteDoc as realDeleteDoc,
  getDoc as realGetDoc,
  getDocs as realGetDocs,
  onSnapshot as realOnSnapshot,
  collection as realCollection,
  query as realQuery,
  orderBy as realOrderBy,
  limit as realLimit,
  serverTimestamp as realServerTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let forceMock = false;

// Detect mock mode (remixed project or missing valid credentials)
export function isMockMode() {
  return (
    forceMock ||
    !firebaseConfig.apiKey || 
    firebaseConfig.apiKey === 'remixed-api-key' || 
    firebaseConfig.apiKey.startsWith('remixed')
  );
}

// -------------------------------------------------------------
// LOCAL STORAGE DATA PERSISTENCE FOR FULL-FIDELITY OFFLINE MODE
// -------------------------------------------------------------
const STORAGE_KEY_DB = 'dynasty_mock_firestore_db';
const STORAGE_KEY_USER = 'dynasty_local_user';
const STORAGE_KEY_ADMIN_MODE = 'dynasty_admin_mode';

function getMockDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB);
    const db = raw ? JSON.parse(raw) : {};
    
    // Auto-populate default Room document if it does not exist
    if (Object.keys(db).length === 0) {
      db['rooms/suntzu888'] = {
        roomName: '天演策源总坛 (Suntzu Main Hall)',
        mandate: 85,
        stability: 90,
        coffers: 25000,
        emperorAge: 16,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enemyName: '匈奴单于巴塔',
        enemyPower: 75,
      };
      
      // Add initial logs reference
      db['rooms/suntzu888/logs/log1'] = {
        id: 'log1',
        text: '🏆 [系统] 圣上驾临天演策源总坛！天演大司马入朝督理大理沙盘。',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      };
      db['rooms/suntzu888/logs/log2'] = {
        id: 'log2',
        text: '⚔️ [演武] 匈奴前锋骑兵在大漠方向出没，全军严阵以待！',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(db));
    }
    return db;
  } catch (_) {
    return {};
  }
}

function saveMockDB(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(data));
  } catch (_) {}
}

// Global active snapshot listeners for mocked real-time system
type MockListener = {
  id: string;
  path: string;
  isCollection: boolean;
  callback: (snapshot: any) => void;
};
const mockListeners: MockListener[] = [];

function notifyMockListeners(changedPath: string) {
  mockListeners.forEach(listener => {
    if (listener.isCollection) {
      // If changed document starts with this collection path and matches depth exactly
      if (
        changedPath.startsWith(listener.path + '/') && 
        changedPath.split('/').length === listener.path.split('/').length + 1
      ) {
        triggerCollectionListener(listener);
      }
    } else {
      if (changedPath === listener.path) {
        triggerDocListener(listener);
      }
    }
  });
}

function triggerDocListener(listener: MockListener) {
  const dbState = getMockDB();
  const data = dbState[listener.path];
  
  listener.callback({
    exists: () => data !== undefined,
    data: () => data ? JSON.parse(JSON.stringify(data)) : null,
    id: listener.path.split('/').pop() || '',
  });
}

function triggerCollectionListener(listener: MockListener) {
  const dbState = getMockDB();
  const docs: any[] = [];
  
  Object.keys(dbState).forEach(path => {
    if (
      path.startsWith(listener.path + '/') && 
      path.split('/').length === listener.path.split('/').length + 1
    ) {
      docs.push({
        id: path.split('/').pop() || '',
        data: () => JSON.parse(JSON.stringify(dbState[path])),
      });
    }
  });

  // Sort by createdAt descending by default to match military logs & sandboxes
  docs.sort((a, b) => {
    const timeA = a.data().createdAt ? new Date(a.data().createdAt).getTime() : 0;
    const timeB = b.data().createdAt ? new Date(b.data().createdAt).getTime() : 0;
    return timeB - timeA;
  });

  listener.callback({
    docs,
    forEach: (cb: any) => docs.forEach(cb),
    size: docs.length,
    empty: docs.length === 0,
  });
}

// -------------------------------------------------------------
// LOCAL STATE OBSERVERS FOR OFFLINE AUTHENTICATION
// -------------------------------------------------------------
const mockAuthListeners: ((user: any) => void)[] = [];

export function getMockCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function setMockCurrentUser(user: any) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_ADMIN_MODE);
    }
  } catch (_) {}
  
  mockAuthListeners.forEach(cb => cb(user));
}

// -------------------------------------------------------------
// INITIALIZE OR MOCK INTERFACES
// -------------------------------------------------------------
let resolvedApp: any = null;
let resolvedDb: any = null;
let resolvedAuth: any = null;

if (!isMockMode()) {
  try {
    resolvedApp = initializeApp(firebaseConfig);
    resolvedDb = getRealFirestore(resolvedApp, firebaseConfig.firestoreDatabaseId);
    resolvedAuth = getRealAuth(resolvedApp);
  } catch (e) {
    console.warn('Real Firebase initialization failed. Falling back to Mock Systems:', e);
  }
}

export const db = resolvedDb || { type: 'mock_db' };
export const auth = resolvedAuth || {
  type: 'mock_auth',
  get currentUser() {
    return getMockCurrentUser();
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    mockAuthListeners.push(callback);
    callback(getMockCurrentUser());
    return () => {
      const idx = mockAuthListeners.indexOf(callback);
      if (idx !== -1) mockAuthListeners.splice(idx, 1);
    };
  }
};

// -------------------------------------------------------------
// HYBRID FIREBASE AUTH DIRECT PRIMITIVES
// -------------------------------------------------------------
export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  // Always register in local mock listeners in case we toggle forceMock later!
  mockAuthListeners.push(callback);
  
  let unsubscribeReal: (() => void) | null = null;
  if (!isMockMode() && authInstance.type !== 'mock_auth') {
    unsubscribeReal = realOnAuthStateChanged(authInstance, (user) => {
      // Only notify callback if we are not forced into mock mode
      if (!isMockMode()) {
        callback(user);
      }
    });
  } else {
    // Notify with current mock user synchronously
    callback(getMockCurrentUser());
  }

  return () => {
    const idx = mockAuthListeners.indexOf(callback);
    if (idx !== -1) mockAuthListeners.splice(idx, 1);
    if (unsubscribeReal) unsubscribeReal();
  };
}

export async function loginWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  if (isMockMode() || authInstance.type === 'mock_auth') {
    const raw = localStorage.getItem('dynasty_mock_users') || '{}';
    const users = JSON.parse(raw);
    if (!users[email] || users[email].pass !== pass) {
      const err: any = new Error('兵籍名册查实无此人，或密匙勘误');
      err.code = 'auth/invalid-credential';
      throw err;
    }
    setMockCurrentUser(users[email].user);
    return { user: users[email].user };
  }
  try {
    return await realSignInWithEmailAndPassword(authInstance, email, pass);
  } catch (err: any) {
    if (err && (
      err.code === 'auth/admin-restricted-operation' || 
      err.code === 'auth/operation-not-allowed' ||
      String(err.message).includes('admin-restricted-operation')
    )) {
      forceMock = true;
      return loginWithEmailAndPassword(authInstance, email, pass);
    }
    throw err;
  }
}

export async function registerWithEmailAndPassword(authInstance: any, email: string, pass: string, displayName: string) {
  if (isMockMode() || authInstance.type === 'mock_auth') {
    const raw = localStorage.getItem('dynasty_mock_users') || '{}';
    const users = JSON.parse(raw);
    if (users[email]) {
      const err: any = new Error('此雅号已被册封，请更换');
      err.code = 'auth/email-already-in-use';
      throw err;
    }
    const uid = 'mock_cur_' + Math.random().toString(36).substring(2, 11);
    const mockUser = {
      uid,
      displayName,
      isAnonymous: false,
      email,
      emailVerified: true,
    };
    users[email] = { pass, user: mockUser };
    localStorage.setItem('dynasty_mock_users', JSON.stringify(users));
    setMockCurrentUser(mockUser);
    return { user: mockUser };
  }
  
  try {
    const cred = await realCreateUserWithEmailAndPassword(authInstance, email, pass);
    await realUpdateProfile(cred.user, { displayName });
    return cred;
  } catch (err: any) {
    if (err && (
      err.code === 'auth/admin-restricted-operation' || 
      err.code === 'auth/operation-not-allowed' ||
      String(err.message).includes('admin-restricted-operation')
    )) {
      forceMock = true;
      return registerWithEmailAndPassword(authInstance, email, pass, displayName);
    }
    throw err;
  }
}

export async function signInAnonymously(authInstance: any) {
  if (isMockMode() || authInstance.type === 'mock_auth') {
    const uid = 'mock_cur_' + Math.random().toString(36).substring(2, 11);
    const mockUser = {
      uid,
      displayName: '布衣策士',
      isAnonymous: true,
      email: null,
      emailVerified: false,
    };
    setMockCurrentUser(mockUser);
    return { user: mockUser };
  }
  
  try {
    return await realSignInAnonymously(authInstance);
  } catch (error: any) {
    // Catch restricted operations errors (like anonymous auth disabled in Firebase Console)
    if (error && (
      error.code === 'auth/admin-restricted-operation' || 
      error.code === 'auth/operation-not-allowed' || 
      String(error.message).includes('admin-restricted-operation') ||
      String(error.message).includes('operation-not-allowed')
    )) {
      console.warn('Real Firebase Anonymous Authentication is disabled/restricted in the Firebase Console. Transparently switching the session to full local sandboxed sandbox-persistence mode...');
      
      // Permanently set forceMock flag for this run/session so we gracefully redirect all resources to localStorage
      forceMock = true;
      
      const uid = 'mock_cur_' + Math.random().toString(36).substring(2, 11);
      const mockUser = {
        uid,
        displayName: '布衣策士',
        isAnonymous: true,
        email: null,
        emailVerified: false,
      };
      setMockCurrentUser(mockUser);
      return { user: mockUser };
    }
    throw error;
  }
}

export async function updateProfile(user: any, profile: { displayName?: string | null }) {
  if (isMockMode() || (user && String(user.uid).startsWith('mock_'))) {
    const updatedUser = {
      ...user,
      displayName: profile.displayName || user.displayName,
    };
    setMockCurrentUser(updatedUser);
    return Promise.resolve();
  }
  return realUpdateProfile(user, profile);
}

export async function signOut(authInstance: any) {
  if (isMockMode() || authInstance.type === 'mock_auth') {
    setMockCurrentUser(null);
    return Promise.resolve();
  }
  try {
    await realSignOut(authInstance);
  } finally {
    // Also reset any forceMock state to allow testing of authentication on subsequent trials
    forceMock = false;
    setMockCurrentUser(null);
  }
}

export async function loginWithGoogle() {
  if (isMockMode()) {
    throw new Error('Google Login unavailable in offline sandbox mode.');
  }
  const provider = new RealGoogleAuthProvider();
  const result = await realSignInWithPopup(resolvedAuth, provider);
  return result.user;
}

// -------------------------------------------------------------
// HYBRID FIRESTORE HELPERS & SHAPES
// -------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuthUser = isMockMode() ? getMockCurrentUser() : auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid,
      email: currentAuthUser?.email,
      emailVerified: currentAuthUser?.emailVerified,
      isAnonymous: currentAuthUser?.isAnonymous,
      tenantId: currentAuthUser?.tenantId,
      providerInfo: currentAuthUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Standard helper replacement for local sandboxing anonymous access
export async function loginAnonymously(customName: string) {
  try {
    const cred = await signInAnonymously(auth);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: customName });
    }
    return cred.user;
  } catch (error) {
    console.error('Unified Auth entry failed:', error);
    throw error;
  }
}

// Dynamic Mock/Real Doc and Collection factory paths
export function doc(databaseRef: any, ...segments: string[]) {
  if (isMockMode() || databaseRef.type === 'mock_db') {
    return {
      type: 'mock_doc_ref',
      path: segments.join('/'),
      id: segments[segments.length - 1],
    };
  }
  return (realDoc as any)(databaseRef, ...segments);
}

export function collection(databaseRef: any, ...segments: string[]) {
  if (isMockMode() || databaseRef.type === 'mock_db') {
    return {
      type: 'mock_col_ref',
      path: segments.join('/'),
    };
  }
  return (realCollection as any)(databaseRef, ...segments);
}

export function query(colRef: any, ...constraints: any[]) {
  if (isMockMode() || colRef.type === 'mock_col_ref') {
    // Return mock query reference
    return {
      type: 'mock_query_ref',
      path: colRef.path,
    };
  }
  return (realQuery as any)(colRef, ...constraints);
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  if (isMockMode()) {
    return { type: 'mock_order_by', field, direction };
  }
  return realOrderBy(field, direction);
}

export function limit(value: number) {
  if (isMockMode()) {
    return { type: 'mock_limit', value };
  }
  return realLimit(value);
}

export function serverTimestamp() {
  if (isMockMode()) {
    return new Date().toISOString();
  }
  return realServerTimestamp();
}

// -------------------------------------------------------------
// READS & WRITES GRACEFUL FALLBACK EXECUTION
// -------------------------------------------------------------
export async function setDoc(docRef: any, data: any, options?: any) {
  if (isMockMode() || docRef.type === 'mock_doc_ref') {
    const dbState = getMockDB();
    const existing = dbState[docRef.path] || {};
    
    // Merge if merge flag set
    dbState[docRef.path] = (options && options.merge) 
      ? { ...existing, ...data } 
      : { ...data };
      
    saveMockDB(dbState);
    notifyMockListeners(docRef.path);
    return Promise.resolve();
  }
  return realSetDoc(docRef, data, options);
}

export async function updateDoc(docRef: any, data: any) {
  if (isMockMode() || docRef.type === 'mock_doc_ref') {
    const dbState = getMockDB();
    const existing = dbState[docRef.path] || {};
    
    dbState[docRef.path] = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    saveMockDB(dbState);
    notifyMockListeners(docRef.path);
    return Promise.resolve();
  }
  return realUpdateDoc(docRef, data);
}

export async function addDoc(collectionRef: any, data: any) {
  if (isMockMode() || collectionRef.type === 'mock_col_ref') {
    const id = 'mock_id_' + Math.random().toString(36).substring(2, 11);
    const path = `${collectionRef.path}/${id}`;
    const dbState = getMockDB();
    
    dbState[path] = {
      id,
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    saveMockDB(dbState);
    notifyMockListeners(path);
    return Promise.resolve({ id, path, type: 'mock_doc_ref' });
  }
  return realAddDoc(collectionRef, data);
}

export async function deleteDoc(docRef: any) {
  if (isMockMode() || docRef.type === 'mock_doc_ref') {
    const dbState = getMockDB();
    if (dbState[docRef.path] !== undefined) {
      delete dbState[docRef.path];
      saveMockDB(dbState);
      notifyMockListeners(docRef.path);
    }
    return Promise.resolve();
  }
  return realDeleteDoc(docRef);
}

export async function getDoc(docRef: any) {
  if (isMockMode() || docRef.type === 'mock_doc_ref') {
    const dbState = getMockDB();
    const data = dbState[docRef.path];
    return Promise.resolve({
      exists: () => data !== undefined,
      data: () => data ? JSON.parse(JSON.stringify(data)) : null,
      id: docRef.id,
    });
  }
  return realGetDoc(docRef);
}

export async function getDocs(ref: any) {
  if (isMockMode() || ref.type === 'mock_col_ref' || ref.type === 'mock_query_ref') {
    const dbState = getMockDB();
    const docs: any[] = [];
    
    Object.keys(dbState).forEach(path => {
      if (
        path.startsWith(ref.path + '/') && 
        path.split('/').length === ref.path.split('/').length + 1
      ) {
        docs.push({
          id: path.split('/').pop() || '',
          data: () => JSON.parse(JSON.stringify(dbState[path])),
        });
      }
    });

    // Default sorting
    docs.sort((a, b) => {
      const timeA = a.data().createdAt ? new Date(a.data().createdAt).getTime() : 0;
      const timeB = b.data().createdAt ? new Date(b.data().createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return Promise.resolve({
      docs,
      forEach: (cb: any) => docs.forEach(cb),
      size: docs.length,
      empty: docs.length === 0,
    });
  }
  return realGetDocs(ref);
}

export function onSnapshot(ref: any, callback: any, errorCallback?: any) {
  if (isMockMode() || ref.type === 'mock_doc_ref' || ref.type === 'mock_col_ref' || ref.type === 'mock_query_ref') {
    const id = 'listener_' + Math.random().toString(36).substring(2, 11);
    const listener: MockListener = {
      id,
      path: ref.path,
      isCollection: ref.type === 'mock_col_ref' || ref.type === 'mock_query_ref',
      callback,
    };
    
    mockListeners.push(listener);
    
    // Trigger callback synchronously with current state
    try {
      if (listener.isCollection) {
        triggerCollectionListener(listener);
      } else {
        triggerDocListener(listener);
      }
    } catch (e) {
      if (errorCallback) errorCallback(e);
    }
    
    // Return unsubscribe callback
    return () => {
      const idx = mockListeners.findIndex(l => l.id === id);
      if (idx !== -1) {
        mockListeners.splice(idx, 1);
      }
    };
  }
  return realOnSnapshot(ref, callback, errorCallback);
}
