import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ResponsiveInvoiceWrapperProps {
  children: React.ReactNode;
  maxWidth?: number; // Default 800px for A4
}

export const ResponsiveInvoiceWrapper: React.FC<ResponsiveInvoiceWrapperProps> = ({ 
  children, 
  maxWidth = 800 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  const calculateLayout = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.clientWidth || containerRef.current.offsetWidth;
    
    // If container is not yet measured (e.g. during dialog transition), don't collapse to 0
    if (!containerWidth || containerWidth <= 0) return;

    // Available width with a small padding margin
    const availableWidth = Math.max(280, containerWidth - 16);
    const newScale = Math.min(1, Math.max(0.35, availableWidth / maxWidth));
    setScale(newScale);

    // Accurately compute the scaled height of the invoice content
    const unscaledHeight = contentRef.current.scrollHeight;
    if (newScale < 1 && unscaledHeight > 0) {
      setScaledHeight(Math.ceil(unscaledHeight * newScale) + 48);
    } else {
      setScaledHeight(undefined);
    }
  }, [maxWidth]);

  useEffect(() => {
    calculateLayout();

    // Trigger recalculations after dialog transition delays
    const timer1 = setTimeout(calculateLayout, 50);
    const timer2 = setTimeout(calculateLayout, 200);
    const timer3 = setTimeout(calculateLayout, 500);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        calculateLayout();
      });
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (contentRef.current) resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', calculateLayout);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', calculateLayout);
    };
  }, [calculateLayout]);

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center overflow-x-auto overflow-y-visible py-2"
      style={{ 
        minHeight: scaledHeight ? `${scaledHeight}px` : 'auto',
        height: scaledHeight ? `${scaledHeight}px` : 'auto'
      }}
    >
      <div 
        ref={contentRef}
        className="origin-top transition-transform duration-100"
        style={{ 
          transform: scale < 1 ? `scale(${scale})` : 'none',
          width: `${maxWidth}px`,
          maxWidth: `${maxWidth}px`,
          minWidth: `${maxWidth}px`,
          flexShrink: 0
        }}
      >
        {children}
      </div>
    </div>
  );
};
