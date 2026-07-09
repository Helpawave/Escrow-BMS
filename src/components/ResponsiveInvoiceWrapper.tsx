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
  const [scale, setScale] = useState(1);

  const calculateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const newScale = Math.min(1, containerWidth / maxWidth);
      setScale(newScale);
    }
  }, [maxWidth]);

  useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [calculateScale]);

  return (
    <div ref={containerRef} className="w-full flex justify-center overflow-hidden">
      <div 
        className="origin-top transition-transform duration-200"
        style={{ 
          transform: scale < 1 ? `scale(${scale})` : 'none',
          width: `${maxWidth}px`,
          marginBottom: scale < 1 ? `-${(1 - scale) * 100}%` : '0px'
        }}
      >
        {children}
      </div>
    </div>
  );
};
