import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scan, Package, Plus, Minus, Camera, CameraOff, Keyboard, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useProducts, Product } from "@/contexts/ProductsContext";

export const ScanPage = () => {
  const { products, updateProduct } = useProducts();
  const [barcode, setBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanMode, setScanMode] = useState<'manual' | 'camera' | 'handheld'>('handheld');

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Handheld scanner buffer
  const scanBufferRef = useRef<string>("");
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Code Reader
  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8
    ]);

    codeReaderRef.current = new BrowserMultiFormatReader(hints);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync video stream when camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      console.log("🔗 Attaching stream to video element...");
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Handheld Scanner Logic
  useEffect(() => {
    if (inputRef.current && scanMode === 'handheld') {
      inputRef.current.focus();
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (scanMode !== 'handheld' || !inputRef.current) return;

      if (e.key === 'Enter' && scanBufferRef.current.length > 0) {
        setBarcode(scanBufferRef.current);
        lookupProduct(scanBufferRef.current);
        scanBufferRef.current = "";
        return;
      }

      if (e.key.length === 1 && /[0-9a-zA-Z-]/.test(e.key)) {
        scanBufferRef.current += e.key;
        setBarcode(scanBufferRef.current);

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        scanTimeoutRef.current = setTimeout(() => {
          scanBufferRef.current = "";
        }, 2000);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [scanMode]);

  const startCamera = async () => {
    try {
      console.log("🎥 Requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log("✅ Camera stream obtained:", stream.getVideoTracks()[0].label);

      streamRef.current = stream;

      // First activate camera (this renders the video element)
      setIsCameraActive(true);
      setScanMode('camera');

      toast({
        title: "Camera Ready",
        description: "Point at barcode and click 'Capture & Scan'",
      });

    } catch (error: any) {
      console.error("❌ Camera error:", error);
      toast({
        title: "Camera Error",
        description: error.name === 'NotAllowedError'
          ? "Camera permission denied. Please allow camera access."
          : error.message || "Unable to access camera. Check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setScanMode('handheld');
  };

  const captureAndDecode = async () => {
    if (!videoRef.current || !canvasRef.current || !codeReaderRef.current) {
      console.error("Missing refs:", { video: !!videoRef.current, canvas: !!canvasRef.current, reader: !!codeReaderRef.current });
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;

      if (videoW === 0 || videoH === 0) {
        throw new Error("Video not ready. Please wait for camera to initialize.");
      }

      // Performance optimization for frequent readbacks
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas context not available");

      // Stage 1: Try Cropped Center Area (Better for small barcodes)
      const focusSize = Math.min(videoW, videoH) * 0.8;
      const cropW = focusSize;
      const cropH = focusSize * 0.6;
      const startX = (videoW - cropW) / 2;
      const startY = (videoH - cropH) / 2;

      canvas.width = cropW;
      canvas.height = cropH;

      // Apply image enhancement filters to help detection
      ctx.filter = 'contrast(1.2) brightness(1.1)';
      ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

      console.log("🔍 Attempt 1: Cropped center area...");

      try {
        const result = await codeReaderRef.current.decodeFromCanvas(canvas);
        handleDecodeSuccess(result.getText());
        return;
      } catch (cropError) {
        console.log("⚠️ Attempt 1 failed, trying fallback...");

        // Stage 2: Try Full Frame Fallback
        ctx.filter = 'none'; // Clear filters to try raw frame
        canvas.width = videoW;
        canvas.height = videoH;
        ctx.drawImage(video, 0, 0, videoW, videoH);

        console.log("🔍 Attempt 2: Full frame fallback...");
        const result = await codeReaderRef.current.decodeFromCanvas(canvas);
        handleDecodeSuccess(result.getText());
      }

    } catch (error: any) {
      console.error("❌ Decode error:", error);

      if (error.name === 'NotFoundException' || error.message?.includes('No MultiFormat Readers')) {
        toast({
          title: "No Code Found",
          description: "Try moving the camera closer/further or improving lighting.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scan Error",
          description: error.message || "Failed to process image.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDecodeSuccess = (code: string) => {
    console.log("✅ Successfully decoded:", code);
    setBarcode(code);
    lookupProduct(code);

    toast({
      title: "Code Captured!",
      description: `Detected: ${code}`,
    });
  };

  const lookupProduct = (code: string) => {
    if (!code.trim()) return;

    setIsLookingUp(true);

    setTimeout(() => {
      const foundProduct = products.find(p =>
        p.sku.toLowerCase() === code.toLowerCase() ||
        p.id.toString() === code
      );

      if (foundProduct) {
        setScannedProduct(foundProduct);
        setAdjustment(0);
        toast({
          title: "Product Found",
          description: `Loaded ${foundProduct.name}`,
        });
      } else {
        setScannedProduct(null);
        toast({
          title: "Not Found",
          description: `No product with code: ${code}`,
          variant: "destructive"
        });
      }
      setIsLookingUp(false);
    }, 400);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupProduct(barcode);
  };

  const handleStockAdjustment = (type: "add" | "remove") => {
    const amount = 1;
    const newAdjustment = type === "add" ? adjustment + amount : adjustment - amount;
    setAdjustment(newAdjustment);
  };

  const handleSave = () => {
    if (!scannedProduct) return;

    const newStock = scannedProduct.quantity + adjustment;

    if (newStock < 0) {
      toast({
        title: "Invalid Stock",
        description: "Stock cannot be negative",
        variant: "destructive"
      });
      return;
    }

    updateProduct(scannedProduct.id, {
      ...scannedProduct,
      quantity: newStock
    });

    setScannedProduct({
      ...scannedProduct,
      quantity: newStock
    });

    toast({
      title: "Stock Updated",
      description: `${scannedProduct.name} now has ${newStock} units`,
    });

    setAdjustment(0);
  };

  const clearScan = () => {
    setBarcode("");
    setScannedProduct(null);
    setAdjustment(0);
    scanBufferRef.current = "";
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Inventory Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Real-time stock management via Camera, Handheld, or Manual Entry
        </p>
      </div>

      {/* Scanner Method Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Scanning Method</CardTitle>
          <CardDescription>Select your input source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={scanMode === 'handheld' ? 'default' : 'outline'}
              onClick={() => {
                setIsCameraActive(false);
                setScanMode('handheld');
                setScannedProduct(null);
              }}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Keyboard className="w-6 h-6" />
              <span className="text-sm">Handheld Scanner</span>
              <span className="text-[10px] text-muted-foreground">USB/Bluetooth Gun</span>
            </Button>

            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              onClick={isCameraActive ? stopCamera : startCamera}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              {isCameraActive ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              <span className="text-sm">
                {isCameraActive ? 'Stop Camera' : 'Camera Scan'}
              </span>
              <span className="text-[10px] text-muted-foreground">Webcam/Phone</span>
            </Button>

            <Button
              variant={scanMode === 'manual' ? 'default' : 'outline'}
              onClick={() => {
                setIsCameraActive(false);
                setScanMode('manual');
                setScannedProduct(null);
              }}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Scan className="w-6 h-6" />
              <span className="text-sm">Manual Entry</span>
              <span className="text-[10px] text-muted-foreground">Type Code</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera View with Snapshot */}
      {isCameraActive && (
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-primary" />
              <span>Camera Scanner (Snapshot Mode)</span>
            </CardTitle>
            <CardDescription>
              Align barcode within frame, then click "Capture & Scan"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/50 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  console.log("✅ Video metadata loaded:", {
                    width: video.videoWidth,
                    height: video.videoHeight,
                    readyState: video.readyState
                  });
                }}
                onError={(e) => {
                  console.error("❌ Video element error:", e);
                }}
                onPlay={() => {
                  console.log("✅ Video started playing");
                }}
              />

              {/* Scanner Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[60%] md:w-72 md:h-40 border-2 border-primary/40 rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-sm"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-sm"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-sm"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-sm"></div>
                </div>
              </div>

              {/* Tip */}
              <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                <span className="bg-black/70 text-[10px] text-white/90 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm inline-block">
                  Position code in frame, avoid glare, then capture
                </span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                size="lg"
                onClick={captureAndDecode}
                disabled={isCapturing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isCapturing ? "Processing..." : "📸 Capture & Scan"}
              </Button>
              <Button variant="outline" onClick={stopCamera} className="w-full">
                Close Camera
              </Button>
            </div>

            {/* Camera Mode Results */}
            {scannedProduct && scanMode === 'camera' && (
              <div className="pt-4 border-t">
                <ProductDetails
                  product={scannedProduct}
                  adjustment={adjustment}
                  onAdjust={handleStockAdjustment}
                  onSave={handleSave}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual/Handheld Input */}
      {(scanMode === 'manual' || scanMode === 'handheld') && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {scanMode === 'handheld' ? (
                <Keyboard className="w-5 h-5 text-primary" />
              ) : (
                <Scan className="w-5 h-5 text-primary" />
              )}
              <span>
                {scanMode === 'handheld' ? 'Handheld Scanner Ready' : 'Manual Entry'}
              </span>
            </CardTitle>
            <CardDescription>
              {scanMode === 'handheld'
                ? 'Scan with your handheld device - input is auto-focused'
                : 'Type or paste the barcode/SKU'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode / SKU</Label>
                <Input
                  ref={inputRef}
                  id="barcode"
                  type="text"
                  placeholder={scanMode === 'handheld' ? 'Ready for scanner...' : 'e.g. IP15P-256'}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="font-mono text-lg py-6"
                  disabled={isLookingUp}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  variant="default"
                  className="flex-1"
                  disabled={!barcode.trim() || isLookingUp}
                >
                  {isLookingUp ? "Searching..." : "Lookup Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearScan}
                >
                  Clear
                </Button>
              </div>
            </form>

            {/* Manual/Handheld Mode Results */}
            {scannedProduct && (scanMode === 'manual' || scanMode === 'handheld') && (
              <div className="pt-4 border-t">
                <ProductDetails
                  product={scannedProduct}
                  adjustment={adjustment}
                  onAdjust={handleStockAdjustment}
                  onSave={handleSave}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Product Details Component
const ProductDetails = ({
  product,
  adjustment,
  onAdjust,
  onSave
}: {
  product: Product;
  adjustment: number;
  onAdjust: (type: "add" | "remove") => void;
  onSave: () => void;
}) => (
  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
    <div className="flex items-center gap-2 mb-3">
      <Package className="w-5 h-5 text-success" />
      <h3 className="font-semibold text-lg">Product Found</h3>
    </div>

    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg">
      <div>
        <Label className="text-xs text-muted-foreground">SKU</Label>
        <p className="font-mono font-semibold">{product.sku}</p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Name</Label>
        <p className="font-semibold">{product.name}</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg">
      <div className="text-center">
        <Label className="text-xs text-muted-foreground">Stock</Label>
        <p className="text-xl font-bold text-primary">{product.quantity}</p>
      </div>
      <div className="text-center border-x border-muted">
        <Label className="text-xs text-muted-foreground">Cost</Label>
        <p className="font-medium">${product.cost}</p>
      </div>
      <div className="text-center">
        <Label className="text-xs text-muted-foreground">Price</Label>
        <p className="font-medium">${product.price}</p>
      </div>
    </div>

    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="font-semibold">Adjust Stock</Label>
        <Badge variant="outline" className="px-3">
          New: {product.quantity + adjustment}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdjust("remove")}
            className="h-10 w-10 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="w-20 text-center font-mono text-xl font-bold">
            {adjustment > 0 ? `+${adjustment}` : adjustment}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdjust("add")}
            className="h-10 w-10 hover:bg-success hover:text-success-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <Button
          className="flex-1 h-12 shadow-lg"
          onClick={onSave}
          disabled={adjustment === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  </div>
);