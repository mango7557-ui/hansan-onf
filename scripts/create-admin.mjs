/**
 * Creates the admin login and registers its UID in /admins so Firestore rules grant write access.
 * Requires Firebase Authentication to be enabled in the console first (one-time click).
 *
 *   node scripts/create-admin.mjs                       # admin@hansan-onf.kr / 1234
 *   node scripts/create-admin.mjs you@company.kr pass   # custom
 */
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const API_KEY = 'AIzaSyCA8VlBZ0ACB6cVFNcgyJqjPgd90W3iNrQ';
const PROJECT = 'hansan-onf';
const [email = 'admin@hansan-onf.kr', password = '1234'] = process.argv.slice(2);

// 1) Create (or sign in to) the account with the public web API key.
const signUp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then((r) => r.json());
let uid = signUp.localId;
if (!uid) {
  if (signUp.error?.message === 'CONFIGURATION_NOT_FOUND') { console.error('\nFirebase Authentication is not enabled yet.\nOpen https://console.firebase.google.com/project/hansan-onf/authentication → 시작하기 → 이메일/비밀번호 → 사용 설정, then re-run.\n'); process.exit(2); }
  if (signUp.error?.message === 'EMAIL_EXISTS') {
    const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then((r) => r.json());
    uid = signIn.localId; if (!uid) { console.error('Account exists but password did not match:', signIn.error?.message); process.exit(1); }
    console.log('Account already exists; using it.');
  } else { console.error('Sign-up failed:', signUp.error?.message); process.exit(1); }
} else console.log('Created account', email);

// 2) Register UID in /admins/{uid} with the CLI's OAuth token (rules forbid client writes here).
const cfg = JSON.parse(await readFile(path.join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/admins/${uid}`, { method: 'PATCH', headers: { Authorization: `Bearer ${cfg.tokens.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { email: { stringValue: email }, createdAt: { timestampValue: new Date().toISOString() } } }) });
if (!r.ok) { console.error('Failed to register admin:', r.status, await r.text()); process.exit(1); }
console.log(`Registered ${uid} as admin.\n\n관리자 페이지: https://${PROJECT}.web.app/admin/\n이메일: ${email}\n비밀번호: ${password}  ← 로그인 후 '계정' 탭에서 변경하세요.`);
