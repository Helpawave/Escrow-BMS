import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const GlobalBarcodeListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scanBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      // Ignore functional keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      // Ignore if user is typing in a text input or textarea
      // But we should still capture if it's very fast (scanner)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Scanners typically send keys very quickly (< 50ms apart)
      // If it's slow, it's a human. If they are in an input, we ignore it.
      if (timeDiff > 100) {
        scanBuffer.current = '';
      }

      if (e.key === 'Enter') {
        const potentialCode = scanBuffer.current.trim();
        if (potentialCode.length >= 3) {
          // If we are already on create-invoice, we don't want to navigate away
          // but we can use search params to trigger the add.
          
          const isCreatingInvoice = location.pathname === '/create-invoice' || 
                                   (location.pathname.startsWith('/invoices/') && location.pathname.endsWith('/edit'));

          if (isCreatingInvoice) {
            // Let the page handle it via the URL or a custom event
            const url = new URL(window.location.href);
            url.searchParams.set('scan', potentialCode);
            url.searchParams.set('t', Date.now().toString()); // Cache breaker
            navigate(`${location.pathname}${url.search}${location.hash}`, { replace: true });
          } else {
            // Navigate from any other page
            navigate(`/create-invoice?scan=${potentialCode}`);
          }
          
          scanBuffer.current = '';
          // Only prevent default if it looks like a scanner and we processed it
          if (isInput) e.preventDefault(); 
        }
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);

    function handleGlobalKeyDown(e: KeyboardEvent) {
      handleKeyDown(e);
    }
  }, [navigate, location]);

  return null; // This component doesn't render anything
};
