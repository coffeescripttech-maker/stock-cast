import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { fmtCurrency, fmtDate } from '../../lib/formatters';
import type { Transaction } from '../../types/transaction';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Transaction | null;
  printMode?: boolean;
  onPrint?: () => void;
}

export function ReceiptModal({ open, onOpenChange, receipt, printMode, onPrint }: ReceiptModalProps) {
  if (!receipt) return null;

  const rtItems = receipt.items.filter((i) => i.type === 'rt');
  const wsItems = receipt.items.filter((i) => i.type === 'ws');
  const rtSubtotal = rtItems.reduce((s, i) => s + i.qty * i.price, 0);
  const wsSubtotal = wsItems.reduce((s, i) => s + i.qty * i.price, 0);
  const totalItems = receipt.items.reduce((s, i) => s + i.qty, 0);

  const dash = '─'.repeat(48);

  const typeLabel = receipt.type === 'rt' ? 'RETAIL' : receipt.type === 'ws' ? 'WHOLESALE' : 'MIXED (Retail + Wholesale)';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title=""
      showClose={!printMode}
      hideOverlayClose={printMode}
      className="w-[420px]"
    >
      {/* Receipt content - also used for print */}
      <div className="receipt-text space-y-1.5">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-bold tracking-widest">RUIZ STORE</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Point of Sale Receipt</p>
        </div>
        <div className="font-mono text-[10px] text-slate-300">{dash}</div>

        {/* Meta */}
        <div className="space-y-0.5 text-[11px]">
          <Row label="Date:" value={fmtDate(receipt.date)} />
          <Row label="Cashier:" value={receipt.cashier} />
          <Row label="Txn #:" value={receipt.id} mono />
          {receipt.customerName && <Row label="Customer:" value={receipt.customerName} />}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">Type:</span>
            <span className={[
              'text-[10px] font-bold px-2 py-0.5 rounded text-white',
              receipt.type === 'ws' ? 'bg-amber-500' : 'bg-brand',
            ].join(' ')}>
              {typeLabel}
            </span>
          </div>
        </div>
        <div className="font-mono text-[10px] text-slate-300">{dash}</div>

        {/* Items header */}
        <div className="flex text-[10px] font-semibold text-slate-500">
          <span className="flex-1">Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-16 text-right">Price</span>
          <span className="w-16 text-right">Total</span>
        </div>
        <div className="font-mono text-[10px] text-slate-300 mb-1">{dash}</div>

        {/* Items */}
        {receipt.items.map((item, i) => (
          <div key={i} className="flex text-[11px]">
            <span className="flex-1 truncate">
              {item.name}{' '}
              <span className={[
                'text-[8px] font-bold px-1 py-0.5 rounded',
                item.type === 'ws'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700',
              ].join(' ')}>
                {item.type.toUpperCase()}
              </span>
            </span>
            <span className="w-8 text-center">{item.qty}</span>
            <span className="w-16 text-right">₱{fmtCurrency(item.price)}</span>
            <span className="w-16 text-right">₱{fmtCurrency(item.qty * item.price)}</span>
          </div>
        ))}

        <div className="font-mono text-[10px] text-slate-300 mt-2">{dash}</div>

        {/* Subtotals */}
        {rtItems.length > 0 && (
          <SubtotalRow label="🛒 Retail subtotal:" value={rtSubtotal} />
        )}
        {wsItems.length > 0 && (
          <SubtotalRow label="📦 Wholesale subtotal:" value={wsSubtotal} />
        )}
        {receipt.discount > 0 && (
          <div className="flex justify-between text-[11px] text-emerald-600">
            <span>🎁 Points redemption ({receipt.pointsRedeemed} pts):</span>
            <span>-₱{fmtCurrency(receipt.discount)}</span>
          </div>
        )}

        <div className="font-mono text-[10px] text-slate-300">{dash}</div>

        <div className="flex justify-between text-[11px]">
          <span>Total items:</span>
          <span>{totalItems}</span>
        </div>

        <div className="flex justify-between text-sm font-bold border-t border-slate-300 dark:border-slate-600 pt-1.5 mt-1.5">
          <span>GRAND TOTAL</span>
          <span>₱{fmtCurrency(receipt.total)}</span>
        </div>

        {receipt.amountTendered != null && (
          <>
            <div className="font-mono text-[10px] text-slate-300">{dash}</div>
            <div className="flex justify-between text-[11px]">
              <span>Cash Tendered:</span>
              <span>₱{fmtCurrency(receipt.amountTendered)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span>Change:</span>
              <span>₱{fmtCurrency(receipt.change)}</span>
            </div>
          </>
        )}

        {receipt.pointsEarned && receipt.pointsEarned > 0 && (
          <div className="text-center text-[10px] text-brand font-mono mt-1">
            ★ +{receipt.pointsEarned} points earned for {receipt.customerName}
          </div>
        )}

        <div className="font-mono text-[10px] text-slate-300">{dash}</div>

        {/* Footer */}
        <div className="text-center text-[11px] pt-1">
          <p>Thank you for shopping at</p>
          <p className="font-bold">Ruiz Store!</p>
          <p className="text-[10px] text-slate-400 mt-1">Please come again 🙂</p>
        </div>
      </div>

      {/* Print hint & button */}
      {printMode && (
        <p className="text-xs text-brand text-center mt-5">
          Press <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">Enter</kbd> to print &amp; clear for next customer
        </p>
      )}

      <div className="flex justify-center mt-4">
        <Button variant="primary" onClick={onPrint}>
          🖨️ Print Receipt
        </Button>
      </div>
    </Dialog>
  );
}

/* --- Helpers --- */

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}

function SubtotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span>{label}</span>
      <span>₱{fmtCurrency(value)}</span>
    </div>
  );
}
