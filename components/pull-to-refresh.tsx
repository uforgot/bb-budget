"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const THRESHOLD = 80;
const PETAL_COUNT = 8;

function FlowerSpinner({ progress, spinning }: { progress: number; spinning: boolean }) {
  const size = 28;
  const center = size / 2;
  const petalLength = 4.5;
  const petalWidth = 2;
  const innerRadius = 4;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: PETAL_COUNT }).map((_, i) => {
        const angle = (i * 360) / PETAL_COUNT - 90;
        const rad = (angle * Math.PI) / 180;
        const x = center + Math.cos(rad) * innerRadius;
        const y = center + Math.sin(rad) * innerRadius;

        // 네이티브처럼 시계 방향으로 순차 페이드
        const petalProgress = spinning
          ? 1
          : Math.max(0, Math.min(1, (progress * PETAL_COUNT - i) / 1));

        const opacity = spinning ? undefined : petalProgress * 0.4 + 0.15;

        return (
          <rect
            key={i}
            x={x - petalWidth / 2}
            y={y - petalLength / 2}
            width={petalWidth}
            height={petalLength}
            rx={petalWidth / 2}
            fill="currentColor"
            opacity={opacity}
            transform={`rotate(${angle + 90}, ${x}, ${y})`}
            className="text-muted-foreground"
            style={spinning ? {
              animation: `flower-fade 0.8s linear infinite`,
              animationDelay: `${(i / PETAL_COUNT) * -0.8}s`,
            } : undefined}
          />
        );
      })}
    </svg>
  );
}

export function PullToRefresh({ onRefresh, children, className = '', disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, [disabled]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !pullingRef.current || refreshing) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(diff * 0.5, 120));
      }
    },
    [refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : 0,
          transitionDuration: pullingRef.current ? "0ms" : "200ms",
        }}
      >
        <FlowerSpinner progress={progress} spinning={refreshing} />
      </div>
      {children}
    </div>
  );
}
