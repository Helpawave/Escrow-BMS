import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [isScanning, setIsScannerStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [closing, setClosing] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startAttemptIdRef = useRef(0);
  const startPromiseRef = useRef<Promise<null> | null>(null);

  // Initialize scanner and get cameras
  useEffect(() => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Camera requires HTTPS (or localhost). Open the site on https:// or http://localhost.");
      return;
    }

    // Attempt to auto-start if permission was previously granted
    const shouldAutoStart = localStorage.getItem('camera_permission_granted') === 'true';
    if (shouldAutoStart) {
      void enableCamera();
    } else {
      // Attempt to query permission via navigator.permissions if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navPerm = navigator.permissions as any;
      if (navPerm && navPerm.query) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navPerm.query({ name: 'camera' as any })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((status: any) => {
            if (status.state === 'granted') {
              void enableCamera();
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      startAttemptIdRef.current += 1;
      if (!scannerRef.current) return;
      if (!scannerRef.current.isScanning) return;
      void Promise.resolve(scannerRef.current.stop())
        .catch(() => {})
        .finally(() => {
          void Promise.resolve(scannerRef.current?.clear()).catch(() => {});
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureScanner = () => {
    if (scannerRef.current) return scannerRef.current;

    const scanner = new Html5Qrcode("reader", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
      ],
      useBarCodeDetectorIfSupported: false,
    });

    scannerRef.current = scanner;
    return scanner;
  };

  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const name = typeof reason?.name === "string" ? (reason.name as string) : "";
      const message = typeof reason?.message === "string" ? (reason.message as string) : "";
      const text = `${name} ${message}`.toLowerCase();

      if (text.includes("aborterror") || text.includes("play() request was interrupted") || text.includes("media was removed")) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  const withTimeout = <T,>(promise: Promise<T>, ms: number) => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
      promise.then((v) => {
        clearTimeout(timer);
        resolve(v);
      }).catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
    });
  };

  const enableCamera = async () => {
    if (closing) return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Camera requires HTTPS (or localhost). Open the site on https:// or http://localhost.");
      return;
    }

    setInitializing(true);
    setError(null);
    const attemptId = ++startAttemptIdRef.current;

    try {
      ensureScanner();

      if (!navigator?.mediaDevices?.getUserMedia) {
        setError("Camera API is not available in this browser.");
        return;
      }

      // We don't need to manually getUserMedia here, html5-qrcode will handle it.
      // This helps avoid race conditions where camera is locked or tracks are stopped prematurely.

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setError("No cameras found on this device.");
        return;
      }

      setCameras(devices.map(d => ({ id: d.id, label: d.label })));

      const lastUsedId = localStorage.getItem('last_camera_id');
      const preferredCamera = devices.find(d => d.id === lastUsedId);
      
      const backCamera = preferredCamera || devices.find(d =>
        d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
      );
      const selectedId = backCamera ? backCamera.id : devices[0].id;
      setActiveCameraId(selectedId);
      await startScanning(selectedId, attemptId);
    } catch (err) {
      const error = err as Error;
      const name = error.name || "";
      const message = error.message || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Camera permission denied. Allow camera access in browser site settings and try again.");
        return;
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera device found.");
        return;
      }
      if (name === "NotReadableError") {
        setError("Camera is already in use by another app/tab. Close other apps and try again.");
        return;
      }
      if (name === "OverconstrainedError") {
        setError("Camera constraints not supported on this device. Try switching camera.");
        return;
      }
      if (message.toLowerCase().includes("timeout")) {
        setError("Camera is taking too long to start. Please try again.");
        return;
      }
      setError("Camera permission denied or not available.");
    } finally {
      setInitializing(false);
    }
  };

  const startScanning = async (cameraId: string, attemptId?: number) => {
    const scanner = ensureScanner();

    try {
      if (scanner.isScanning) {
        await scanner.stop().catch(() => {});
      }

      setError(null);
      const startPromise = scanner.start(
        { deviceId: cameraId }, 
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Wider box for better barcode support, square for QR
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrBoxSize = Math.floor(minEdgeSize * 0.7);
            return {
              width: Math.max(qrBoxSize, Math.floor(viewfinderWidth * 0.8)),
              height: Math.max(qrBoxSize, Math.floor(viewfinderHeight * 0.5))
            };
          },
          // Removed manual aspectRatio constraint to let the library use native aspect ratio
        },
        (decodedText) => {
          console.log("Scanner Decoded:", decodedText);
          onScan(decodedText);
        },
        (errorMessage) => {
          // Only log real errors, not the constant "QR code not found" noise
          if (errorMessage && !errorMessage.includes("NotFoundException")) {
            console.warn("Scanner Status:", errorMessage);
          }
        }
      );
      startPromiseRef.current = startPromise;
      startPromise.catch(() => {});

      await withTimeout(startPromise, 8000);
      if (attemptId && attemptId !== startAttemptIdRef.current) return;
      
      // Persist success state
      localStorage.setItem('camera_permission_granted', 'true');
      localStorage.setItem('last_camera_id', cameraId);
      
      setIsScannerStarted(true);
    } catch (err) {
      const error = err as Error;
      const name = error.name || "";
      const message = error.message || "";
      if (message === "TIMEOUT") {
        setError("Camera is taking too long to start. Click Enable Camera again.");
      } else if (name === "NotReadableError") {
        setError("Camera is already in use by another app/tab. Close other apps and try again.");
      } else {
        console.error("Failed to start scanning:", err);
        setError("Failed to start camera feed. Please click Enable Camera again.");
      }
      setIsScannerStarted(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    
    setActiveCameraId(nextCameraId);
    await startScanning(nextCameraId, ++startAttemptIdRef.current);
  };

  const handleClose = async () => {
    if (closing) return;
    setClosing(true);
    startAttemptIdRef.current += 1;

    try {
      await startPromiseRef.current?.catch(() => {});
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop().catch(() => {});
      }
      await Promise.resolve(scannerRef.current?.clear()).catch(() => {});
    } catch (err) {
      const error = err as Error;
      const message = error.message || "";
      if (!message.toLowerCase().includes("aborterror")) {
        console.error("Scanner stop error:", err);
      }
    } finally {
      scannerRef.current = null;
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Live Scanner</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", isScanning ? "bg-emerald-500 animate-pulse" : "bg-slate-300")}></span>
                {isScanning ? "Camera Active" : "Ready"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Scanner Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="relative group aspect-video overflow-hidden rounded-2xl bg-slate-900 border border-border/10 shadow-2xl">
            {/* The dedicated container for the scanner. React will not manage its children once scanner starts. */}
            <div 
              id="reader" 
              className={cn(
                "w-full h-full",
                !isScanning && "opacity-0"
              )} 
            />

            {/* Error UI */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 bg-slate-900 z-50">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white">Camera Error</h4>
                  <p className="text-sm text-slate-400">{error}</p>
                </div>
                <Button onClick={enableCamera} variant="outline" className="rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20" disabled={initializing || closing}>
                  {initializing ? "Requesting..." : "Retry Camera"}
                </Button>
              </div>
            )}
            
            {/* Initial Placeholder UI - Shown when not scanning and no error */}
            {!isScanning && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-40 bg-slate-900">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Camera className="w-7 h-7 text-white/60" />
                </div>
                <Button
                  onClick={enableCamera}
                  disabled={initializing || closing}
                  className="h-11 px-8 rounded-2xl font-black shadow-xl shadow-primary/30 text-base uppercase tracking-tight"
                >
                  {initializing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-3" />
                      Start Scanning
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Overlay elements shown when scanning */}
            {isScanning && !error && (
              <>
                <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl pointer-events-none shadow-[0_0_15px_rgba(var(--primary),0.3)] z-30 opacity-70"></div>
                <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl pointer-events-none shadow-[0_0_15px_rgba(var(--primary),0.3)] z-30 opacity-70"></div>
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl pointer-events-none shadow-[0_0_15px_rgba(var(--primary),0.3)] z-30 opacity-70"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl pointer-events-none shadow-[0_0_15px_rgba(var(--primary),0.3)] z-30 opacity-70"></div>
                
                {/* Scan line animation */}
                <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none z-30"></div>
              </>
            )}
          </div>


          <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3 items-start">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Scanning Tips</p>
              <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 leading-relaxed font-medium">
                Place the QR code or Barcode inside the frame. Camera will automatically detect and add the product.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-t flex items-center justify-between gap-4">
          {cameras.length > 1 && (
            <Button 
              variant="outline" 
              onClick={switchCamera}
              disabled={closing || !!error || initializing || !isScanning}
              className="h-11 flex-1 rounded-xl font-bold border-slate-200 text-slate-600 bg-white shadow-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Switch Camera
            </Button>
          )}
          <Button 
            variant={cameras.length > 1 ? "ghost" : "outline"}
            onClick={handleClose}
            disabled={closing}
            className={cn(
              "h-11 font-bold",
              cameras.length > 1 ? "px-6 text-slate-400" : "w-full rounded-xl border-slate-200 text-slate-600 bg-white shadow-sm"
            )}
          >
            {closing ? "Closing..." : "Cancel"}
          </Button>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); opacity: 0; }
          50% { transform: translateY(100px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
