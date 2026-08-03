import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Scanner, type IScannerError, type TrackFunction } from '@yudiel/react-qr-scanner';
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

/**
 * Turn a @yudiel Scanner error into a friendly message.
 * The library already classifies the failure kind, which lets us explain the
 * all-too-common "insecure context" case (plain http:// on a phone) instead of
 * showing a generic "camera unavailable".
 */
function describeScanError(e: IScannerError): string {
  switch (e.kind) {
    case 'permission-denied':
      return 'Camera permission was denied. Allow it in your browser settings.';
    case 'no-camera':
      return 'No camera found on this device.';
    case 'in-use':
      return 'Camera is in use by another app.';
    case 'insecure-context':
      return 'Camera is blocked — this page is not HTTPS, so the phone browser disables it. Use the APK or an HTTPS server to scan live.';
    case 'unsupported':
      return 'Live scanning is not supported in this browser — take a photo or type instead.';
    case 'overconstrained':
      return 'No rear camera was found — trying the default camera.';
    case 'security':
      return 'Camera blocked by an additional security policy.';
    case 'aborted':
    case 'type-error':
    case 'unknown':
    default:
      return e.message || 'Could not start the camera.';
  }
}

/**
 * Custom tracking overlay: draws a green bounding box and red corner-point
 * markers on every barcode currently visible to the camera. The tracker canvas
 * is reused across frames, so we clear it first every call.
 */
const drawTracker: TrackFunction = (detectedCodes, ctx) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const b of detectedCodes) {
    const box = b.boundingBox;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.fillStyle = '#ef4444';
    for (const p of b.cornerPoints) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

export function ScannerModal({ open, onOpenChange }: ScannerModalProps) {
  const products = useDataStore((s) => s.products);
  const addToCart = usePOSStore((s) => s.addToCart);
  const showToast = useUIStore((s) => s.showToast);

  const [barcode, setBarcode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastHitRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });

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

  // ---- Live scan via @yudiel/react-qr-scanner (ZXing WASM under the hood) ----
  function handleScanResult(codes: { rawValue: string }[]) {
    const clean = (codes[0]?.rawValue || '').trim();
    if (!clean) return;

    const now = Date.now();
    const last = lastHitRef.current;
    // Ignore the same code within 1.2s so a persisted frame can't double-add
    if (clean !== last.code || now - last.at > 1200) {
      lastHitRef.current = { code: clean, at: now };
      if (cameraError) setCameraError(null);
      // Freeze the frame after a hit so a held/live barcode can't re-fire
      // while the user reads the result; they can Resume to scan again.
      setPaused(true);
      handleBarcode(clean);
    }
  }

  // Reset the dedup guard whenever the modal opens
  useEffect(() => {
    if (open) {
      setBarcode('');
      setCameraError(null);
      setPaused(false);
      lastHitRef.current = { code: '', at: 0 };
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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

  /**
   * Decode a barcode/QR from a canvas of the given size. Phone photos are
   * thousands of pixels across, which makes jsQR slow and unreliable, so we
   * downscale first and try a few pre-processed variants (normal, inverted,
   * grayscale) — this catches barcodes on dark backgrounds or hard lighting.
   */
  function decodeImageData(
    w: number,
    h: number,
    build: (ctx: CanvasRenderingContext2D) => Uint8ClampedArray
  ): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    try {
      const data = build(ctx);
      // attemptBoth lets jsQR try the raw and the colour-inverted forms itself.
      const result = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' } as never);
      if (result?.data) return result.data;
    } catch {
      // A variant can throw (e.g. oversized for jsQR); just fall through.
    }
    return null;
  }

  async function decodeBarcodeImage(img: HTMLImageElement): Promise<string | null> {
    const SW = img.naturalWidth;
    const SH = img.naturalHeight;
    if (!SW || !SH) return null;

    // jsQR performs best (and runs fast) around 700–1280px; 4000px phone
    // photos hurt accuracy and speed.
    const MAX = 1280;
    const scale = Math.min(1, MAX / Math.max(SW, SH));
    const w = Math.max(1, Math.round(SW * scale));
    const h = Math.max(1, Math.round(SH * scale));

    // 1) Downscaled original — the most reliable for 1D barcodes.
    let found = decodeImageData(w, h, (ctx) => {
      ctx.drawImage(img, 0, 0, w, h);
      return ctx.getImageData(0, 0, w, h).data;
    });
    if (found) return found;

    // 2) Inverted (light barcode on a dark label).
    found = decodeImageData(w, h, (ctx) => {
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const out = new Uint8ClampedArray(d.length);
      for (let i = 0; i < d.length; i += 4) {
        out[i] = 255 - d[i];
        out[i + 1] = 255 - d[i + 1];
        out[i + 2] = 255 - d[i + 2];
        out[i + 3] = 255;
      }
      return out;
    });
    if (found) return found;

    // 3) Grayscale luminance boost — helps worn/creased labels.
    found = decodeImageData(w, h, (ctx) => {
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const out = new Uint8ClampedArray(d.length);
      for (let i = 0; i < d.length; i += 4) {
        const l = (111 * d[i] + 616 * d[i + 1] + 60 * d[i + 2]) >> 10;
        out[i] = l; out[i + 1] = l; out[i + 2] = l; out[i + 3] = 255;
      }
      return out;
    });
    return found;
  }

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

      const code = await decodeBarcodeImage(img);
      if (code) {
        handleBarcode(code);
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
        {/* ─── Live camera preview ─── */}
        <div className="relative h-52 rounded-xl overflow-hidden bg-slate-900">
          <Scanner
            onScan={handleScanResult}
            onError={(err) => setCameraError(describeScanError(err))}
            constraints={{ facingMode: 'environment' }}
            paused={paused}
            components={{ finder: false, tracker: drawTracker }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { width: '100%', height: '100%', objectFit: 'cover' },
            }}
          />
          {paused && !cameraError && (
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="absolute bottom-2 right-2 z-10 px-3 py-1.5 rounded-lg bg-brand text-[#1C1C1C] text-xs font-bold shadow-lg transition-transform active:scale-95"
            >
              ↻ Resume
            </button>
          )}
          {!cameraError && !paused && (
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
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 bg-slate-900">
              <Camera size={26} className="text-slate-500" />
              <p className="text-xs text-slate-400">{cameraError}</p>
            </div>
          )}
        </div>

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