import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera } from 'lucide-react';
import { Contact } from '../types';
import jsQR from 'jsqr';

interface QRScannerPageProps {
  onScan: (contact: Partial<Contact>) => void;
  onBack: () => void;
}

export function QRScannerPage({ onScan, onBack }: QRScannerPageProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let animationId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setError(t('qr.scanner.error'));
        console.error('Camera error:', err);
      }
    };

    const tick = () => {
      if (
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            try {
              const data = JSON.parse(code.data);
              if (data.type === 'ConnectMe') {
                // Get current location
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const contact: Partial<Contact> = {
                      ...data,
                      id: Date.now().toString(),
                      dateMet: new Date().toISOString(),
                      location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        address: 'Location captured',
                      },
                      notes: '',
                    };
                    onScan(contact);
                  },
                  (geoError) => {
                    console.error('Geolocation error:', geoError);
                    const contact: Partial<Contact> = {
                      ...data,
                      id: Date.now().toString(),
                      dateMet: new Date().toISOString(),
                      location: {
                        latitude: 0,
                        longitude: 0,
                        address: 'Location not available',
                      },
                      notes: '',
                    };
                    onScan(contact);
                  }
                );
                return;
              }
            } catch (e) {
              console.error('Invalid QR code data:', e);
            }
          }
        }
      }
      animationId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScan, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-amber-50">
      {/* Header */}
      <header className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('qr.scanner.backButton')}
        </button>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-blue-600 mb-2">{t('qr.scanner.title')}</h2>
            <p className="text-gray-600">{t('qr.scanner.description')}</p>
          </div>

          {/* Camera View */}
          <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden mb-6">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">{error}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-blue-500 rounded-2xl"></div>
                </div>
              </>
            )}
          </div>

          {/* Status */}
          {scanning && !error && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                {t('qr.scanner.scanning')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
