'use client';

import * as React from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  facingMode?: 'user' | 'environment';
  className?: string;
}

export function CameraCapture({
  onCapture,
  onClose,
  facingMode = 'environment',
  className,
}: CameraCaptureProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string>('');
  const [currentFacingMode, setCurrentFacingMode] = React.useState(facingMode);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [currentFacingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setError('');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(
        'Unable to access camera. Please ensure you have granted camera permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = canvas.toDataURL('image/jpeg');
          setCapturedImage(imageUrl);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const switchCamera = () => {
    stopCamera();
    setCurrentFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className={cn('fixed inset-0 z-50 bg-black', className)}>
      {/* Camera View */}
      {!capturedImage && (
        <>
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-white p-6">
              <p className="text-center mb-4">{error}</p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Camera Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-6 h-6" />
                  </Button>

                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-white/30 hover:scale-105 transition-transform active:scale-95"
                    aria-label="Capture"
                  />

                  <Button
                    onClick={switchCamera}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Preview */}
      {capturedImage && (
        <>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />

          {/* Preview Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>

              <Button
                onClick={confirmPhoto}
                className="flex-1 bg-white text-black hover:bg-white/90"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
