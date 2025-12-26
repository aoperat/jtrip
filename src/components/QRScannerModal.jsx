import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export default function QRScannerModal({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef(null);
  const containerId = 'qr-scanner-container';

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    const startScanning = async () => {
      try {
        setIsStarting(true);
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
            ],
          },
          (decodedText, decodedResult) => {
            const formatName = decodedResult?.result?.format?.formatName || 'QR_CODE';
            html5QrCode.stop().then(() => {
              onScan(decodedText, formatName.includes('QR') ? 'QR' : 'Barcode');
            });
          },
          () => {
            // 스캔 중 - 무시
          }
        );
        setIsStarting(false);
        setError(null);
      } catch (err) {
        setIsStarting(false);
        if (err.name === 'NotAllowedError') {
          setError('카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        } else if (err.name === 'NotFoundError') {
          setError('카메라를 찾을 수 없습니다.');
        } else {
          setError(err.message || '카메라를 시작할 수 없습니다.');
        }
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().then(() => {
        onClose();
      }).catch(() => {
        onClose();
      });
    } else {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-[250] bg-black flex flex-col">
      {/* 헤더 */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-center">
        <button
          onClick={handleClose}
          className="p-3 bg-white/20 backdrop-blur rounded-full text-white active:scale-90 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-black text-sm tracking-wide">QR/바코드 스캔</span>
        <div className="w-12" />
      </header>

      {/* 스캐너 영역 */}
      <div className="flex-1 relative">
        <div id={containerId} className="w-full h-full" />

        {/* 스캔 가이드 오버레이 */}
        {!error && !isStarting && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-white rounded-3xl relative">
              {/* 코너 강조 */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-2xl" />
            </div>
          </div>
        )}

        {/* 로딩 표시 */}
        {isStarting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Camera className="w-16 h-16 text-white/50 mx-auto mb-4 animate-pulse" />
              <p className="text-white/70 text-sm">카메라 시작 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black p-8">
          <div className="bg-red-500/20 backdrop-blur border border-red-500/30 text-white p-6 rounded-3xl text-center max-w-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="font-bold mb-2">카메라 접근 실패</p>
            <p className="text-sm opacity-80 mb-6">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm"
            >
              이미지로 등록하기
            </button>
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      {!error && !isStarting && (
        <div className="absolute bottom-8 left-6 right-6 text-center">
          <p className="text-white/80 text-sm font-medium">
            QR 코드나 바코드를 사각형 안에 맞춰주세요
          </p>
        </div>
      )}
    </div>
  );
}
