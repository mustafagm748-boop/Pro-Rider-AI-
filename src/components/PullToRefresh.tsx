import { useState, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 70;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].pageY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].pageY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
      if (diff > 15) {
        // Prevent default browser pull-to-refresh if needed
      }
    } else {
      setPullDistance(0);
    }
  };

  const [pullCount, setPullCount] = useState(0);

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (pullDistance > THRESHOLD || pullDistance > 50) {
      const newPullCount = pullCount + 1;
      if (newPullCount >= 3) {
        setIsRefreshing(true);
        setPullCount(0);
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullCount(newPullCount);
      }
    }
    setPullDistance(0);
  };

  return (
    <div 
        ref={containerRef} 
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove} 
        onTouchEnd={handleTouchEnd}
        className="w-full h-full relative overflow-y-auto overflow-x-hidden"
    >
        <div 
            className="absolute top-0 left-0 w-full flex items-center justify-center transition-all duration-150 text-yellow-500 z-50 bg-black/80 backdrop-blur-sm"
            style={{ height: pullDistance > 0 ? `${pullDistance}px` : '0px', opacity: pullDistance > 0 ? 1 : 0 }}
        >
            <div className="flex items-center gap-2 text-xs font-black uppercase text-yellow-400">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing App...' : 'Pull down to refresh'}</span>
            </div>
        </div>
        <div 
            style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none' }} 
            className="transition-transform duration-150 h-full"
        >
            {children}
        </div>
    </div>
  );
}

