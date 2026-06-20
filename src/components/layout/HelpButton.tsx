import { HelpCircle } from 'lucide-react';

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-brand transition-colors z-50"
      title="Help"
    >
      <HelpCircle size={18} />
    </button>
  );
}

export function HelpModalContent() {
  const shortcuts = [
    { key: 'F4', desc: 'Print last receipt' },
    { key: 'F8', desc: 'Complete checkout' },
    { key: 'F9', desc: 'Clear cart' },
    { key: 'F11', desc: 'Link NFC customer' },
    { key: 'F12', desc: 'Open barcode scanner' },
    { key: 'Enter', desc: 'Confirm payment / Print receipt' },
    { key: '↑↓', desc: 'Navigate search results' },
  ];

  return (
    <table className="w-full border-none">
      <tbody>
        {shortcuts.map((s) => (
          <tr key={s.key}>
            <td className="border-none py-2 pr-4 font-bold font-mono text-brand text-sm">{s.key}</td>
            <td className="border-none py-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
