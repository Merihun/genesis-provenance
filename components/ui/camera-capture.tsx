'use client';

import * as React from 'react';
import { Camera, X, RotateCcw, Check, Info, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { getPhotoGuidance, getGenericGuidance, type PhotoGuidance } from '@/lib/photo-guidance';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  documentType?: string; // e.g., 'watch_front', 'car_vin', etc.
  facingMode?: 'user' | 'environment';
  className?: string;
}

export function CameraCapture({
  onCapture,
  onClose,
  documentType,
  facingMode = 'environment',
  className,
}: CameraCaptureProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string>('');
  const [currentFacingMode, setCurrentFacingMode] = React.useState(facingMode);
  const [showGuidance, setShowGuidance] = React.useState(true);
  const [checklistVisible, setChecklistVisible] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const guidance = documentType ? getPhotoGuidance(documentType) : getGenericGuidance();

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

  const renderOverlay = () => {
    if (!guidance?.overlay || capturedImage) return null;

    const { type, size = 'medium', position = 'center' } = guidance.overlay;

    const sizeClasses = {
      small: 'w-32 h-32',
      medium: 'w-48 h-48',
      large: 'w-64 h-64',
    };

    const positionClasses = {
      center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      top: 'top-1/4 left-1/2 -translate-x-1/2',
      bottom: 'bottom-1/4 left-1/2 -translate-x-1/2',
    };

    if (type === 'center-circle') {
      return (
        <div className={cn(
          'absolute rounded-full border-4 border-white border-dashed',
          'animate-pulse pointer-events-none',
          sizeClasses[size],
          positionClasses[position]
        )} />
      );
    }

    if (type === 'rectangle') {
      return (
        <div className={cn(
          'absolute border-4 border-white border-dashed rounded-lg',
          'animate-pulse pointer-events-none',
          sizeClasses[size],
          positionClasses[position]
        )} />
      );
    }

    if (type === 'serial-focus') {
      return (
        <div className={cn(
          'absolute pointer-events-none',
          positionClasses[position]
        )}>
          <div className={cn(
            'border-4 border-yellow-400 rounded-lg',
            'animate-pulse',
            sizeClasses[size]
          )}>
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-yellow-400 -translate-x-1 -translate-y-1" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-yellow-400 translate-x-1 -translate-y-1" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-yellow-400 -translate-x-1 translate-y-1" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-yellow-400 translate-x-1 translate-y-1" />
          </div>
        </div>
      );
    }

    if (type === 'grid') {
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Rule of thirds grid */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>
      );
    }

    return null;
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
              
              {/* Guidance Overlays */}
              {showGuidance && renderOverlay()}

              {/* Top Instructions Bar */}
              {showGuidance && guidance && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm mb-1">
                        {guidance.title}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {guidance.instructions.slice(0, 2).map((instruction, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-white border-white/50">
                            {instruction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-white"
                        onClick={() => setChecklistVisible(!checklistVisible)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-white"
                        onClick={() => setShowGuidance(!showGuidance)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Checklist */}
                  {checklistVisible && (
                    <div className="bg-black/80 rounded-lg p-3 space-y-2">
                      <h4 className="text-white text-xs font-medium mb-2">Checklist:</h4>
                      <div className="space-y-1.5">
                        {guidance.checkpoints.map((checkpoint, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-white/90">
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                            <span>{checkpoint}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
