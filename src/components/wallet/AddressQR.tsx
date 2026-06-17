// src/components/wallet/AddressQR.tsx
import { useEffect, useRef } from 'react';

/**
 * Lightweight QR renderer using the `qrcode` library.
 * npm i qrcode  (and @types/qrcode)
 */
import QRCode from 'qrcode';

export function AddressQR({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} className="rounded-xl" />;
}
