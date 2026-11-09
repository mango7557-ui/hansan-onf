import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, where, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const status = $('#status');
const say = (msg: string, error = false) => { status.textContent = msg; status.dataset.error = String(error); if (!error) setTimeout(() => { if (status.textContent === msg) status.textContent = ''; }, 4000); };
const fail = (e: unknown) => { console.error(e); const code = (e as any)?.code ?? ''; say(humanize(code) || `오류: ${(e as Error).message}`, true); };
function humanize(code: string) {
  return ({
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/too-many-requests': '시도 횟수가 많습니다. 잠시 후 다시 시도하세요.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
    'auth/requires-recent-login': '보안을 위해 다시 로그인한 뒤 변경하세요.',
    'permission-denied': '권한이 없습니다. 이 계정은 관리자로 등록되어 있지 않습니다.',
  } as Record<string, string>)[code] ?? '';
}

// ── Auth gate ────────────────────────────────────────────────────────────
const loginView = $('#login'), appView = $('#app');
onAuthStateChanged(auth, async (user) => {
  if (!user) { loginView.hidden = false; appView.hidden = true; return; }
  // Confirm admin membership before showing the UI (rules enforce it anyway; this gives a clear message).
  const isAdmin = (await getDoc(doc(db, 'admins', user.uid))).exists();
  if (!isAdmin) { say('이 계정은 관리자로 등록되어 있지 않습니다.', true); await signOut(auth); return; }
  loginView.hidden = true; appView.hidden = false;
  $('#user-email').textContent = user.email ?? '';
  await Promise.all([loadInquiries(), loadHome(), loadProducts(), loadFaqs(), loadCompany()]);
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#login-error'); err.textContent = '';
  try { await signInWithEmailAndPassword(auth, $<HTMLInputElement>('#login-email').value.trim(), $<HTMLInputElement>('#login-password').value); }
  catch (ex) { err.textContent = humanize((ex as any).code) || '로그인에 실패했습니다.'; }
});
$('#logout').addEventListener('click', () => signOut(auth));

// ── Tabs ─────────────────────────────────────────────────────────────────
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.admin-tabs [role=tab]'));
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); document.getElementById(t.getAttribute('aria-controls')!)!.hidden = !on; });
  history.replaceState(null, '', `#${tab.id.replace('tab-', '')}`);
}));
const initial = tabs.find((t) => t.id === `tab-${location.hash.slice(1)}`); if (initial) initial.click();

// ── Helpers ──────────────────────────────────────────────────────────────
const fill = (form: HTMLFormElement, data: Record<string, any>) => { for (const [k, v] of Object.entries(data)) { const el = form.elements.namedItem(k) as HTMLInputElement | null; if (el) el.value = Array.isArray(v) ? v.join(', ') : (v ?? ''); } };
const collect = (form: HTMLFormElement) => Object.fromEntries(Array.from(new FormData(form).entries()).map(([k, v]) => [k, String(v).trim()]));
const busy = (form: HTMLFormElement, on: boolean) => { const b = form.querySelector<HTMLButtonElement>('button[type=submit]'); if (b) { b.disabled = on; b.textContent = on ? '저장 중…' : (b.dataset.label ??= b.textContent!); } };

// ── 메인 문구 ─────────────────────────────────────────────────────────────
const formHome = $<HTMLFormElement>('#form-home');
async function loadHome() { const snap = await getDoc(doc(db, 'site', 'home')); if (snap.exists()) fill(formHome, snap.data()); }
formHome.addEventListener('submit', async (e) => { e.preventDefault(); busy(formHome, true); try { await setDoc(doc(db, 'site', 'home'), { ...collect(formHome), updatedAt: serverTimestamp() }, { merge: true }); say('메인 문구를 저장했습니다.'); } catch (ex) { fail(ex); } finally { busy(formHome, false); } });

// ── 회사 정보 ─────────────────────────────────────────────────────────────
const formCompany = $<HTMLFormElement>('#form-company');
async function loadCompany() { const snap = await getDoc(doc(db, 'site', 'company')); if (snap.exists()) fill(formCompany, snap.data()); }
formCompany.addEventListener('submit', async (e) => { e.preventDefault(); busy(formCompany, true); try { await setDoc(doc(db, 'site', 'company'), { ...collect(formCompany), updatedAt: serverTimestamp() }, { merge: true }); say('회사 정보를 저장했습니다.'); } catch (ex) { fail(ex); } finally { busy(formCompany, false); } });

// ── 제품 ─────────────────────────────────────────────────────────────────
const productList = $('#product-list'), formProduct = $<HTMLFormElement>('#form-product');
let products: Record<string, any>[] = [];
async function loadProducts() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('order')));
  products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  productList.innerHTML = products.map((p) => `<li role="option" data-slug="${p.id}" aria-selected="false"><span>${p.name}</span><small>${p.id}</small></li>`).join('');
  productList.querySelectorAll<HTMLLIElement>('li').forEach((li) => li.addEventListener('click', () => selectProduct(li.dataset.slug!)));
}
function selectProduct(slug: string) {
  const p = products.find((x) => x.id === slug); if (!p) return;
  productList.querySelectorAll('li').forEach((li) => li.setAttribute('aria-selected', String(li.getAttribute('data-slug') === slug)));
  formProduct.hidden = false; fill(formProduct, { ...p, slug });
}
formProduct.addEventListener('submit', async (e) => {
  e.preventDefault(); busy(formProduct, true);
  try {
    const data = collect(formProduct); const slug = data.slug; delete data.slug;
    const payload = { ...data, use: data.use.split(',').map((s) => s.trim()).filter(Boolean), updatedAt: serverTimestamp() };
    await updateDoc(doc(db, 'products', slug), payload);
    say(`${data.name} 정보를 저장했습니다.`); await loadProducts(); selectProduct(slug);
  } catch (ex) { fail(ex); } finally { busy(formProduct, false); }
});

// ── FAQ ──────────────────────────────────────────────────────────────────
const faqList = $('#faq-list');
let faqs: Record<string, any>[] = [];
async function loadFaqs() {
  const snap = await getDocs(query(collection(db, 'faqs'), orderBy('order')));
  faqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderFaqs();
}
function renderFaqs() {
  if (!faqs.length) { faqList.innerHTML = '<div class="empty">등록된 질문이 없습니다.</div>'; return; }
  faqList.innerHTML = faqs.map((f, i) => `
    <article class="faq-item" data-id="${f.id}">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <div>
        <div class="form-field"><label for="q-${f.id}">질문</label><input id="q-${f.id}" name="q" value="${esc(f.q)}" maxlength="120"/></div>
        <div class="form-field"><label for="a-${f.id}">답변</label><textarea id="a-${f.id}" name="a" rows="3" maxlength="600">${esc(f.a)}</textarea></div>
      </div>
      <div class="controls">
        <button type="button" data-act="up" aria-label="위로" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-act="down" aria-label="아래로" ${i === faqs.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" data-act="delete" class="danger" aria-label="삭제">✕</button>
      </div>
      <div class="save-row"><button type="button" class="button small" data-act="save">저장</button></div>
    </article>`).join('');
  faqList.querySelectorAll<HTMLElement>('.faq-item').forEach((item) => {
    item.querySelectorAll('input,textarea').forEach((el) => el.addEventListener('input', () => item.classList.add('is-dirty')));
    item.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => b.addEventListener('click', () => faqAction(item.dataset.id!, b.dataset.act!, item)));
  });
}
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
async function faqAction(id: string, act: string, item: HTMLElement) {
  const i = faqs.findIndex((f) => f.id === id);
  try {
    if (act === 'save') {
      const q = item.querySelector<HTMLInputElement>('[name=q]')!.value.trim(), a = item.querySelector<HTMLTextAreaElement>('[name=a]')!.value.trim();
      if (!q || !a) return say('질문과 답변을 모두 입력하세요.', true);
      await updateDoc(doc(db, 'faqs', id), { q, a, updatedAt: serverTimestamp() }); item.classList.remove('is-dirty'); say('질문을 저장했습니다.');
    } else if (act === 'delete') {
      if (!confirm('이 질문을 삭제할까요?')) return;
      await deleteDoc(doc(db, 'faqs', id)); await loadFaqs(); say('질문을 삭제했습니다.');
    } else if (act === 'up' || act === 'down') {
      const j = act === 'up' ? i - 1 : i + 1; if (j < 0 || j >= faqs.length) return;
      await Promise.all([updateDoc(doc(db, 'faqs', faqs[i].id), { order: j }), updateDoc(doc(db, 'faqs', faqs[j].id), { order: i })]);
      await loadFaqs();
    }
  } catch (ex) { fail(ex); }
}
$('#faq-add').addEventListener('click', async () => {
  try { const id = `f${Date.now()}`; await setDoc(doc(db, 'faqs', id), { q: '새 질문', a: '답변을 입력하세요.', order: faqs.length, updatedAt: serverTimestamp() }); await loadFaqs(); say('질문을 추가했습니다. 내용을 수정한 뒤 저장하세요.'); document.getElementById(`q-${id}`)?.focus(); } catch (ex) { fail(ex); }
});

// ── 문의 접수 ────────────────────────────────────────────────────────────
const inquiryList = $('#inquiry-list'), filter = $<HTMLSelectElement>('#inquiry-filter');
const typeLabel: Record<string, string> = { supply: '제품 구매·납품', oem: 'OEM·ODM', distribution: '유통·수거', quality: '품질 자료', other: '기타' };
const productLabel = (slug: string) => products.find((p) => p.id === slug)?.name ?? (slug === 'consult' ? '상담 후 결정' : slug || '-');
async function loadInquiries() {
  const f = filter.value;
  const base = collection(db, 'inquiries');
  const q = f === 'all' ? query(base, orderBy('createdAt', 'desc'), limit(100)) : query(base, where('status', '==', f), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  const newCount = (await getDocs(query(base, where('status', '==', 'new')))).size;
  const badge = $('#inquiry-badge'); badge.textContent = String(newCount); badge.hidden = newCount === 0;
  if (snap.empty) { inquiryList.innerHTML = `<div class="empty">${f === 'new' ? '새 문의가 없습니다.' : '해당 상태의 문의가 없습니다.'}</div>`; return; }
  inquiryList.innerHTML = snap.docs.map((d) => { const x = d.data(); const t = x.createdAt?.toDate?.() as Date | undefined; return `
    <article class="inquiry" data-status="${x.status}" data-id="${d.id}">
      <div>
        <div class="head"><strong>${esc(x.company)}</strong><span>${esc(x.name)}</span><span class="type">${typeLabel[x.type] ?? x.type}</span>${t ? `<time datetime="${t.toISOString()}">${t.toLocaleString('ko-KR')}</time>` : ''}</div>
        <div class="meta"><a href="tel:${esc(x.phone)}">${esc(x.phone)}</a>${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : ''}<span>제품: ${esc(productLabel(x.product))}</span>${x.quantity ? `<span>사용량: ${esc(x.quantity)}</span>` : ''}${x.region ? `<span>지역: ${esc(x.region)}</span>` : ''}</div>
      </div>
      <div class="side"><select aria-label="처리 상태"><option value="new" ${x.status === 'new' ? 'selected' : ''}>새 문의</option><option value="in-progress" ${x.status === 'in-progress' ? 'selected' : ''}>상담 중</option><option value="done" ${x.status === 'done' ? 'selected' : ''}>완료</option></select><span class="id">${d.id}</span></div>
      <div class="message">${esc(x.message)}</div>
    </article>`; }).join('');
  inquiryList.querySelectorAll<HTMLSelectElement>('.inquiry select').forEach((sel) => sel.addEventListener('change', async () => {
    const item = sel.closest<HTMLElement>('.inquiry')!;
    try { await updateDoc(doc(db, 'inquiries', item.dataset.id!), { status: sel.value, updatedAt: serverTimestamp() }); item.dataset.status = sel.value; say('상태를 변경했습니다.'); loadInquiries(); } catch (ex) { fail(ex); }
  }));
}
filter.addEventListener('change', loadInquiries);
$('#inquiry-refresh').addEventListener('click', loadInquiries);

// ── 비밀번호 변경 ─────────────────────────────────────────────────────────
const formPw = $<HTMLFormElement>('#form-password');
formPw.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cur = $<HTMLInputElement>('#pw-current').value, nw = $<HTMLInputElement>('#pw-new').value, cf = $<HTMLInputElement>('#pw-confirm').value;
  if (nw !== cf) return say('새 비밀번호가 서로 다릅니다.', true);
  if (nw.length < 6) return say('비밀번호는 6자 이상이어야 합니다.', true);
  const user = auth.currentUser as User;
  busy(formPw, true);
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email!, cur));
    await updatePassword(user, nw);
    formPw.reset(); say('비밀번호를 변경했습니다.');
  } catch (ex) { fail(ex); } finally { busy(formPw, false); }
});
