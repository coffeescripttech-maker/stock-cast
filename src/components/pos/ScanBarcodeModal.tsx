import { useEffect, useRef, useState } from 'react';
import { Scanner, type IScannerError, type TrackFunction } from '@yudiel/react-qr-scanner';
import { Camera } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface ScanBarcodeModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  /** Called once with the decoded barcode the moment one is read. */
  onScan: (code: string) => void;
}

/** Bounding-box + corner-point overlay, shared across scan dialogs. */
const drawTracker: TrackFunction = (codes, ctx) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const b of codes) {
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

function scanErrorText(e: IScannerError): string {
  switch (e.kind) {
    case 'permission-denied': return 'Camera permission was denied. Allow it in browser settings.';
    case 'insecure-context': return 'Camera is blocked — this page is not HTTPS. Use an HTTPS server or the APK to scan.';
    case 'unsupported': return 'Live scanning is not supported in this browser.';
    case 'no-camera': return 'No camera found on this device.';
    case 'in-use': return 'Camera is in use by another app.';
    case 'overconstrained': return 'No rear camera found.';
    default: return e.message || 'Could not start the camera.';
  }
}

/**
 * A minimal full-camera barcode scanner used to fill a single field
 * (e.g. the Retail/Wholesale barcode in the product form). Scans once, then
 * closes and hands the code to `onScan`.
 */
export function ScanBarcodeModal({ open, onClose, onScan, title = 'Scan Barcode' }: ScanBarcodeModalProps) {
  const [error, setError] = useState<string | null>(null);
  const lastHitRef = useRef('');

  useEffect(() => {
    if (open) {
      setError(null);
      lastHitRef.current = '';
    }
  }, [open]);

  function handleScan(codes: { rawValue: string }[]) {
    const code = (codes[0]?.rawValue || '').trim();
    if (!code || code === lastHitRef.current) return;
    lastHitRef.current = code;
    onScan(code);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }} title={title} subtitle="Align a barcode in the frame to read it" className="w-[420px]">
      <div className="space-y-4">
        <div className="relative h-56 rounded-xl overflow-hidden bg-slate-900">
          <Scanner
            onScan={handleScan}
            onError={(err) => setError(scanErrorText(err))}
            constraints={{ facingMode: 'environment' }}
            components={{ finder: false, tracker: drawTracker }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { width: '100%', height: '100%', objectFit: 'cover' },
            }}
          />
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 bg-slate-900">
              <Camera size={26} className="text-slate-500" />
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          ) : (
            <p className="absolute bottom-2 inset-x-0 text-center text-[10px] text-white/60 font-mono">
              Align the barcode inside the box — it reads automatically
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Dialog>
  );
}