/**
 * Pointer interactions — built against greensock/gsap-skills (gsap-core, gsap-performance).
 *
 * Rules applied from the skill:
 *  - gsap.quickTo() for every value driven by mousemove (reuses one tween; no per-frame allocation)
 *  - transform aliases only (x, y, scale, rotationX/Y) — compositor-friendly
 *  - gsap.matchMedia() gates everything on (pointer:fine) AND (prefers-reduced-motion: no-preference);
 *    when either stops matching, GSAP reverts all tweens created inside automatically
 *  - will-change set in CSS only on elements that actually animate
 *
 * Four layers, each small:
 *  1. Cursor halo   — soft amber ring that trails the pointer; grows over interactive targets
 *  2. Magnetic      — buttons & links lean toward the pointer within their padding box
 *  3. Tilt          — product/visual cards rotate subtly toward the pointer (3D)
 *  4. Hero spotlight — the amber glow behind the oil follows the pointer
 */
import gsap from 'gsap';

const mm = gsap.matchMedia();

mm.add(
  {
    fine: '(pointer: fine)',
    motionOk: '(prefers-reduced-motion: no-preference)',
  },
  (ctx) => {
    const { fine, motionOk } = ctx.conditions as { fine: boolean; motionOk: boolean };
    if (!fine || !motionOk) return;

    document.documentElement.classList.add('has-pointer-fx');

    // ── 1. Cursor halo ──────────────────────────────────────────────
    const halo = document.createElement('div');
    halo.className = 'cursor-halo';
    halo.setAttribute('aria-hidden', 'true');
    document.body.appendChild(halo);

    const haloX = gsap.quickTo(halo, 'x', { duration: 0.45, ease: 'power3', overwrite: false });
    const haloY = gsap.quickTo(halo, 'y', { duration: 0.45, ease: 'power3', overwrite: false });
    // scale is a discrete state (idle ↔ over-interactive), not a continuous stream → plain gsap.to with
    // overwrite:'auto' so only the scale channel is replaced and x/y quickTo tweens keep running.
    const haloScale = (v: number) => gsap.to(halo, { scale: v, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    // quickTo only drives single numeric properties — autoAlpha is compound, so animate opacity
    // and keep the element display:block (pointer-events:none in CSS so it never blocks clicks).
    const haloAlpha = gsap.quickTo(halo, 'opacity', { duration: 0.25, ease: 'power2.out', overwrite: false });

    gsap.set(halo, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.6 });

    let haloVisible = false;
    const interactive = 'a, button, [role="tab"], summary, input, select, textarea, label';

    let lastTarget: Element | null = null;
    const updateState = (el: Element | null) => {
      if (el === lastTarget) return;
      lastTarget = el;
      const target = el?.closest(interactive) ?? null;
      const dark = el?.closest('.dark, .hero, .page-hero, .footer, .closing') ?? null;
      halo.classList.toggle('on-dark', !!dark);
      halo.classList.toggle('is-active', !!target);
      haloScale(target ? 1.6 : 1);
    };
    const onMove = (e: PointerEvent) => {
      haloX(e.clientX);
      haloY(e.clientY);
      if (!haloVisible) { haloVisible = true; haloAlpha(1); }
      updateState(e.target as Element);
    };
    const onLeave = () => { haloVisible = false; haloAlpha(0); };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    // ── 2. Magnetic buttons ─────────────────────────────────────────
    // Each element gets its own quickTo pair; pull is capped to a fraction of its size.
    document.querySelectorAll<HTMLElement>('.button, .header-contact, .hero-video-toggle, .back-top, .collection-tabs [role="tab"], .filter-button').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3', overwrite: false });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3', overwrite: false });
      const strength = el.matches('.hero-video-toggle, .back-top') ? 0.45 : 0.25;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });

    // ── 3. Card tilt ────────────────────────────────────────────────
    document.querySelectorAll<HTMLElement>('.product-card, .guide-cover, .collection-visual, .detail-visual').forEach((card) => {
      const art = card.querySelector<HTMLElement>('.product-art') ?? card;
      gsap.set(art, { transformPerspective: 900, transformOrigin: 'center' });
      const rx = gsap.quickTo(art, 'rotationX', { duration: 0.6, ease: 'power3', overwrite: false });
      const ry = gsap.quickTo(art, 'rotationY', { duration: 0.6, ease: 'power3', overwrite: false });
      const sc = gsap.quickTo(art, 'scale', { duration: 0.6, ease: 'power3', overwrite: false });
      const max = 6; // degrees
      card.addEventListener('pointermove', (e) => {
        const r = art.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * max * 2);
        rx(-py * max * 2);
        sc(1.015);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); sc(1); });
    });

    // ── 4. Hero spotlight ───────────────────────────────────────────
    const hero = document.querySelector<HTMLElement>('.hero');
    const glow = document.querySelector<HTMLElement>('.hero-glow');
    if (hero && glow) {
      // Pause the CSS drift so the pointer owns the position while hovering.
      const gx = gsap.quickTo(glow, 'xPercent', { duration: 1.2, ease: 'power2.out', overwrite: false });
      const gy = gsap.quickTo(glow, 'yPercent', { duration: 1.2, ease: 'power2.out', overwrite: false });
      hero.addEventListener('pointerenter', () => glow.classList.add('is-tracking'));
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        gx(((e.clientX - r.left) / r.width - 0.5) * 22);
        gy(((e.clientY - r.top) / r.height - 0.5) * 22);
      });
      hero.addEventListener('pointerleave', () => { glow.classList.remove('is-tracking'); gx(0); gy(0); });
    }

    // matchMedia reverts all tweens automatically; we only need to remove our own DOM/listeners.
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      halo.remove();
      document.documentElement.classList.remove('has-pointer-fx');
    };
  }
);
