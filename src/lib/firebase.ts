/**
 * Firebase client. The config below is public by design (it identifies the project, not a secret);
 * all access control lives in firestore.rules — reads are public, writes require an authenticated
 * UID listed in /admins/{uid}.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCA8VlBZ0ACB6cVFNcgyJqjPgd90W3iNrQ',
  authDomain: 'hansan-onf.firebaseapp.com',
  projectId: 'hansan-onf',
  storageBucket: 'hansan-onf.firebasestorage.app',
  messagingSenderId: '145503905532',
  appId: '1:145503905532:web:bcf9b74a567752c1039979',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
