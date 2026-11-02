import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minBarcodeLength?: number;
  maxKeyIntervalMs?: number;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minBarcodeLength = 6,
  maxKeyIntervalMs = 60,
  enabled = true
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is intentionally typing into a regular input or textarea
      // UNLESS the keystrokes arrive with super-human speed (<40ms), which signifies a USB scanner
      const target = event.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const now = performance.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Handle barcode termination (Enter key)
      if (event.key === 'Enter') {
        const buffered = bufferRef.current.trim();
        if (buffered.length >= minBarcodeLength) {
          event.preventDefault();
          event.stopPropagation();
          onScan(buffered);
        }
        bufferRef.current = '';
        return;
      }

      // If the time between characters is too long and not already buffering, reset
      if (interval > maxKeyIntervalMs && bufferRef.current.length > 0) {
        // Human typing or pause - clear buffer unless it's the very start
        if (interval > 150) {
          bufferRef.current = '';
        }
      }

      // Only buffer printable alphanumeric characters
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // If in input field, only capture if clearly scanner speed
        if (isInput && interval > maxKeyIntervalMs && bufferRef.current.length === 0) {
          return;
        }
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minBarcodeLength, maxKeyIntervalMs, onScan]);
}
