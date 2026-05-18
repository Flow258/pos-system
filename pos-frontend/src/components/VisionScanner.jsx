// components/VisionScanner.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, Zap, RefreshCw } from 'lucide-react';

const VisionScanner = ({ onClose, onScan, isProcessing }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState(null);
  const [debugMsg, setDebugMsg] = useState("Initializing camera...");

  // 1. Start Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setDebugMsg("Error accessing camera: " + err.message);
      }
    };
    startCamera();

    return () => {
      // Cleanup: Stop camera when component closes
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. The Capture & Send Loop
  useEffect(() => {
    let interval;

    const captureAndCheck = async () => {
      if (!scanning || !videoRef.current || isProcessing) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to Base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

        try {
          // Send to your Python API
          const response = await fetch('http://localhost:5000/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64 })
          });

          const data = await response.json();

          if (data.success && data.detections.length > 0) {
            const bestMatch = data.detections[0];

            // AUTO ADD LOGIC:
            // If confidence is high (> 70%) and we haven't just added this exact item
            if (bestMatch.confidence > 0.70 && lastScanned !== bestMatch.barcode) {
              
              // 1. Visual Feedback
              setDebugMsg(`✅ Added: ${bestMatch.product_name}`);
              
              // 2. Play Beep Sound
              const audio = new Audio('/beep.mp3'); // Ensure you have a beep.mp3 in public folder
              audio.play().catch(e => console.log('Audio play failed'));

              // 3. Trigger the Add to Cart function passed from parent
              onScan(bestMatch.barcode);

              // 4. Prevent double scanning the same item immediately
              setLastScanned(bestMatch.barcode);
              setScanning(false); // Pause scanning briefly
              
              // Optional: Close scanner immediately
              // onClose(); 
              
              // OR: Wait 2 seconds then resume scanning (for multi-item scanning)
              setTimeout(() => {
                setScanning(true);
                setLastScanned(null);
                setDebugMsg("Scanning...");
              }, 2000);
            }
          }
        } catch (error) {
          console.error("API Error:", error);
        }
      }
    };

    // Run every 1000ms (1 second) to balance load
    interval = setInterval(captureAndCheck, 1000);

    return () => clearInterval(interval);
  }, [scanning, lastScanned, onScan, isProcessing]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-md relative">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" /> AI Vision Scanner
          </h3>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera Feed */}
        <div className="relative bg-black aspect-[3/4]">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay Box */}
          <div className="absolute inset-0 border-2 border-blue-500/50 m-8 rounded-lg flex items-center justify-center">
            {!scanning && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold animate-bounce">
                ADDED!
              </div>
            )}
          </div>
        </div>

        {/* Footer / Status */}
        <div className="p-4 bg-gray-100 border-t">
          <div className="flex items-center gap-3">
            {scanning ? (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 text-green-600" />
            )}
            <p className="text-sm font-medium text-gray-700">
              {debugMsg}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Point camera at product. Items are added automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisionScanner;