"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type EasingFn = (t: number) => number;

const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type UseFullPageOptions = {
  /** ms */
  duration?: number;
  easing?: EasingFn;
  loop?: boolean;
  anchors?: string[]; // ["home","about","contact"]
  onLeave?: (from: number, to: number) => void;
  afterLoad?: (index: number) => void;
  /** 트랙패드 등 민감한 휠에서 과도한 이벤트 방지 */
  wheelCooldownMs?: number;
  /** 스와이프 인정 최소 거리(px) */
  touchThreshold?: number;
  /** 화살표/pgup/pgdn/space */
  keyboard?: boolean;
  /** hash 변경 방식: replaceState(true)면 뒤로가기 기록 안 쌓음 */
  replaceHistory?: boolean;
};

type FullPageApi = {
  next: () => void;
  prev: () => void;
  goTo: (indexOrAnchor: number | string) => void;
  getActiveIndex: () => number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useFullPage(
  sectionCount: number,
  opts: UseFullPageOptions = {}
): {
  activeIndex: number;
  style: React.CSSProperties;
  containerProps: React.HTMLAttributes<HTMLDivElement>;
  api: FullPageApi;
  setContainerRef: (el: HTMLDivElement | null) => void;
} {
  const {
    duration = 800,
    easing = easeInOutCubic,
    loop = false,
    anchors = [],
    onLeave,
    afterLoad,
    wheelCooldownMs = 500,
    touchThreshold = 60,
    keyboard = true,
    replaceHistory = true,
  } = opts;

  const [activeIndex, setActiveIndex] = useState(0);
  const [vh, setVh] = useState(0);
  const animRef = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const lastWheelAt = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // hash → index 초기 진입
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!anchors.length) return;
    const hash = window.location.hash.replace("#", "");
    const idx = anchors.indexOf(hash);
    if (idx >= 0) setActiveIndex(clamp(idx, 0, sectionCount - 1));
  }, [anchors, sectionCount]);

  // 리사이즈 대응 (모바일 주소창 등)
  useEffect(() => {
    const updateVh = () => setVh(window.innerHeight);
    updateVh();
    window.addEventListener("resize", updateVh);
    return () => window.removeEventListener("resize", updateVh);
  }, []);

  const animateTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex) return;
      const from = activeIndex;
      const to = loop
        ? (nextIndex + sectionCount) % sectionCount
        : clamp(nextIndex, 0, sectionCount - 1);

      onLeave?.(from, to);

      // hash 업데이트
      const nextHash = anchors[to] ? `#${anchors[to]}` : `#section-${to + 1}`;
      if (typeof window !== "undefined") {
        if (replaceHistory) {
          window.history.replaceState(null, "", nextHash);
        } else {
          window.history.pushState(null, "", nextHash);
        }
      }

      if (prefersReduced || duration === 0) {
        setActiveIndex(to);
        afterLoad?.(to);
        return;
      }

      // 애니메이션 락
      isAnimating.current = true;
      const start = performance.now();
      const fromY = -from * vh;
      const toY = -to * vh;

      const tick = (now: number) => {
        const t = clamp((now - start) / duration, 0, 1);
        const p = easing(t);
        const currentY = fromY + (toY - fromY) * p;
        if (containerRef.current) {
          containerRef.current.style.transform = `translate3d(0, ${currentY}px, 0)`;
        }
        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          // 최종 위치 스냅 & 상태 반영
          if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(0, ${
              -to * vh
            }px, 0)`;
          }
          setActiveIndex(to);
          isAnimating.current = false;
          afterLoad?.(to);
        }
      };

      // 시작 프레임
      cancelAnimationFrame(animRef.current ?? 0);
      animRef.current = requestAnimationFrame(tick);
    },
    [
      activeIndex,
      anchors,
      afterLoad,
      duration,
      easing,
      loop,
      prefersReduced,
      sectionCount,
      vh,
      onLeave,
      replaceHistory,
    ]
  );

  // 휠/트랙패드
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (isAnimating.current) return;
      if (now - lastWheelAt.current < wheelCooldownMs) return;

      const dir = Math.sign(e.deltaY);
      if (dir > 0) {
        // down
        const next = activeIndex + 1;
        if (next >= sectionCount && !loop) return;
        lastWheelAt.current = now;
        animateTo(next);
      } else if (dir < 0) {
        const prev = activeIndex - 1;
        if (prev < 0 && !loop) return;
        lastWheelAt.current = now;
        animateTo(prev);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [activeIndex, animateTo, loop, sectionCount, wheelCooldownMs]);

  // 터치 스와이프
  useEffect(() => {
    let startY = 0;
    let moved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimating.current) return;
      startY = e.touches[0].clientY;
      moved = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isAnimating.current) return;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dy) > touchThreshold) {
        moved = true;
        if (dy < 0) {
          // swipe up → next
          const next = activeIndex + 1;
          if (next >= sectionCount && !loop) return;
          animateTo(next);
        } else {
          const prev = activeIndex - 1;
          if (prev < 0 && !loop) return;
          animateTo(prev);
        }
      }
    };
    const onTouchEnd = () => {
      moved = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex, animateTo, loop, sectionCount, touchThreshold]);

  // 키보드
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (isAnimating.current) return;
      const { key } = e;
      if (key === "ArrowDown" || key === "PageDown" || key === " ") {
        e.preventDefault();
        animateTo(activeIndex + 1);
      } else if (key === "ArrowUp" || key === "PageUp") {
        e.preventDefault();
        animateTo(activeIndex - 1);
      } else if (key === "Home") {
        e.preventDefault();
        animateTo(0);
      } else if (key === "End") {
        e.preventDefault();
        animateTo(sectionCount - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, animateTo, keyboard, sectionCount]);

  // 언마운트시 애니메이션 정리
  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current ?? 0);
  }, []);

  // 시각적 위치: transform은 직접 애니메이션하므로, 상태 기반 스냅만 제공
  const style = useMemo<React.CSSProperties>(
    () => ({
      height: vh ? `${vh * sectionCount}px` : "100vh",
      transform: `translate3d(0, ${-activeIndex * vh}px, 0)`,
      willChange: "transform",
      transition: prefersReduced ? "none" : "transform 0s", // 애니메이션은 rAF로 처리
    }),
    [activeIndex, prefersReduced, sectionCount, vh]
  );

  // 접근성: 현재 섹션 포커싱
  useEffect(() => {
    const current = containerRef.current?.children?.[activeIndex] as
      | HTMLElement
      | undefined;
    current?.focus?.();
  }, [activeIndex]);

  const api = useMemo<FullPageApi>(
    () => ({
      next: () => animateTo(activeIndex + 1),
      prev: () => animateTo(activeIndex - 1),
      goTo: (i) => {
        if (typeof i === "string") {
          const idx = anchors.indexOf(i);
          if (idx >= 0) animateTo(idx);
        } else {
          animateTo(i);
        }
      },
      getActiveIndex: () => activeIndex,
    }),
    [activeIndex, anchors, animateTo]
  );

  const containerProps: React.HTMLAttributes<HTMLDivElement> = {
    style,
    role: "group",
    "aria-roledescription": "Full-page vertical scroller",
  };

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
  };

  return { activeIndex, style, containerProps, api, setContainerRef };
}

/** 레이아웃/섹션 래퍼 */
export function FullPage({
  children,
  options,
  onReady,
  className,
}: {
  children: React.ReactNode[];
  options?: UseFullPageOptions;
  onReady?: (api: FullPageApi) => void;
  className?: string;
}) {
  const sectionArray = React.Children.toArray(children) as React.ReactNode[];
  const { activeIndex, containerProps, api, setContainerRef } = useFullPage(
    sectionArray.length,
    options
  );

  useEffect(() => {
    onReady?.(api);
  }, [api, onReady]);

  return (
    <div
      className={className}
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        touchAction: "none", // 모바일에서 브라우저 기본 스크롤 방지
      }}
    >
      <div {...containerProps} ref={setContainerRef}>
        {sectionArray.map((child, i) => (
          <section
            key={i}
            tabIndex={-1}
            aria-hidden={i !== activeIndex}
            style={{
              height: "100vh",
              width: "100%",
              outline: "none",
            }}
          >
            {child}
          </section>
        ))}
      </div>

      {/* 네비게이션 도트 (옵션) */}
      <nav
        aria-label="Sections"
        style={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 10,
        }}
      >
        {sectionArray.map((_, i) => (
          <button
            key={i}
            onClick={() => api.goTo(i)}
            aria-label={`Go to section ${i + 1}`}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              border: 0,
              background: i === activeIndex ? "#111" : "rgba(0,0,0,0.3)",
              transform: i === activeIndex ? "scale(1.2)" : "scale(1)",
              transition: "transform 200ms ease, background 200ms ease",
            }}
          />
        ))}
      </nav>
    </div>
  );
}
