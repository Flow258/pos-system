import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Camera, X, AlertCircle, CheckCircle, RefreshCw, Zap, ZapOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const ALL_FORMATS = [
  0, 1, 6, 11, 2, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15,
];

const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
  const width = Math.floor(Math.min(viewfinderWidth * 0.85, 500));
  const height = Math.floor(Math.min(viewfinderHeight * 0.45, width * 0.55));
  return { width: Math.max(width, 200), height: Math.max(height, 120) };
};

const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onDetected,
  title = 'Scan Barcode',
  subtitle = 'Point the camera at a barcode or QR code',
  continuous = false,
}) => {
  const rawId = useId().replace(/[:]/g, '');
  const readerId = `barcode-reader-${rawId}`;

  // navigator.mediaDevices (live camera streaming) only exists on secure
  // contexts (HTTPS or localhost) — this is a browser-enforced restriction,
  // not something the library or app code can opt out of. On plain HTTP
  // over a LAN IP, skip straight to "take a photo" mode instead of trying
  // (and failing) live streaming first.
  const canUseLiveCamera = window.isSecureContext !== false
    && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // If we're running inside the OMV Controller Android app's WebView, it
  // exposes window.PosNativeBridge — a real native camera scan, unaffected
  // by any browser secure-context restriction. Always preferred when present.
  const hasNativeScanner = typeof window.PosNativeBridge !== 'undefined'
    && typeof window.PosNativeBridge.scanBarcode === 'function';

  const fileScannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(
    hasNativeScanner ? 'native' : (canUseLiveCamera ? 'live' : 'photo')
  );
  const [photoBusy, setPhotoBusy] = useState(false);
  const [nativeBusy, setNativeBusy] = useState(false);

  const scannerRef = useRef(null);
  const lastCodeRef = useRef({ text: null, time: 0 });
  const mountedRef = useRef(true);
  const stoppingRef = useRef(false); // prevent concurrent stop calls

  const [status, setStatus] = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1046.5;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      osc.onended = () => ctx.close();
    } catch { /* audio not critical */ }
    if (navigator.vibrate) navigator.vibrate(80);
  }, []);

  const describeError = (error) => {
    const name = error?.name || '';
    const msg = String(error?.message || error || '');
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || /permission denied|not allowed/i.test(msg)) {
      return { status: 'denied', errorMsg: 'Camera access was denied. Allow camera permission and try again.' };
    }
    if (name === 'NotFoundError' || /no camera|not found/i.test(msg)) {
      return { status: 'error', errorMsg: 'No camera found on this device.' };
    }
    if (name === 'NotReadableError' || /could not start video source|notreadable/i.test(msg)) {
      return { status: 'error', errorMsg: 'Camera is already in use by another app or tab.' };
    }
    if (window.isSecureContext === false) {
      return { status: 'error', errorMsg: 'Camera requires HTTPS (or localhost).' };
    }
    return { status: 'error', errorMsg: msg || 'Could not access the camera.' };
  };

  const applyTorch = useCallback(async (on) => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const caps = scanner.getRunningTrackCameraCapabilities();
      const torchFeature = caps?.torchFeature?.();
      if (torchFeature?.isSupported?.()) {
        await torchFeature.apply(on);
        setTorchOn(on);
      }
    } catch { /* torch not supported */ }
  }, []);

  // ---- Improved stop function ----
  const stopScanner = useCallback(async () => {
    // Prevent multiple simultaneous stop attempts
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    const scanner = scannerRef.current;
    if (!scanner) {
      stoppingRef.current = false;
      return;
    }
    try {
      // Always try to stop first, even if isScanning is false, to be safe.
      if (scanner.isScanning) {
        await scanner.stop();
      }
      // Then clear (this removes the video element and cleans up)
      await scanner.clear();
    } catch (error) {
      // Ignore errors – the scanner is likely already stopped or cleared.
      console.debug('Scanner stop/clear error:', error);
    } finally {
      stoppingRef.current = false;
      // Clear the ref so future calls don't reuse a dead scanner
      scannerRef.current = null;
    }
  }, []);

  // ---- Shared "code found" handler, used by both live scan and photo mode ----
  const handleDetected = useCallback((decodedText, formatName) => {
    const now = Date.now();
    if (decodedText === lastCodeRef.current.text && now - lastCodeRef.current.time < 2000) return;
    lastCodeRef.current = { text: decodedText, time: now };
    beep();
    setLastResult({ text: decodedText, format: formatName });
    onDetected(decodedText, formatName);
    if (!continuous) {
      stopScanner();
      onClose();
    }
  }, [beep, continuous, onDetected, onClose, stopScanner]);

  // ---- Photo mode: decode a barcode from a still image instead of live video ----
  // Uses <input type="file" capture="environment">, which opens the native
  // camera app rather than requesting a MediaStream. That path isn't gated by
  // secure-context rules, so it works over plain HTTP / LAN IPs.
  const handlePhotoFile = useCallback(async (file) => {
    if (!file) return;
    setPhotoBusy(true);
    setStatus('starting');
    setErrorMsg('');
    try {
      if (!fileScannerRef.current) {
        fileScannerRef.current = new Html5Qrcode(readerId, {
          formatsToSupport: ALL_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
      }
      const result = await fileScannerRef.current.scanFileV2(file, true);
      if (!mountedRef.current) return;
      setStatus('scanning');
      handleDetected(result.decodedText, result?.result?.format?.formatName);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Photo decode error:', error);
      setStatus('error');
      setErrorMsg('No barcode found in that photo. Try again with better lighting or a closer shot.');
    } finally {
      if (mountedRef.current) setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [readerId, handleDetected]);

  // ---- Clean start function ----
  const startScanner = useCallback(async (config) => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    // Stop any existing scan before starting a new one
    await stopScanner();
    if (!mountedRef.current) return;

    await scanner.start(
      config,
      { fps: 10, qrbox: qrboxFunction, aspectRatio: 1.7777, disableFlip: false },
      (decodedText, result) => {
        if (!mountedRef.current) return;
        handleDetected(decodedText, result?.result?.format?.formatName);
      },
      () => {} // ignore per-frame errors
    );
  }, [stopScanner, handleDetected]);

  // ---- Native mode: hand off to the Android app's real camera, bypassing
  // the browser entirely. WebActivity.kt calls window.__nativeBarcodeResult
  // or window.__nativeBarcodeCancelled once the user finishes.
  useEffect(() => {
    if (!isOpen || mode !== 'native') return;

    setNativeBusy(true);
    setStatus('starting');
    setErrorMsg('');

    window.__nativeBarcodeResult = (payload) => {
      if (!mountedRef.current) return;
      setNativeBusy(false);
      setStatus('scanning');
      handleDetected(payload?.text, payload?.format);
    };
    window.__nativeBarcodeCancelled = () => {
      if (!mountedRef.current) return;
      setNativeBusy(false);
      // User backed out of the native scanner — just sit idle, they can tap
      // "Scan" again rather than being dropped into an error state.
      setStatus('starting');
    };

    window.PosNativeBridge.scanBarcode();

    return () => {
      delete window.__nativeBarcodeResult;
      delete window.__nativeBarcodeCancelled;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // ---- useEffect for opening/closing ----
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup will run when component unmounts or isOpen becomes false.
      // We call stopScanner (not awaited) to stop and clear the scanner.
      stopScanner();
      if (fileScannerRef.current) {
        fileScannerRef.current.clear().catch(() => {});
        fileScannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen || mode !== 'live') {
      stopScanner();
      return;
    }

    let stale = false;
    setStatus('starting');
    setErrorMsg('');
    setLastResult(null);
    setTorchOn(false);
    lastCodeRef.current = { text: null, time: 0 };

    // Enumerate cameras (optional, doesn't affect start)
    Html5Qrcode.getCameras()
      .then((cams) => {
        if (!stale && mountedRef.current) setDevices(cams || []);
      })
      .catch(() => {});

    // Create new scanner instance
    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: ALL_FORMATS,
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    scannerRef.current = scanner;

    // Attempt to start with environment camera
    startScanner({ facingMode: 'environment' })
      .then(() => {
        if (stale || !mountedRef.current) {
          stopScanner();
          return;
        }
        setStatus('scanning');
        try {
          const caps = scanner.getRunningTrackCameraCapabilities();
          setTorchSupported(!!caps?.torchFeature?.()?.isSupported?.());
        } catch { /* ignore */ }
      })
      .catch((error) => {
        if (stale || !mountedRef.current) return;
        console.error('Camera start error:', error);
        const { status: s, errorMsg: m } = describeError(error);
        setStatus(s);
        setErrorMsg(m);
      });

    return () => {
      stale = true;
      // Cleanup when isOpen becomes false or deps change
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, readerId, startScanner, stopScanner]);

  // ---- Retry ----
  const retry = () => {
    setStatus('starting');
    setErrorMsg('');
    const scanner = scannerRef.current;
    if (!scanner) return;
    const config = deviceIndex != null && devices[deviceIndex]?.id
      ? devices[deviceIndex].id
      : { facingMode: 'environment' };
    startScanner(config)
      .then(() => {
        if (!mountedRef.current) return;
        setStatus('scanning');
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        const { status: s, errorMsg: m } = describeError(error);
        setStatus(s);
        setErrorMsg(m);
      });
  };

  // ---- Switch camera ----
  const switchCamera = async () => {
    if (devices.length < 2) return;
    const nextIndex = (deviceIndex + 1) % devices.length;
    setDeviceIndex(nextIndex);
    setStatus('starting');
    const config = devices[nextIndex].id;
    await startScanner(config);
    if (mountedRef.current) {
      setStatus('scanning');
      setTorchOn(false);
    }
  };

  // ---- Close handler ----
  const handleClose = () => {
    // Stop scanner and then close modal
    stopScanner().finally(() => {
      if (mountedRef.current) onClose();
    });
  };

  if (!isOpen) return null;

  return (
    // z-[70]: must render above ProductModal (z-50). Both are position:fixed
    // siblings mounted conditionally in App.jsx; with equal z-index the later
    // DOM node (ProductModal) would win the stacking and cover this scanner,
    // leaving only its bottom result bar visible. Bumping this above fixes it.
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {title}
            </h2>
            <p className="text-xs opacity-90">{subtitle}</p>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden file input backing photo mode — capture="environment" opens
            the native camera app directly rather than requesting a live
            MediaStream, so it isn't blocked on HTTP/LAN-IP origins. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhotoFile(e.target.files?.[0])}
        />

        {mode === 'photo' && (hasNativeScanner || canUseLiveCamera) && (
          <button
            onClick={() => setMode(hasNativeScanner ? 'native' : 'live')}
            className="text-xs text-blue-600 underline px-4 pt-2 text-left"
          >
            {hasNativeScanner ? 'Try app camera instead' : 'Try live camera instead'}
          </button>
        )}
        {mode === 'live' && (
          <button
            onClick={() => setMode('photo')}
            className="text-xs text-blue-600 underline px-4 pt-2 text-left"
          >
            Camera not working? Take a photo instead
          </button>
        )}
        {mode === 'native' && (
          <button
            onClick={() => setMode(canUseLiveCamera ? 'live' : 'photo')}
            className="text-xs text-blue-600 underline px-4 pt-2 text-left"
          >
            Camera not working? Take a photo instead
          </button>
        )}

        {/* Camera view */}
        <div className="flex-1 bg-black relative overflow-hidden" style={{ minHeight: '320px' }}>
          <div id={readerId} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

          {mode === 'native' && !nativeBusy && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-40">
              <div className="text-center px-6">
                <Camera className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm mb-4">Ready to scan with the app's camera.</p>
                <button
                  onClick={() => window.PosNativeBridge.scanBarcode()}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium"
                >
                  Scan
                </button>
              </div>
            </div>
          )}

          {mode === 'native' && nativeBusy && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-40 pointer-events-none">
              <div className="text-center">
                <Camera className="w-10 h-10 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Opening camera...</p>
              </div>
            </div>
          )}

          {mode === 'photo' && !photoBusy && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-40">
              <div className="text-center px-6">
                <Camera className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm mb-4">Take a photo of the barcode — works without HTTPS.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium"
                >
                  Open Camera
                </button>
              </div>
            </div>
          )}

          {mode === 'photo' && photoBusy && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-40 pointer-events-none">
              <div className="text-center">
                <Camera className="w-10 h-10 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Reading barcode...</p>
              </div>
            </div>
          )}

          {mode === 'live' && status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-40 pointer-events-none">
              <div className="text-center">
                <Camera className="w-10 h-10 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'denied') && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-70 p-6">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-400" />
                <p className="text-sm mb-3">{errorMsg}</p>
                <button
                  onClick={
                    mode === 'photo' ? () => fileInputRef.current?.click()
                    : mode === 'native' ? () => window.PosNativeBridge.scanBarcode()
                    : retry
                  }
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium"
                >
                  {mode === 'photo' ? 'Take Another Photo' : mode === 'native' ? 'Scan Again' : 'Retry'}
                </button>
              </div>
            </div>
          )}

          {/* Status / last result bar */}
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
            <div className={`px-3 py-2 rounded-lg text-center text-sm font-medium text-white shadow backdrop-blur-sm ${
              lastResult ? 'bg-green-600' : 'bg-black bg-opacity-50'
            }`}>
              {lastResult ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {lastResult.text}
                </span>
              ) : status === 'scanning' ? (
                'Align the code within the frame'
              ) : ''}
            </div>
          </div>

          {/* Camera controls */}
          <div className="absolute top-3 right-3 flex gap-2">
            {torchSupported && (
              <button
                onClick={() => applyTorch(!torchOn)}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                title="Toggle flashlight"
              >
                {torchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </button>
            )}
            {devices.length > 1 && (
              <button
                onClick={switchCamera}
                className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                title="Switch camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
          Supports QR, Data Matrix, Aztec, PDF417, EAN-13/8, UPC-A/E, Code 128/39/93, Codabar, ITF
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;