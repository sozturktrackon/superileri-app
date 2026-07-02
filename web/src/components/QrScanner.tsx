import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/**
 * Full-screen camera QR scanner (phone). Reads the code shown on the TV and
 * returns the 6-digit code. Uses getUserMedia + jsQR because iOS Safari has no
 * built-in BarcodeDetector. Point at the TV's QR and it pairs automatically.
 */
const QrScanner = ({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let done = false;

    const scan = () => {
      const video = videoRef.current;
      if (!done && video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(img.data, img.width, img.height);
        const match = found?.data.match(/(\d{6})/);
        if (match) {
          done = true;
          onDetected(match[1]);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (done) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.play().catch(() => {});
        }
        rafRef.current = requestAnimationFrame(scan);
      })
      .catch(() => {
        setError(
          'Could not open the camera. Allow camera access, or type the code instead.'
        );
      });

    return () => {
      done = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="scanner-overlay">
      <video ref={videoRef} className="scanner-video" muted playsInline />
      <div className="scanner-frame" />
      <div className="scanner-hint">
        {error ?? 'Point at the QR code on your TV'}
      </div>
      <button className="btn primary scanner-close" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
};

export default QrScanner;
