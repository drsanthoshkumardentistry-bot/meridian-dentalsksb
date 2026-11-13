import React from "react";
import { isChunkError, shouldAutoReload, crashCode } from "../recover.js";

const WHATSAPP = "919043205927";

/* Shows a friendly screen instead of a blank page if something crashes. A stale page after an update reloads itself once. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    // Log the technical error only; never log patient data
    console.error("MeriDent crashed:", error && error.message);
    if (isChunkError(error) && shouldAutoReload()) {
      this.setState({ reloading: true });
      window.location.reload();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { error, reloading } = this.state;
    const code = crashCode(error);
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const help = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, MeriDent showed an error screen. Code: ${code}`)}`;
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6 text-slate-800">
        <div role="alert" className="max-w-md w-full bg-white border border-blue-100 rounded-3xl shadow-xl p-8 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">M</div>
          <h1 className="text-lg font-black text-slate-900 text-center">{reloading ? "Updating MeriDent…" : "Something went wrong"}</h1>
          {reloading ? (
            <p className="text-sm text-slate-600 text-center">A new version is available. Loading it now.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600 leading-relaxed text-center">
                MeriDent hit an unexpected problem. Your saved records are safe: they are stored in the cloud, and anything you changed offline is kept on this device.
              </p>
              <ol className="text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
                <li>Tap the blue Reload button.</li>
                {offline && <li>You are offline. Reconnect to the internet first.</li>}
                <li>If it happens again, close the tab and open MeriDent again.</li>
                <li>Still stuck? Message us and quote the code below.</li>
              </ol>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => window.location.reload()} className="flex-1 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
                  Reload MeriDent
                </button>
                <a href={help} target="_blank" rel="noopener noreferrer" className="flex-1 px-6 py-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 text-sm font-bold text-center">
                  Message us on WhatsApp
                </a>
              </div>
              <p className="text-xs text-slate-500 text-center">Code: <span className="font-mono">{code}</span></p>
            </>
          )}
        </div>
      </div>
    );
  }
}
