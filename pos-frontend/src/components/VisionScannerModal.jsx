import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const VisionScannerModal = ({ isOpen, onClose, onProductDetected, API_BASE }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [autoScanning, setAutoScanning] = useState(true);
  const [stream, setStream] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [visionStatus, setVisionStatus] = useState('checking');
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      checkVisionHealth();
      startCamera();
    }

    return () => {
      stopCamera();
      stopAutoScanning();
    };
  }, [isOpen]);

  const checkVisionHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/vision/health`);
      const data = await response.json();

      if (data.vision_service === 'online') {
        setVisionStatus('online');
        setDetectionStatus('Vision AI Ready ✓ — Auto-scanning in 1s...');
      } else {
        setVisionStatus('offline');
        setDetectionStatus('Vision AI Offline - Use Manual Entry');
      }
    } catch (error) {
      setVisionStatus('offline');
      setDetectionStatus('Vision service unavailable');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();

        setTimeout(() => {
          setDetectionStatus('Camera ready — Auto-scanning...');
          setAutoScanning(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setDetectionStatus('Camera access denied. Please enable permissions.');
      setVisionStatus('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const stopAutoScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setAutoScanning(false);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isScanning) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 480;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const sourceX = (sourceWidth - canvas.width) / 2;
    const sourceY = (sourceHeight - canvas.height) / 2;

    context.drawImage(video, sourceX, sourceY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.7);
  }, [isScanning]);

  const detectProduct = useCallback(async (imageData) => {
    if (!imageData) return false;

    const now = Date.now();
    if (now - lastDetectionTime < 800) return false;

    try {
      setIsScanning(true);
      setDetectionStatus('Analyzing...');
      setDetectionCount(prev => prev + 1);

      const response = await fetch(`${API_BASE}/vision/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      const result = await response.json();

      // Enhanced auto-add logic
      if (result.success && result.products?.length === 1) {
        const product = result.products[0];
        const conf = product.detection?.confidence || 0;

        const shouldAutoAdd =
          conf >= 0.7 ||
          (conf >= 0.6 && detectionCount > 3) ||
          product.product?.name?.toLowerCase().includes('coke') ||
          product.product?.name?.toLowerCase().includes('bear brand');

        if (shouldAutoAdd) {
          setLastDetectionTime(Date.now());
          setDetectionStatus(`✓ ${product.product.name} (${(conf * 100).toFixed(1)}%) - Adding to cart...`);
          playSuccessSound();
          flashSuccess();

          setTimeout(() => {
            onProductDetected(product);
            handleClose();
          }, 800);

          return true;
        }
      }

      if (result.fallback) {
        setDetectionStatus(result.message || 'Product not clearly detected');
        setSuggestions(result.suggestions || []);
        setShowSuggestions(true);
      } else if (result.products?.length > 1) {
        const sortedProducts = [...result.products].sort((a, b) =>
          (b.detection?.confidence || 0) - (a.detection?.confidence || 0)
        );
        setDetectionStatus(`Multiple products detected. Select one:`);
        setSuggestions(sortedProducts.slice(0, 3));
        setShowSuggestions(true);
      } else {
        const guidance = [
          'Move closer to product...',
          'Ensure good lighting...',
          'Center product in frame...',
          'Hold steady...',
          'Scanning...'
        ];
        setDetectionStatus(guidance[detectionCount % guidance.length]);
        setShowSuggestions(false);
      }

      setLastDetectionTime(Date.now());
      return false;

    } catch (error) {
      console.error('Detection error:', error);
      setDetectionStatus('Detection error - retrying...');
      return false;
    } finally {
      setIsScanning(false);
    }
  }, [API_BASE, onProductDetected, lastDetectionTime, detectionCount]);

  useEffect(() => {
    if (!autoScanning || visionStatus !== 'online' || !videoRef.current?.videoWidth) return;

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(async () => {
      if (!isScanning) {
        const frame = captureFrame();
        if (frame) {
          const added = await detectProduct(frame);
          if (added) {
            stopAutoScanning();
          }
        }
      }
    }, 1200);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [autoScanning, visionStatus, captureFrame, detectProduct, isScanning]);

  const flashSuccess = () => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
    overlay.style.zIndex = '10000';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.3s';

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }, 300);
  };

  const playSuccessSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUrDk');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent fail
    }
  };

  const handleClose = () => {
    stopAutoScanning();
    stopCamera();
    setShowSuggestions(false);
    setSuggestions([]);
    setDetectionStatus('');
    setDetectionCount(0);
    onClose();
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.id && suggestion.product) {
      onProductDetected(suggestion);
      handleClose();
    } else {
      handleManualBarcodeLookup(suggestion.barcode);
    }
  };

  const handleManualBarcodeLookup = async (barcode) => {
    try {
      const response = await fetch(`${API_BASE}/units/lookup?barcode=${barcode}`);
      const result = await response.json();

      if (result.success && result.data) {
        onProductDetected(result.data);
        handleClose();
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
    }
  };

  const manualScan = async () => {
    const frame = captureFrame();
    if (frame) {
      const added = await detectProduct(frame);
      if (!added) {
        setTimeout(() => {
          if (!showSuggestions) {
            setDetectionStatus('Hold product steady for auto-scan...');
          }
        }, 1000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6" />
              AI Vision Scanner (Auto)
              {autoScanning && (
                <span className="ml-2 px-2 py-1 bg-green-500 rounded text-xs animate-pulse">
                  AUTO-SCAN ON
                </span>
              )}
            </h2>
            <p className="text-sm opacity-90">Point camera at product - auto adds to cart</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 bg-black relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Scanner Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 border-4 border-green-500 rounded-lg shadow-lg">
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
              </div>

              {isScanning && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-fast"></div>
              )}

              <div className="absolute -bottom-16 left-0 right-0 text-center text-white">
                <p className="text-sm font-medium bg-black bg-opacity-50 py-2 rounded">
                  {autoScanning ? 'Hold product in frame' : 'Tap to scan'}
                </p>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Status Message */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className={`
              px-4 py-3 rounded-lg font-medium text-center text-white shadow-lg backdrop-blur-sm
              ${isScanning ? 'bg-blue-600' :
                visionStatus === 'online' ? 'bg-gradient-to-r from-green-600 to-emerald-700' :
                visionStatus === 'offline' ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 
                'bg-gradient-to-r from-red-600 to-pink-700'}
            `}>
              {isScanning ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Analyzing product...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {visionStatus === 'online' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>{detectionStatus || 'Ready to scan'}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>{detectionStatus}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Auto-scan:</span> {autoScanning ? 'ON' : 'OFF'}
            {detectionCount > 0 && (
              <span className="ml-4">
                Scans: {detectionCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoScanning(!autoScanning)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                autoScanning ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {autoScanning ? 'Pause Auto' : 'Resume Auto'}
            </button>
            <button
              onClick={manualScan}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium"
              disabled={isScanning}
            >
              Quick Scan
            </button>
          </div>
        </div>

        {/* Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="p-4 bg-gray-50 border-t max-h-64 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-gray-800">
              {suggestions.some(s => s.detection) ? 'Select Product:' : 'Did you mean:'}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {suggestion.product?.name || suggestion.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {suggestion.unit_name || ''} • ₱{parseFloat(suggestion.price).toFixed(2)}
                      </p>
                      {suggestion.detection && (
                        <p className="text-xs text-green-600 mt-1">
                          Confidence: {(suggestion.detection.confidence * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    {suggestion.suggested && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Suggested
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 border-t bg-white flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes scan-fast {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-scan-fast {
          animation: scan-fast 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VisionScannerModal;