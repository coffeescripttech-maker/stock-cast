import { generateBarcodePattern } from '../../lib/barcode';

interface BarcodeVisualProps {
  code?: string;
  small?: boolean;
}

export function BarcodeVisual({ code, small }: BarcodeVisualProps) {
  const pattern = generateBarcodePattern();

  return (
    <div className={`flex items-center gap-px ${small ? 'py-1' : 'py-1.5'}`}>
      {pattern.map((w, i) => (
        <span
          key={i}
          style={{ width: small ? w : w * 1.5 }}
          className={i % 2 === 0 ? 'bg-slate-800 dark:bg-slate-200' : 'bg-transparent'}
        />
      ))}
      {code && (
        <span className="font-mono text-[10px] text-slate-400 ml-2 tracking-widest">{code}</span>
      )}
    </div>
  );
}
