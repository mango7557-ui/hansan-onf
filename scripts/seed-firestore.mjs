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
await put('site/home', {
  heroKicker: '충남 천안에서 만드는 식물성 유지',
  heroTitle: '좋은 요리는\n좋은 기름에서\n시작됩니다.',
  heroLede: '한산오앤에프는 업소용 식용유를 만들고, 외식 브랜드에 맞는 전용유를 개발해 전국으로 공급합니다. 튀김의 식감부터 주방의 일관성까지, 기름이 바꾸는 차이를 함께 만듭니다.',
  introTitle: '기름은 재료 뒤에 숨어 있지만,\n맛의 차이는 가장 먼저 드러납니다.',
  introBody: '튀김이 얼마나 바삭한지, 재료의 풍미가 얼마나 살아 있는지, 매일 같은 맛이 나오는지. 그 많은 부분이 어떤 기름을 쓰느냐에 달려 있습니다.\n\n한산오앤에프는 식물성 유지를 직접 제조·소분하고, 브랜드의 조리 방식에 맞는 전용유를 개발하며, 천안 공장을 거점으로 전국에 공급합니다. 2023년에 시작해 외식 프랜차이즈, 식자재 유통사, 급식 현장과 함께하고 있습니다.',
  closingTitle: '어떤 기름이 필요한지 이야기해 주세요. 제품과 공급 조건을 함께 찾겠습니다.',
  updatedAt: new Date().toISOString(),
});

// /products/{slug}
for (const [i, p] of products.entries()) await put(`products/${p.slug}`, { ...p, order: i, updatedAt: new Date().toISOString() });

// /faqs/{index}
for (const [i, f] of faqs.entries()) await put(`faqs/${String(i).padStart(2, '0')}`, { ...f, order: i, updatedAt: new Date().toISOString() });

console.log('Done.');
