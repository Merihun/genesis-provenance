'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  swipeThreshold?: number;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  swipeThreshold = 100,
}: SwipeableCardProps) {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const [translateX, setTranslateX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const minSwipeDistance = swipeThreshold;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;

    // Add resistance at the edges
    const resistance = 0.5;
    setTranslateX(diff * resistance);
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      resetPosition();
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }

    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }

    resetPosition();
  };

  const resetPosition = () => {
    setTranslateX(0);
    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn('touch-pan-y', className)}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}
