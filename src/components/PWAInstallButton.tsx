import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  HelpCircle,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Get current active URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (showGuide && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [showGuide, currentUrl]);

  const handleCopy = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        id="install-phone-app-btn"
        onClick={handleInstallClick}
        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        title="Open or install this app on your phone"
      >
        <Smartphone className="w-4 h-4" />
        <span>Install on Phone</span>
      </button>

      {/* Phone Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col space-y-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">Install App on Your Phone</h3>
                  <p className="text-[11px] text-slate-400">Scan QR Code or Open Link on Mobile</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crucial: Why "Page Not Found" Happens & Fix */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Did you get "Page Not Found"? Here is why & how to fix it:</span>
              </div>
              <p className="text-[11px] text-amber-100/90 leading-relaxed pl-5">
                In Google AI Studio, a shared URL only becomes active after you click the <strong>"Share"</strong> button (located at the top-right corner of the screen next to your profile). Once shared, Cloud Run deploys the public link!
              </p>
            </div>

            {/* QR Code Section: Direct Mobile Scanning */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="App QR Code" className="w-36 h-36 rounded-lg" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-500 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>
              <div className="space-y-2 text-xs w-full">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-400" />
                  <span>Scan with Phone Camera</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open your phone's Camera app and point it at this QR code to open the app directly on your phone.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopy}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition border border-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Link Copied!' : 'Copy Direct Link'}
                  </button>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition border border-slate-700"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* If direct browser install prompt is available (e.g. running on mobile Chrome) */}
            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  setShowGuide(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Tap Here to Install App to Home Screen
              </button>
            )}

            {/* Step-by-step instructions for Android & iPhone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Android Section */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5 text-xs">
                  <Smartphone className="w-3.5 h-3.5" /> On Android (Chrome / Edge):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
                  <li>Scan the QR code or open the link in Chrome.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app icon is added to your home screen!</li>
                </ol>
              </div>

              {/* iPhone Section */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-sky-400 flex items-center gap-1.5 mb-1.5 text-xs">
                  <Share2 className="w-3.5 h-3.5" /> On iPhone (Safari):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
                  <li>Open the link in <strong>Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button (box with up arrow).</li>
                  <li>Select <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3 h-3 inline text-slate-400" />).</li>
                  <li>Tap <strong>"Add"</strong> in top-right.</li>
                </ol>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
};
