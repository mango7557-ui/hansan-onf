/**
 * One-time seed: copies src/data/site.js into Firestore so the admin panel has content to edit.
 * Auth: reuses the Firebase CLI's OAuth token (firebase login) — no service-account JSON on disk.
 * Idempotent: re-running overwrites with the same values. Pass --force to overwrite admin-edited docs.
 *
 *   node scripts/seed-firestore.mjs            # seeds only missing docs
 *   node scripts/seed-firestore.mjs --force    # overwrites everything
 */
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { company, products, faqs } from '../src/data/site.js';
import { homeDefaults } from '../src/data/content.ts';

const PROJECT = 'hansan-onf';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const force = process.argv.includes('--force');

const cfg = JSON.parse(await readFile(path.join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
const token = cfg.tokens?.access_token;
if (!token) { console.error('Run `firebase login` first.'); process.exit(1); }
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

// JS value → Firestore REST "Value"
const toValue = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
  throw new Error(`Unsupported value: ${typeof v}`);
};

async function exists(docPath) {
  const r = await fetch(`${BASE}/${docPath}`, { headers });
  return r.status === 200;
}
async function put(docPath, data) {
  if (!force && await exists(docPath)) { console.log('  skip (exists)', docPath); return; }
  const r = await fetch(`${BASE}/${docPath}`, { method: 'PATCH', headers, body: JSON.stringify({ fields: toValue(data).mapValue.fields }) });
  if (!r.ok) throw new Error(`${docPath}: ${r.status} ${await r.text()}`);
  console.log('  wrote', docPath);
}

console.log('Seeding Firestore for', PROJECT, force ? '(force)' : '');

// /site/company
await put('site/company', { ...company, updatedAt: new Date().toISOString() });

// /site/home — editable hero + intro copy (defaults mirror index.astro)
await put('site/home', { ...homeDefaults, updatedAt: new Date().toISOString() });

// /products/{slug}
for (const [i, p] of products.entries()) await put(`products/${p.slug}`, { ...p, order: i, updatedAt: new Date().toISOString() });

// /faqs/{index}
for (const [i, f] of faqs.entries()) await put(`faqs/${String(i).padStart(2, '0')}`, { ...f, order: i, updatedAt: new Date().toISOString() });

console.log('Done.');
