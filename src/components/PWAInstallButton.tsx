import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle, ExternalLink, X, HelpCircle, Share2, ShieldCheck } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
      }
    } catch {
      // Ignore clipboard restriction in sandboxed iframe
    }
  };

  return (
    <>
      <button
        id="btn-install-apk"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 border border-emerald-400/30"
        title="Install Android App / APK"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-100" />
        <span className="hidden sm:inline">Get Android APK / App</span>
        <span className="sm:hidden">Install App</span>
      </button>

      {/* APK & App Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 text-slate-800 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Android APK & App Installation
                </h3>
                <p className="text-xs text-slate-500">
                  Kulliyyat Taṭbīq at-Taʿālīm al-Islāmiyyah
                </p>
              </div>
            </div>

            {/* Status indicator */}
            {isInstalled ? (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Already Installed!</strong> This application is currently running as an installed standalone mobile application on your device.
                </span>
              </div>
            ) : null}

            <div className="space-y-4 text-xs text-slate-600">
              {/* Option 1: Direct Android WebAPK */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center text-[10px]">1</span>
                    Direct One-Click Android WebAPK
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    Recommended
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-3">
                  Google Chrome automatically compiles and installs this system as an official native Android package (WebAPK) directly onto your phone's home screen with full offline capability, app drawer icon, and full-screen display.
                </p>

                {isInstallable ? (
                  <button
                    onClick={async () => {
                      await install();
                      setShowModal(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Install WebAPK to Android Now
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-800">On Android (Google Chrome):</p>
                    <ol className="list-decimal list-inside space-y-1 pl-1">
                      <li>Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.</li>
                      <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>Chrome installs the official APK directly with the school crest icon.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Option 2: Standalone .APK File Generator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2 font-bold text-sm text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center text-[10px]">2</span>
                  Generate Standalone Downloadable .APK
                </div>
                <p className="text-slate-600 leading-relaxed mb-3">
                  To create a standalone downloadable <code>.apk</code> package file for distribution or sideloading via USB/WhatsApp, you can enter the live URL into Microsoft's free <strong>PWABuilder</strong> tool:
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-mono select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs whitespace-nowrap transition-colors"
                  >
                    {copiedUrl ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Build APK at PWABuilder.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* iOS Safari instructions if relevant */}
              {isIOS && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-700" />
                    Installing on iPhone / iPad (iOS Safari)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                    <li>Tap the <strong>Share</strong> button (square with arrow) in Safari.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in the upper right.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                PWA & WebAPK compliant
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
