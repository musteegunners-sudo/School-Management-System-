import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  FlipHorizontal,
  Sparkles,
} from 'lucide-react';

interface StudentPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (dataUrl: string) => void;
  currentPhotoUrl?: string;
  studentName?: string;
}

export const StudentPhotoCaptureModal: React.FC<StudentPhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  currentPhotoUrl,
  studentName = 'Student',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Start camera stream
  const startCamera = async (deviceId?: string, faceMode: 'user' | 'environment' = 'user') => {
    stopCameraStream();
    setCameraError(null);
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Please use the file upload option.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: faceMode,
              width: { ideal: 640 },
              height: { ideal: 640 },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Enumerate devices for camera switching
      try {
        const devList = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devList.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (!selectedDeviceId && videoDevs.length > 0) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.warn('Error enumerating devices:', err);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera permissions in your browser or upload a photo.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload an image file instead.');
      } else {
        setCameraError('Unable to connect to camera. Please check your camera permissions or upload an image.');
      }
      setIsCameraActive(false);
    }
  };

  // Switch facing mode (front/rear)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  };

  // Initialize or stop camera based on modal state and tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(selectedDeviceId || undefined, facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab]);

  // Ensure video element gets srcObject when active
  useEffect(() => {
    if (videoRef.current && stream && isCameraActive) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isCameraActive]);

  // Crop and compress image from canvas
  const processImageToPassportDataUrl = (
    imageSource: HTMLVideoElement | HTMLImageElement,
    sourceWidth: number,
    sourceHeight: number
  ): string => {
    const canvas = document.createElement('canvas');
    const targetSize = 400; // 400x400 standard passport size
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Center crop to 1:1 aspect ratio
    const minDim = Math.min(sourceWidth, sourceHeight);
    const sx = (sourceWidth - minDim) / 2;
    const sy = (sourceHeight - minDim) / 2;

    ctx.drawImage(
      imageSource,
      sx,
      sy,
      minDim,
      minDim,
      0,
      0,
      targetSize,
      targetSize
    );

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Capture photo from video
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    const photoDataUrl = processImageToPassportDataUrl(video, vWidth, vHeight);
    setCapturedImage(photoDataUrl);
    stopCameraStream();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(selectedDeviceId || undefined, facingMode);
  };

  // Process uploaded file
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const compressedDataUrl = processImageToPassportDataUrl(img, img.width, img.height);
        setCapturedImage(compressedDataUrl);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Apply selected photo
  const handleApplyPhoto = () => {
    if (capturedImage) {
      onPhotoSelected(capturedImage);
      handleClose();
    }
  };

  // Close handler with camera shutdown
  const handleClose = () => {
    stopCameraStream();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Student Passport Photo</h3>
              <p className="text-[11px] text-slate-500">
                Capture live or upload for {studentName}
              </p>
            </div>
          </div>
          <button
            id="btn-close-photo-modal"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Live Camera vs File Upload */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            id="tab-camera-capture"
            onClick={() => {
              setActiveTab('camera');
              setCapturedImage(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture with Camera</span>
          </button>
          <button
            id="tab-photo-upload"
            onClick={() => {
              setActiveTab('upload');
              stopCameraStream();
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image File</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 flex flex-col items-center">
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center">
              {capturedImage ? (
                // Captured Photo Preview
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-52 h-52 rounded-2xl overflow-hidden border-3 border-emerald-600 shadow-md bg-slate-900 mb-3">
                    <img
                      src={capturedImage}
                      alt="Captured Student Headshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 text-center">
                    Review headshot alignment. Click &ldquo;Apply Photo&rdquo; to save or &ldquo;Retake&rdquo; to capture again.
                  </p>

                  <div className="flex items-center gap-2 w-full">
                    <button
                      id="btn-retake-photo"
                      onClick={handleRetake}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retake
                    </button>
                    <button
                      id="btn-confirm-captured-photo"
                      onClick={handleApplyPhoto}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply Photo
                    </button>
                  </div>
                </div>
              ) : cameraError ? (
                // Camera Error State
                <div className="w-full py-8 px-4 text-center bg-rose-50 rounded-2xl border border-rose-200">
                  <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-rose-900 mb-1">Camera Unavailable</h4>
                  <p className="text-[11px] text-rose-700 mb-4 max-w-xs mx-auto">
                    {cameraError}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      id="btn-retry-camera"
                      onClick={() => startCamera(selectedDeviceId || undefined, facingMode)}
                      className="px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-rose-800 text-xs font-medium hover:bg-rose-100 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry Access
                    </button>
                    <button
                      id="btn-switch-to-upload"
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-medium hover:bg-emerald-900 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Switch to File Upload
                    </button>
                  </div>
                </div>
              ) : (
                // Live Viewfinder
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-60 h-60 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-600 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Passport Oval Alignment Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-36 h-44 border-2 border-dashed border-emerald-300/70 rounded-full opacity-70" />
                    </div>

                    {/* Live indicator */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </div>

                    {/* Camera Switch button if supported */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      title="Flip Camera"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Device selector if multiple cameras detected */}
                  {devices.length > 1 && (
                    <div className="mt-2 w-full max-w-xs">
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => {
                          setSelectedDeviceId(e.target.value);
                          startCamera(e.target.value, facingMode);
                        }}
                        className="w-full text-[11px] py-1 px-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                      >
                        {devices.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Camera ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 mt-3 text-center">
                    Position student face inside the oval guide with good lighting
                  </p>

                  <button
                    id="btn-shutter-capture"
                    onClick={handleCapturePhoto}
                    disabled={!isCameraActive}
                    className="mt-4 w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98"
                  >
                    <div className="w-3 h-3 rounded-full bg-rose-500 border border-white" />
                    <span>Capture Passport Photo</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="w-full flex flex-col items-center">
              {capturedImage ? (
                // Uploaded Image Preview
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-52 h-52 rounded-2xl overflow-hidden border-3 border-emerald-600 shadow-md bg-slate-900 mb-3">
                    <img
                      src={capturedImage}
                      alt="Uploaded Student Headshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 text-center">
                    Image automatically cropped & formatted to 1:1 standard passport aspect.
                  </p>

                  <div className="flex items-center gap-2 w-full">
                    <button
                      id="btn-upload-another-photo"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose Another
                    </button>
                    <button
                      id="btn-confirm-uploaded-photo"
                      onClick={handleApplyPhoto}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply Photo
                    </button>
                  </div>
                </div>
              ) : (
                // Drag and drop upload zone
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    Click to browse or drag & drop student image
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Supports JPG, PNG, WEBP. Automatically crops to standard 1:1 student passport square.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Auto-compressed for cloud sync
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* Current photo display if present */}
          {currentPhotoUrl && !capturedImage && (
            <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Current student passport on file:</span>
              <img
                src={currentPhotoUrl}
                alt="Current Passport"
                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
