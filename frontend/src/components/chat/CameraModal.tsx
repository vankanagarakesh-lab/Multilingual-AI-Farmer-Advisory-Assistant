import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, SwitchCamera } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsLoading(true);
    setError(null);

    // Stop previous tracks if any
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      // Try generic video constraint fallback
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr: any) {
        setError('Camera permission denied or camera not found. Please allow camera access in browser settings.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Crop / Plant Leaf Camera</h3>
              <p className="text-xs text-slate-400">Capture photo for AI disease & symptom diagnosis</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Captured Photo */}
        <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center text-rose-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
              <p className="text-xs">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured crop" 
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Camera flip button */}
              <button
                type="button"
                onClick={toggleCamera}
                title="Switch Camera (Front/Back)"
                className="absolute top-3 right-3 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 shadow-lg backdrop-blur-sm transition"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-900/30 transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={isLoading || !!error}
                className="mx-auto px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-xl shadow-emerald-900/40 transition active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Plant Image</span>
              </button>

              <div className="w-12" /> {/* Spacer */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
