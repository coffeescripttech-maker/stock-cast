import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Keyboard } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useDataStore } from '../../stores/dataStore';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Retail barcode formats the Chromium BarcodeDetector understands
const FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'codabar',
  'itf',
  'qr_code',
];

export function ScannerModal({ open, onOpenChange }: ScannerModalProps) {
  const products = useDataStore((s) => s.products);
  const addToCart = usePOSStore((s) => s.addToCart);
  const showToast = useUIStore((s) => s.showToast);

  const [barcode, setBarcode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveOn, setLiveOn] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastHitRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  // BarcodeDetector is Chromium-only (Chrome desktop / Electron / Android). iOS Safari & Firefox don't have it.
  const canLiveScan = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // ---- Shared lookup: used by live scan, photo decode, and manual entry ----
  function handleBarcode(raw: string) {
    const code = raw.trim();
    if (!code) return;

    const rt = products.find((p) => p.retailBarcode === code);
    const ws = products.find((p) => p.wholesaleBarcode === code);

    if (rt) {
      addToCart(rt.id, rt.name, 'rt', rt.retailPrice);
      showToast(`Added ${rt.name} (RT)`, 'success');
      onOpenChange(false);
    } else if (ws) {
      addToCart(ws.id, ws.name, 'ws', ws.wholesalePrice);
      showToast(`Added ${ws.name} (WS)`, 'success');
      onOpenChange(false);
    } else {
      showToast(`Product not found: ${code}`, 'error');
    }
  }

  // ---- Camera lifecycle ----
  function stopCamera() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function startDetector() {
    let detector: BarcodeDetector | null = null;
    try {
      detector = new BarcodeDetector({ formats: FORMATS });
    } catch {
      detector = null;
    }
    if (!detector) {
      setLiveOn(false);
      setCameraError('Barcode detection is not available on this device — take a photo or type instead.');
      return;
    }

    // Poll the video frames; add the product the moment a stable barcode appears.
    timerRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const codes = await detector!.detect(video);
        if (codes.length > 0) {
          const code = codes[0].rawValue;
          const now = Date.now();
          const last = lastHitRef.current;
          // Ignore the same code within 1.2s so a stale frame can't double-add
          if (code !== last.code || now - last.at > 1200) {
            lastHitRef.current = { code, at: now };
            handleBarcode(code);
          }
        }
      } catch {
        // detect() can throw mid-frame; just try the next frame
      }
    }, 180);
  }

  async function startLive() {
    try {
      // facingMode 'environment' = rear camera on phones
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setLiveOn(true);
      setCameraError(null);
      startDetector();
    } catch {
      // Retry once without the facingMode constraint (desktop webcams have no rear camera)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setLiveOn(true);
        setCameraError(null);
        startDetector();
      } catch {
        setLiveOn(false);
        setCameraError('Camera unavailable — take a photo or type the barcode instead.');
      }
    }
  }

  // Start camera when the modal opens
  useEffect(() => {
    if (open) {
      setBarcode('');
      setCameraError(null);
      lastHitRef.current = { code: '', at: 0 };
      setTimeout(() => inputRef.current?.focus(), 50);
      if (canLiveScan) startLive();
    }
  }, [open, canLiveScan]);

  // Stop camera when the modal closes (or on unmount)
  useEffect(() => {
    if (!open) {
      stopCamera();
      setLiveOn(false);
    }
  }, [open]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ---- Manual entry ----
  function handleSubmit() {
    if (!barcode.trim()) return;
    handleBarcode(barcode);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ---- Photo fallback: decode a captured/selected image with jsQR ----
  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no 2d context');

      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const result = jsQR(data, width, height);
      if (result?.data) {
        handleBarcode(result.data);
      } else {
        showToast('No barcode found in photo — try again', 'error');
      }
    } catch {
      showToast('Could not read that photo', 'error');
    } finally {
      URL.revokeObjectURL(url);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const manualInputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 font-mono tracking-wider';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Barcode Scanner"
      subtitle="Point your camera at the barcode, take a photo, or type it manually"
      className="w-[420px]"
    >
      <div className="space-y-4">
        {/* ─── Live camera preview (Chromium only) ─── */}
        {canLiveScan ? (
          <div className="relative h-52 rounded-xl overflow-hidden bg-slate-900">
            <video
              ref={videoRef}
              playsInline
              muted
              className={liveOn ? 'w-full h-full object-cover' : 'hidden'}
            />
            {liveOn && (
              <>
                {/* Corner brackets + scanning beam */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-4/5 h-2/5">
                    <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand rounded-br-lg" />
                    <div className="absolute left-4 right-4 h-[2px] bg-brand/70 shadow-[0_0_8px_rgba(200,255,90,0.5)] animate-[scanBeam_2s_ease-in-out_infinite]" />
                  </div>
                </div>
                <p className="absolute bottom-2 inset-x-0 text-center text-[10px] text-white/60 font-mono">
                  Live scanning — align barcode inside the frame
                </p>
              </>
            )}
            {!liveOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
                <Camera size={26} className="text-slate-500" />
                <p className="text-xs text-slate-400">{cameraError ?? 'Starting camera…'}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-28 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-center px-4">
            <Camera size={22} className="text-slate-300" />
            <p className="text-xs text-slate-400">This browser doesn't support live scanning — take a photo instead.</p>
          </div>
        )}

        {/* ─── Take Photo / Type toggles ─── */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-[#1C1C1C] font-bold text-sm cursor-pointer transition-all active:scale-[0.97]">
            <Camera size={16} />
            Take Photo
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhoto}
            />
          </label>
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm transition-all active:scale-[0.97]"
          >
            <Keyboard size={16} />
            Type Barcode
          </button>
        </div>

        {/* ─── Manual entry (also where USB keyboard-wedge scanners type) ─── */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barcode</label>
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode or type manually…"
            className={manualInputClass}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add to Cart</Button>
        </div>
      </div>
    </Dialog>
  );
}
