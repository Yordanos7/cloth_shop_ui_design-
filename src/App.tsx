import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CartItem,
  GARMENTS,
  INITIAL_CART,
  RAIL_SEQUENCE,
  SizeOption,
  TAG_ANGLES,
  formatMoney,
  getCropStyle,
} from './data/catalog';
import { preloadAllSheets } from './utils/sheets';
import { QuickView, QuickViewLayout } from './components/QuickView';
import { CartDrawer } from './components/CartDrawer';

const HEADLINE_WORDS = ['Silhouettes', 'that', 'hang', 'right.'];

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

interface RailMetrics {
  u: number;
  isMobile: boolean;
  railTop: number;
  railSag: number;
  gap: number;
  gs: number;
  start: number;
}

export default function App() {
  const [u, setU] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    return w <= 820 ? Math.min(w / 390, h / 780) : Math.min(w / 1440, h / 900);
  });
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 820 : false,
  );
  const [isTouchEnv, setIsTouchEnv] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: none)').matches
      : false,
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoveredIdxRef = useRef<number | null>(null);
  hoveredIdxRef.current = hoveredIdx;

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Quick-view state
  const [qvPiece, setQvPiece] = useState<{ index: number; k: number } | null>(
    null,
  );
  const [qvOpen, setQvOpen] = useState(false);
  const [qvView, setQvView] = useState<'front' | 'back'>('front');
  const [qvSize, setQvSize] = useState<SizeOption>('S');
  const [qvAdding, setQvAdding] = useState(false);
  const [qvHiddenIndex, setQvHiddenIndex] = useState<number | null>(null);

  const qvOpenRef = useRef(false);
  qvOpenRef.current = qvOpen;
  const qvAddingRef = useRef(false);
  qvAddingRef.current = qvAdding;
  const qvTokenRef = useRef(0);
  const activeQvAnimRef = useRef<Animation | null>(null);
  const pendingSourceRectRef = useRef<DOMRect | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [cartOpen, setCartOpen] = useState(false);
  const cartOpenRef = useRef(false);
  cartOpenRef.current = cartOpen;

  // Search & editorial notice state
  const [searchQuery, setSearchQuery] = useState('');
  const [atelierNotice, setAtelierNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  // DOM Refs for imperative 60fps loop and WAAPI animations
  const pageRef = useRef<HTMLDivElement | null>(null);
  const railZoneRef = useRef<HTMLDivElement | null>(null);
  const railShadowPathRef = useRef<SVGPathElement | null>(null);
  const railTubePathRef = useRef<SVGPathElement | null>(null);
  const railHighlightPathRef = useRef<SVGPathElement | null>(null);
  const progressThumbRef = useRef<HTMLDivElement | null>(null);

  const garmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dropRefs = useRef<(HTMLDivElement | null)[]>([]);
  const swayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sideFaceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontFaceRefs = useRef<(HTMLDivElement | null)[]>([]);

  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const footerLeftRef = useRef<HTMLDivElement | null>(null);
  const progressWrapRef = useRef<HTMLDivElement | null>(null);
  const footerRightRef = useRef<HTMLDivElement | null>(null);

  const qvImgRef = useRef<HTMLDivElement | null>(null);
  const qvFrontFaceRef = useRef<HTMLDivElement | null>(null);
  const qvBackFaceRef = useRef<HTMLDivElement | null>(null);
  const qvInfoRef = useRef<HTMLDivElement | null>(null);

  const bagBtnRef = useRef<HTMLButtonElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const metricsRef = useRef<RailMetrics>({
    u,
    isMobile,
    railTop: isMobile ? 292 : 270,
    railSag: isMobile ? 30 : 74,
    gap: isMobile ? 80 : 121,
    gs: isMobile ? 0.30 : 0.455,
    start: isMobile ? 46 : 113,
  });

  // Scroll & spring physics mutable state
  const scrollRef = useRef({ target: 0, cur: 0, vel: 0 });
  const swayAngleRef = useRef<number[]>(new Array(RAIL_SEQUENCE.length).fill(0));
  const swayVelRef = useRef<number[]>(new Array(RAIL_SEQUENCE.length).fill(0));
  const offsetRef = useRef<number[]>(new Array(RAIL_SEQUENCE.length).fill(0));

  const dragRef = useRef({
    down: false,
    moved: false,
    pointerId: -1,
    pointerType: 'mouse',
    startX: 0,
    startTarget: 0,
    lastX: 0,
    lastT: 0,
    releaseVel: 0,
  });
  const suppressClickRef = useRef(false);
  const lastPointerTypeRef = useRef<string>('mouse');
  const introStartedRef = useRef(false);

  const showNotice = useCallback((msg: string) => {
    setAtelierNotice(msg);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setAtelierNotice(null);
    }, 2800);
  }, []);

  const prefersReducedMotion = useCallback(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  // Sync body classes for quick-view and cart drawer
  useEffect(() => {
    document.body.classList.toggle('qv-open', qvOpen);
  }, [qvOpen]);

  useEffect(() => {
    document.body.classList.toggle('cart-open', cartOpen);
  }, [cartOpen]);

  // Compute --u and read CSS rail variables on mount + resize
  const syncMetrics = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === 0 || h === 0) return;

    const mobile = w <= 820;
    const nextU = mobile
      ? Math.min(w / 390, h / 780)
      : Math.min(w / 1440, h / 900);

    document.documentElement.style.setProperty('--u', `${nextU}px`);
    setU(nextU);
    setIsMobile(mobile);
    setIsTouchEnv(window.matchMedia('(hover: none)').matches);

    const cs = getComputedStyle(document.documentElement);
    const readVar = (name: string, fallback: number) => {
      const parsed = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    metricsRef.current = {
      u: nextU,
      isMobile: mobile,
      railTop: readVar('--rail-top', mobile ? 292 : 270),
      railSag: readVar('--rail-sag', mobile ? 30 : 74),
      gap: readVar('--gap', mobile ? 80 : 121),
      gs: readVar('--gs', mobile ? 0.30 : 0.455),
      start: readVar('--start', mobile ? 46 : 113),
    };
  }, []);

  useLayoutEffect(() => {
    syncMetrics();
    window.addEventListener('resize', syncMetrics);
    return () => window.removeEventListener('resize', syncMetrics);
  }, [syncMetrics]);

  // Preload sheets and trigger staggered intro once ready (or 2.5s failsafe)
  useEffect(() => {
    const sheets = preloadAllSheets();
    let cancelled = false;

    const startIntro = () => {
      if (cancelled || introStartedRef.current) return;
      introStartedRef.current = true;
      document.documentElement.classList.remove('is-loading');

      if (prefersReducedMotion()) return;

      const curU = metricsRef.current.u;

      dropRefs.current.forEach((el, i) => {
        if (!el) return;
        el.animate(
          [
            {
              transform: `translateY(${-42 * curU}px)`,
              opacity: 0,
              filter: 'blur(6px)',
            },
            {
              transform: 'translateY(0px)',
              opacity: 1,
              filter: 'blur(0px)',
            },
          ],
          {
            duration: 620,
            delay: i * 70,
            easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
            fill: 'backwards',
          },
        );
        window.setTimeout(() => {
          if (cancelled) return;
          swayVelRef.current[i] += (i % 2 === 0 ? 1 : -1) * 1.6;
        }, i * 70 + 420);
      });

      wordRefs.current.forEach((el, j) => {
        if (!el) return;
        el.animate(
          [
            {
              filter: 'blur(12px)',
              opacity: 0,
              transform: `translateY(${6 * curU}px)`,
            },
            {
              filter: 'blur(0px)',
              opacity: 1,
              transform: 'translateY(0px)',
            },
          ],
          {
            duration: 820,
            delay: 60 + j * 110,
            easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)',
            fill: 'backwards',
          },
        );
      });

      const footerTargets: [HTMLElement | null, number][] = [
        [footerLeftRef.current, 600],
        [progressWrapRef.current, 680],
        [footerRightRef.current, 760],
      ];
      footerTargets.forEach(([el, delay]) => {
        if (!el) return;
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 420,
          delay,
          easing: 'ease-out',
          fill: 'backwards',
        });
      });
    };

    const fontsReady =
      typeof document.fonts !== 'undefined'
        ? document.fonts.ready
        : Promise.resolve();

    Promise.all([fontsReady, sheets.side, sheets.front]).then(startIntro);
    const failsafe = window.setTimeout(startIntro, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, [prefersReducedMotion]);

  // Helper to get maxScroll for current page width
  const getMaxScroll = useCallback(() => {
    const pageW = pageRef.current?.clientWidth || window.innerWidth;
    const { start, gap, u: curU } = metricsRef.current;
    return Math.max(0, (2 * start + 19 * gap) * curU - pageW);
  }, []);

  // Main 60fps requestAnimationFrame loop: scroll inertia, rail SVG curve, sway springs, neighbor spacing
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(3, Math.max(0.1, (now - lastTime) / 16.667));
      lastTime = now;

      const pageEl = pageRef.current;
      const zoneEl = railZoneRef.current;
      if (pageEl && zoneEl) {
        const W = pageEl.clientWidth;
        const { u: curU, railTop, railSag, gap, gs, start } = metricsRef.current;

        if (W > 0) {
          const halfW = W / 2;
          const railY = (x: number) => {
            const t = (x - halfW) / halfW;
            return (railTop + railSag * (1 - t * t)) * curU;
          };

          const y0 = railY(0);
          const yMid = railY(halfW);
          const yc = 2 * yMid - y0;

          if (railShadowPathRef.current) {
            railShadowPathRef.current.setAttribute(
              'd',
              `M 0 ${y0 + 4 * curU} Q ${halfW} ${yc + 4 * curU} ${W} ${y0 + 4 * curU}`,
            );
            railShadowPathRef.current.setAttribute(
              'stroke-width',
              String(3 * curU),
            );
          }
          if (railTubePathRef.current) {
            railTubePathRef.current.setAttribute(
              'd',
              `M 0 ${y0} Q ${halfW} ${yc} ${W} ${y0}`,
            );
            railTubePathRef.current.setAttribute(
              'stroke-width',
              String(5.2 * curU),
            );
          }
          if (railHighlightPathRef.current) {
            railHighlightPathRef.current.setAttribute(
              'd',
              `M 0 ${y0 - 1.3 * curU} Q ${halfW} ${yc - 1.3 * curU} ${W} ${y0 - 1.3 * curU}`,
            );
            railHighlightPathRef.current.setAttribute(
              'stroke-width',
              String(1.1 * curU),
            );
          }

          const maxScroll = Math.max(0, (2 * start + 19 * gap) * curU - W);
          const sc = scrollRef.current;
          sc.target = clamp(sc.target, 0, maxScroll);
          const prevCur = sc.cur;
          sc.cur += (sc.target - sc.cur) * (1 - Math.pow(1 - 0.085, dt));
          sc.vel = (sc.cur - prevCur) / dt;

          if (progressThumbRef.current) {
            const progress = maxScroll > 0 ? clamp(sc.cur / maxScroll, 0, 1) : 0;
            progressThumbRef.current.style.left = `${progress * 42}%`;
          }

          const zoneTop = zoneEl.offsetTop;
          const activeHover =
            !isDraggingRef.current && !qvAddingRef.current
              ? hoveredIdxRef.current
              : null;
          const reduced = prefersReducedMotion();
          const spreadUnit = (gs / 0.48) * curU;
          const spreadLut = [0, 50, 24, 9, 0];

          for (let i = 0; i < RAIL_SEQUENCE.length; i++) {
            let targetOffset = 0;
            if (activeHover !== null) {
              const d = i - activeHover;
              const mag = spreadLut[Math.min(Math.abs(d), 4)];
              targetOffset = Math.sign(d) * mag * spreadUnit;
            }
            offsetRef.current[i] +=
              (targetOffset - offsetRef.current[i]) *
              (1 - Math.pow(1 - 0.16, dt));

            const x = (start + i * gap) * curU - sc.cur + offsetRef.current[i];
            const y = railY(x) - 3 * curU - zoneTop;

            const gEl = garmentRefs.current[i];
            if (gEl) {
              gEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }

            const swayEl = swayRefs.current[i];
            if (swayEl) {
              if (reduced) {
                swayAngleRef.current[i] = 0;
                swayVelRef.current[i] = 0;
                swayEl.style.transform = 'rotate(0deg)';
              } else {
                const targetAngle = clamp(-sc.vel * 0.22, -7, 7);
                swayVelRef.current[i] +=
                  (targetAngle - swayAngleRef.current[i]) * 0.05 * dt;
                swayVelRef.current[i] *= Math.pow(0.88, dt);
                swayAngleRef.current[i] += swayVelRef.current[i] * dt;
                swayEl.style.transform = `rotate(${swayAngleRef.current[i]}deg)`;
              }
            }
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion]);

  // Compute Quick-View layout coordinates for desktop and mobile
  const qvLayout = useMemo<QuickViewLayout>(() => {
    const pageW = pageRef.current?.clientWidth || window.innerWidth;
    const pageH = pageRef.current?.clientHeight || window.innerHeight;
    if (!isMobile) {
      return {
        hookX: 440 * u,
        hookY: 62 * u,
        scale: 0.9 * u,
      };
    }

    const k = qvPiece?.k ?? 0;
    const frontH = GARMENTS[k].crops.front.h + 6;
    const backH = GARMENTS[k].crops.back.h + 6;
    const tallerH = Math.max(frontH, backH);
    const infoHeight = qvInfoRef.current?.offsetHeight || 355 * u;
    const availableH = Math.max(120 * u, pageH - 64 * u - infoHeight - 36 * u);
    const fittedScale = Math.min(0.46 * u, availableH / tallerH);

    return {
      hookX: pageW / 2,
      hookY: 64 * u,
      scale: fittedScale,
    };
  }, [u, isMobile, qvPiece?.k, qvOpen]);

  // Open quick-view for piece index i
  const openQuickView = useCallback(
    (index: number) => {
      const k = RAIL_SEQUENCE[index];
      const wasHovered = hoveredIdxRef.current === index;
      const sourceFaceEl = wasHovered
        ? frontFaceRefs.current[index]
        : sideFaceRefs.current[index];
      pendingSourceRectRef.current = sourceFaceEl
        ? sourceFaceEl.getBoundingClientRect()
        : null;

      qvTokenRef.current += 1;
      activeQvAnimRef.current?.cancel();
      activeQvAnimRef.current = null;

      setHoveredIdx(null);
      setQvPiece({ index, k });
      setQvView('front');
      setQvSize('S');
      setQvAdding(false);
      setQvHiddenIndex(index);
      setQvOpen(true);
    },
    [],
  );

  // Trigger WAAPI fly-in after QuickView commits to DOM
  useLayoutEffect(() => {
    if (!qvOpen || !qvPiece || !qvImgRef.current) return;
    const sourceRect = pendingSourceRectRef.current;
    pendingSourceRectRef.current = null;

    if (!sourceRect || prefersReducedMotion()) {
      qvImgRef.current.style.opacity = '1';
      qvImgRef.current.style.transform = 'none';
      return;
    }

    const frontCrop = GARMENTS[qvPiece.k].crops.front;
    const targetHeight = (frontCrop.h + 6) * qvLayout.scale;
    const ratio = targetHeight > 0 ? sourceRect.height / targetHeight : 1;
    const sourceHookX = sourceRect.left + sourceRect.width / 2;
    const sourceHookY = sourceRect.top;
    const tx = sourceHookX - qvLayout.hookX;
    const ty = sourceHookY - qvLayout.hookY;

    const anim = qvImgRef.current.animate(
      [
        {
          transform: `translate3d(${tx}px, ${ty}px, 0) scale(${ratio})`,
          opacity: 0.6,
        },
        {
          transform: 'translate3d(0px, 0px, 0) scale(1)',
          opacity: 1,
        },
      ],
      {
        duration: 700,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      },
    );
    activeQvAnimRef.current = anim;
    const token = qvTokenRef.current;
    anim.onfinish = () => {
      if (qvTokenRef.current === token) {
        activeQvAnimRef.current = null;
      }
    };
  }, [qvOpen, qvPiece, qvLayout.hookX, qvLayout.hookY, qvLayout.scale, prefersReducedMotion]);

  // Close Quick-View with reverse flight
  const closeQuickView = useCallback(() => {
    if (!qvPiece) return;
    const token = ++qvTokenRef.current;
    activeQvAnimRef.current?.cancel();
    activeQvAnimRef.current = null;
    setQvOpen(false);
    setQvAdding(false);

    if (prefersReducedMotion() || !qvImgRef.current) {
      setQvPiece(null);
      setQvHiddenIndex(null);
      return;
    }

    const destFaceEl = sideFaceRefs.current[qvPiece.index];
    const destRect = destFaceEl ? destFaceEl.getBoundingClientRect() : null;
    if (!destRect) {
      setQvPiece(null);
      setQvHiddenIndex(null);
      return;
    }

    const activeCrop = GARMENTS[qvPiece.k].crops[qvView];
    const currentHeight = (activeCrop.h + 6) * qvLayout.scale;
    const ratio = currentHeight > 0 ? destRect.height / currentHeight : 1;
    const destHookX = destRect.left + destRect.width / 2;
    const destHookY = destRect.top;
    const tx = destHookX - qvLayout.hookX;
    const ty = destHookY - qvLayout.hookY;

    const anim = qvImgRef.current.animate(
      [
        {
          transform: 'translate3d(0px, 0px, 0) scale(1)',
          opacity: 1,
        },
        {
          transform: `translate3d(${tx}px, ${ty}px, 0) scale(${ratio})`,
          opacity: 0,
        },
      ],
      {
        duration: 520,
        easing: 'cubic-bezier(0.55, 0, 0.2, 1)',
        fill: 'forwards',
      },
    );
    activeQvAnimRef.current = anim;
    anim.onfinish = () => {
      if (qvTokenRef.current !== token) return;
      activeQvAnimRef.current = null;
      setQvPiece(null);
      setQvHiddenIndex(null);
    };
  }, [qvPiece, qvView, qvLayout.hookX, qvLayout.hookY, qvLayout.scale, prefersReducedMotion]);

  // Insert or bump item at top of cart
  const commitAddToCart = useCallback((k: number, size: SizeOption) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.k === k && it.size === size);
      if (existingIdx !== -1) {
        const updated = {
          ...prev[existingIdx],
          qty: prev[existingIdx].qty + 1,
          isNew: true,
        };
        return [updated, ...prev.filter((_, idx) => idx !== existingIdx)];
      }
      return [
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          k,
          size,
          qty: 1,
          isNew: true,
        },
        ...prev,
      ];
    });
  }, []);

  // Add to Cart with 1000ms loading state and parabolic fly-to-bag arc
  const handleAddToCart = useCallback(() => {
    if (!qvPiece || qvAddingRef.current) return;
    const { index, k } = qvPiece;
    const chosenSize = qvSize;
    const activeView = qvView;

    setQvAdding(true);
    qvAddingRef.current = true;

    window.setTimeout(() => {
      const reduced = prefersReducedMotion();

      if (reduced) {
        qvTokenRef.current += 1;
        activeQvAnimRef.current?.cancel();
        activeQvAnimRef.current = null;
        setQvAdding(false);
        qvAddingRef.current = false;
        setQvOpen(false);
        setQvPiece(null);
        setQvHiddenIndex(null);
        commitAddToCart(k, chosenSize);
        return;
      }

      const activeFaceEl =
        activeView === 'front'
          ? qvFrontFaceRef.current
          : qvBackFaceRef.current;
      const cloneRect = activeFaceEl?.getBoundingClientRect() ?? null;
      const bagRect = bagBtnRef.current?.getBoundingClientRect() ?? null;

      // Close quick-view immediately without return flight
      qvTokenRef.current += 1;
      activeQvAnimRef.current?.cancel();
      activeQvAnimRef.current = null;
      setQvAdding(false);
      qvAddingRef.current = false;
      setQvOpen(false);
      setQvPiece(null);
      setQvHiddenIndex(null);

      // Reappear garment on its hook with small drop + sway impulse
      const dropEl = dropRefs.current[index];
      if (dropEl) {
        dropEl.animate(
          [
            {
              transform: `translateY(${-24 * metricsRef.current.u}px)`,
              opacity: 0,
            },
            {
              transform: 'translateY(0px)',
              opacity: 1,
            },
          ],
          {
            duration: 520,
            delay: 260,
            easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
            fill: 'backwards',
          },
        );
      }
      swayVelRef.current[index] += 1.4;

      if (!cloneRect || !bagRect) {
        commitAddToCart(k, chosenSize);
        return;
      }

      const cropStyle = getCropStyle(k, activeView, qvLayout.scale);
      const clone = document.createElement('div');
      clone.className = 'fly-clone';
      clone.style.left = `${cloneRect.left}px`;
      clone.style.top = `${cloneRect.top}px`;
      clone.style.width = `${cloneRect.width}px`;
      clone.style.height = `${cloneRect.height}px`;
      clone.style.backgroundImage = String(cropStyle.backgroundImage || '');
      clone.style.backgroundSize = String(cropStyle.backgroundSize || '');
      clone.style.backgroundPosition = String(cropStyle.backgroundPosition || '');
      document.body.appendChild(clone);

      const curU = metricsRef.current.u;
      const cloneOriginX = cloneRect.left + cloneRect.width * 0.5;
      const cloneOriginY = cloneRect.top + cloneRect.height * 0.42;
      const bagCenterX = bagRect.left + bagRect.width / 2;
      const bagCenterY = bagRect.top + bagRect.height / 2;
      const dx = bagCenterX - cloneOriginX;
      const dy = bagCenterY - cloneOriginY;
      const endScale = Math.max(0.04, (bagRect.height * 1.6) / cloneRect.height);
      const midScale = (1 + endScale) * 0.42;

      const flyAnim = clone.animate(
        [
          {
            offset: 0,
            transform: 'translate3d(0px, 0px, 0) scale(1)',
            opacity: 1,
          },
          {
            offset: 0.45,
            transform: `translate3d(${dx * 0.45}px, ${dy * 0.45 - 90 * curU}px, 0) scale(${midScale})`,
            opacity: 0.92,
          },
          {
            offset: 1,
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${endScale})`,
            opacity: 0.35,
          },
        ],
        {
          duration: 820,
          easing: 'cubic-bezier(0.55, 0.05, 0.35, 1)',
          fill: 'forwards',
        },
      );

      flyAnim.onfinish = () => {
        clone.remove();
        commitAddToCart(k, chosenSize);

        badgeRef.current?.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.45)' },
            { transform: 'scale(1)' },
          ],
          {
            duration: 500,
            easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)',
          },
        );

        bagBtnRef.current?.animate(
          [
            { transform: 'scale(1) rotate(0deg)' },
            { transform: 'scale(1.22) rotate(-6deg)', offset: 0.35 },
            { transform: 'scale(0.94) rotate(2deg)', offset: 0.7 },
            { transform: 'scale(1) rotate(0deg)' },
          ],
          {
            duration: 520,
            easing: 'ease-out',
          },
        );
      };
    }, 1000);
  }, [
    qvPiece,
    qvSize,
    qvView,
    qvLayout.scale,
    prefersReducedMotion,
    commitAddToCart,
  ]);

  // Wheel & Keyboard global handlers
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (qvOpenRef.current) return;
      const targetEl = e.target as HTMLElement | null;
      if (cartOpenRef.current && targetEl?.closest('.drawer')) return;
      e.preventDefault();
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const maxScroll = getMaxScroll();
      scrollRef.current.target = clamp(
        scrollRef.current.target + delta * 0.9,
        0,
        maxScroll,
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (qvOpenRef.current) {
          closeQuickView();
        } else if (cartOpenRef.current) {
          setCartOpen(false);
        }
        return;
      }

      if (
        qvOpenRef.current ||
        document.activeElement === searchInputRef.current
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        const step = metricsRef.current.gap * metricsRef.current.u;
        scrollRef.current.target = clamp(
          scrollRef.current.target + step,
          0,
          getMaxScroll(),
        );
      } else if (e.key === 'ArrowLeft') {
        const step = metricsRef.current.gap * metricsRef.current.u;
        scrollRef.current.target = clamp(
          scrollRef.current.target - step,
          0,
          getMaxScroll(),
        );
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [getMaxScroll, closeQuickView]);

  // Pointer drag on rail zone
  const handleRailPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    lastPointerTypeRef.current = e.pointerType;
    dragRef.current = {
      down: true,
      moved: false,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startTarget: scrollRef.current.target,
      lastX: e.clientX,
      lastT: performance.now(),
      releaseVel: 0,
    };
  };

  const handleRailPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dr = dragRef.current;
    if (!dr.down) return;

    const dx = e.clientX - dr.startX;
    if (!dr.moved && Math.abs(dx) > 6) {
      dr.moved = true;
      isDraggingRef.current = true;
      setIsDragging(true);
      setHoveredIdx(null);
      try {
        railZoneRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // ignore if pointer capture unavailable
      }
    }

    if (dr.moved) {
      const now = performance.now();
      const dtMs = Math.max(4, now - dr.lastT);
      const instVel = (e.clientX - dr.lastX) / dtMs;
      dr.releaseVel = dr.releaseVel * 0.4 + instVel * 0.6;
      dr.lastX = e.clientX;
      dr.lastT = now;

      scrollRef.current.target = clamp(
        dr.startTarget - dx * 1.15,
        0,
        getMaxScroll(),
      );
    }
  };

  const handleRailPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dr = dragRef.current;
    if (!dr.down) return;
    dr.down = false;

    if (dr.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 60);
      isDraggingRef.current = false;
      setIsDragging(false);

      const maxScroll = getMaxScroll();
      scrollRef.current.target = clamp(
        scrollRef.current.target - dr.releaseVel * 260,
        0,
        maxScroll,
      );

      try {
        if (railZoneRef.current?.hasPointerCapture(e.pointerId)) {
          railZoneRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
    }
  };

  // Garment hit interactions
  const handleGarmentClick = (i: number) => {
    if (suppressClickRef.current || qvAddingRef.current) return;
    const isTouch = isTouchEnv || lastPointerTypeRef.current !== 'mouse';
    if (isTouch && hoveredIdxRef.current !== i) {
      setHoveredIdx(i);
      return;
    }
    openQuickView(i);
  };

  // Shop the Collection opens quick-view on centered garment
  const handleShopCollection = () => {
    const pageW = pageRef.current?.clientWidth || window.innerWidth;
    const centerScreenX = pageW / 2;
    const { start, gap, u: curU } = metricsRef.current;
    const curScroll = scrollRef.current.cur;

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < RAIL_SEQUENCE.length; i++) {
      const gx = (start + i * gap) * curU - curScroll;
      const dist = Math.abs(gx - centerScreenX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    openQuickView(bestIdx);
  };

  // Search submits and glides rail to matching piece
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const matchIdx = RAIL_SEQUENCE.findIndex((k) =>
      GARMENTS[k].name.toLowerCase().includes(q),
    );
    if (matchIdx === -1) {
      showNotice(`No silhouette matching "${searchQuery.trim()}".`);
      return;
    }
    const pageW = pageRef.current?.clientWidth || window.innerWidth;
    const { start, gap, u: curU } = metricsRef.current;
    const desiredScroll = (start + matchIdx * gap) * curU - pageW / 2;
    scrollRef.current.target = clamp(desiredScroll, 0, getMaxScroll());
    setHoveredIdx(matchIdx);
    searchInputRef.current?.blur();
  };

  // Cart item handlers
  const handleUpdateQty = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta, isNew: false } : item,
        )
        .filter((item) => item.qty > 0),
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleCompleteOrder = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const railScale = (isMobile ? 0.30 : 0.455) * u;
  const gapPx = (isMobile ? 80 : 121) * u;
  const shadowWidth = 110 * ((isMobile ? 0.30 : 0.455) / 0.48) * u;

  return (
    <>
      <div ref={pageRef} className="page">
        <div className="stage">
          {/* Utility bar */}
          <div className="utility-bar" aria-label="Atelier utilities">
            <button
              type="button"
              onClick={() =>
                showNotice('Milan & Paris Ateliers · Private fittings by appointment')
              }
            >
              Our Ateliers
            </button>
            <button
              type="button"
              onClick={() =>
                showNotice('Complimentary pressing & archival garment care included')
              }
            >
              Care
            </button>
            <button
              type="button"
              onClick={() =>
                showNotice('Autumn / Winter Monograph — Silk, Barathea & Gabardine')
              }
            >
              Journal
            </button>
            <button
              type="button"
              onClick={() => showNotice('Client Concierge · Sign in via private invitation')}
            >
              Sign In
            </button>
          </div>

          {/* Primary Nav */}
          <header className="nav-row">
            <a
              href="#top"
              className="wordmark"
              onClick={(e) => {
                e.preventDefault();
                scrollRef.current.target = 0;
              }}
            >
              MAISON VERREL
            </a>

            <nav className="nav-links" aria-label="Primary">
              <button
                type="button"
                onClick={() => {
                  scrollRef.current.target = 0;
                }}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() =>
                  showNotice('Via Gesù, Milan · Hand-finished to order')
                }
              >
                Atelier
              </button>
              <button
                type="button"
                className="is-active"
                onClick={() => {
                  scrollRef.current.target = 0;
                }}
              >
                The Rail
              </button>
              <button
                type="button"
                onClick={() =>
                  showNotice('Concierge · concierge@maisonverrel.com')
                }
              >
                Contact
              </button>
            </nav>

            <div className="nav-tools">
              <form
                className="search-pill"
                onSubmit={handleSearchSubmit}
                onClick={() => {
                  if (cartOpen) setCartOpen(false);
                  searchInputRef.current?.focus();
                }}
                role="search"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle
                    cx="10.5"
                    cy="10.5"
                    r="7"
                    stroke="#2A2420"
                    strokeWidth="1.7"
                  />
                  <line
                    x1="15.6"
                    y1="15.6"
                    x2="18.8"
                    y2="18.8"
                    stroke="#2A2420"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  aria-label="Search garments on the rail"
                />
              </form>

              <button
                type="button"
                className="account-btn"
                aria-label="Account"
                onClick={() =>
                  showNotice('Private Client Profile · Sign in to access measurements')
                }
              >
                <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle
                    cx="11"
                    cy="7.2"
                    r="4"
                    stroke="#1A1716"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M3.5 19.2C4.5 15.6 7.4 13.8 11 13.8C14.6 13.8 17.5 15.6 18.5 19.2"
                    stroke="#1A1716"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <button
                ref={bagBtnRef}
                type="button"
                className="bag-btn"
                aria-label={`Open shopping cart, ${totalCartCount} items`}
                onClick={() => setCartOpen((prev) => !prev)}
              >
                <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path
                    d="M4.2 7.5H17.8L18.8 19.2H3.2L4.2 7.5Z"
                    stroke="#1A1716"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.6 7.5V6C7.6 4.1 9.1 2.6 11 2.6C12.9 2.6 14.4 4.1 14.4 6V7.5"
                    stroke="#1A1716"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span ref={badgeRef} className="bag-badge">
                  {totalCartCount}
                </span>
              </button>
            </div>
          </header>

          {/* Eyebrow */}
          <div className="eyebrow">
            <span className="eyebrow-left">NEW COLLECTION</span>
            <span className="eyebrow-divider" aria-hidden="true" />
            <span className="eyebrow-right">EVENING &amp; TAILORING</span>
          </div>

          {/* Headline */}
          <h1 className="headline">
            {HEADLINE_WORDS.map((word, j) => (
              <span
                key={word}
                ref={(el) => {
                  wordRefs.current[j] = el;
                }}
                className={`headline-word hw-${j}`}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Curved Gold Rail SVG */}
          <svg className="rail-svg" aria-hidden="true">
            <defs>
              <linearGradient id="railGoldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E9DCBC" />
                <stop offset="45%" stopColor="#C2A877" />
                <stop offset="100%" stopColor="#7F6743" />
              </linearGradient>
            </defs>
            <path
              ref={railShadowPathRef}
              fill="none"
              stroke="rgba(80, 60, 35, 0.12)"
            />
            <path
              ref={railTubePathRef}
              fill="none"
              stroke="url(#railGoldGrad)"
            />
            <path
              ref={railHighlightPathRef}
              fill="none"
              stroke="rgba(255, 247, 226, 0.85)"
            />
          </svg>

          {/* Interactive Rail & 20 Garments */}
          <div
            ref={railZoneRef}
            className={`rail-zone${isDragging ? ' dragging' : ''}`}
            onPointerDown={handleRailPointerDown}
            onPointerMove={handleRailPointerMove}
            onPointerUp={handleRailPointerUp}
            onPointerCancel={handleRailPointerUp}
          >
            {RAIL_SEQUENCE.map((k, i) => {
              const garment = GARMENTS[k];
              const sideCrop = garment.crops.side;
              const sideHeight = (sideCrop.h + 6) * railScale;
              const sideStyle = getCropStyle(k, 'side', railScale);
              const frontStyle = getCropStyle(k, 'front', railScale);
              const tagAngle = TAG_ANGLES[i % TAG_ANGLES.length];
              const isHov = hoveredIdx === i;
              const isHidden = qvHiddenIndex === i;

              return (
                <div
                  key={`${i}-${k}`}
                  ref={(el) => {
                    garmentRefs.current[i] = el;
                  }}
                  className={`g${isHov ? ' hov' : ''}${isHidden ? ' is-qv-hidden' : ''}`}
                >
                  <div
                    ref={(el) => {
                      dropRefs.current[i] = el;
                    }}
                    className="drop"
                  >
                    <div
                      ref={(el) => {
                        swayRefs.current[i] = el;
                      }}
                      className="sway"
                    >
                      <div className="lift">
                        <div
                          ref={(el) => {
                            sideFaceRefs.current[i] = el;
                          }}
                          className="face face-side"
                          style={sideStyle}
                        />
                        <div
                          ref={(el) => {
                            frontFaceRefs.current[i] = el;
                          }}
                          className="face face-front"
                          style={frontStyle}
                        />
                        <div
                          className="price-tag"
                          style={{ transform: `rotate(${tagAngle}deg)` }}
                        >
                          $690
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="garment-shadow"
                    style={{
                      top: `${sideHeight + 4 * u}px`,
                      width: `${shadowWidth}px`,
                    }}
                  />

                  <button
                    type="button"
                    className="g-hit"
                    style={{
                      width: `${gapPx}px`,
                      height: `${sideHeight}px`,
                    }}
                    aria-label={`${garment.name}, $690`}
                    onMouseEnter={() => {
                      if (
                        !isTouchEnv &&
                        !isDraggingRef.current &&
                        !qvAddingRef.current &&
                        !qvOpenRef.current
                      ) {
                        setHoveredIdx(i);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isTouchEnv && hoveredIdxRef.current === i) {
                        setHoveredIdx(null);
                      }
                    }}
                    onClick={() => handleGarmentClick(i)}
                  />
                </div>
              );
            })}
          </div>

          {/* Footer Left: Hint & Hover Label */}
          <div ref={footerLeftRef} className="footer-left">
            <div className={`hint-line${hoveredIdx !== null ? ' is-hidden' : ''}`}>
              <span className="hint-rule" aria-hidden="true" />
              <span>
                {isTouchEnv
                  ? 'Tap a piece · tap again to look closer'
                  : 'Hover a piece · click to look closer'}
              </span>
            </div>

            <div
              className={`hover-label${hoveredIdx !== null ? ' is-visible' : ''}`}
              aria-live="polite"
            >
              <span className="hover-label-name">
                {hoveredIdx !== null
                  ? GARMENTS[RAIL_SEQUENCE[hoveredIdx]].name
                  : ''}
              </span>
              <span className="hover-label-price">
                {hoveredIdx !== null
                  ? formatMoney(GARMENTS[RAIL_SEQUENCE[hoveredIdx]].price)
                  : ''}
              </span>
            </div>
          </div>

          {/* Footer Center: Progress */}
          <div ref={progressWrapRef} className="progress-wrap" aria-hidden="true">
            <div ref={progressThumbRef} className="progress-thumb" />
          </div>

          {/* Footer Right: Copy & Shop Link */}
          <div ref={footerRightRef} className="footer-right">
            <div className="footer-copy">
              Cut from Italian silk and wool.
              <br />
              Tailored to order. Made to last.
            </div>
            <button
              type="button"
              className="shop-link"
              onClick={handleShopCollection}
            >
              <span>Shop the Collection</span>
              <svg viewBox="0 0 15 10" fill="none" aria-hidden="true">
                <line
                  x1="0.5"
                  y1="5"
                  x2="13.5"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M9.8 1.3L13.8 5L9.8 8.7"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Full-Screen Quick-View */}
        <QuickView
          piece={qvPiece}
          isOpen={qvOpen}
          view={qvView}
          size={qvSize}
          adding={qvAdding}
          layout={qvLayout}
          qvImgRef={qvImgRef}
          qvFrontFaceRef={qvFrontFaceRef}
          qvBackFaceRef={qvBackFaceRef}
          qvInfoRef={qvInfoRef}
          onChangeView={setQvView}
          onChangeSize={setQvSize}
          onAddToCart={handleAddToCart}
          onClose={closeQuickView}
        />
      </div>

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        u={u}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCompleteOrder={handleCompleteOrder}
      />

      {atelierNotice && (
        <div className="atelier-notice" role="status">
          {atelierNotice}
        </div>
      )}
    </>
  );
}
