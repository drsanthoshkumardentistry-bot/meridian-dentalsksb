import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

// Live picture from a USB camera, an intraoral camera that shows up as a webcam, or a phone or tablet camera.
// Nothing is recorded or uploaded here: "Take picture" hands one still photo to the normal save step.
export const cameraSupported = () => typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

export const cameraErrorMessage = (err) => {
  const name = err && err.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access is blocked. Allow the camera for this site in your browser, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found. Plug it in and try again.";
  if (name === "NotReadableError" || name === "AbortError") return "The camera is being used by another app. Close that app and try again.";
  return "Could not start the camera. Try again.";
};

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const stop = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      stop();
      setReady(false);
      setError("");
      try {
        const constraints = { video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1920 } } : { facingMode: "environment", width: { ideal: 1920 } }, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setReady(true);
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(all.filter((d) => d.kind === "videoinput"));
      } catch (err) {
        if (!cancelled) setError(cameraErrorMessage(err));
      }
    })();
    return () => { cancelled = true; stop(); };
  }, [deviceId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const take = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { setError("Could not take the picture. Try again."); return; }
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
      stop();
      onCapture(file);
    }, "image/jpeg", 0.92);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Take a picture with a camera" className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-3">
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display font-bold text-lg">Take a picture</h3>
          <button type="button" onClick={onClose} aria-label="Close the camera" className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm p-3">{error}</p>
        ) : (
          <div className="mt-3 rounded-xl overflow-hidden bg-black aspect-video">
            <video ref={videoRef} muted playsInline aria-label="Live camera view" className="w-full h-full object-contain" />
          </div>
        )}
        {devices.length > 1 && (
          <div className="mt-3">
            <label htmlFor="cam-pick" className="block text-xs font-semibold text-slate-600 mb-1">Camera</label>
            <select id="cam-pick" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white">
              <option value="">Default camera</option>
              {devices.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
            </select>
          </div>
        )}
        <div className="mt-4 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700">Cancel</button>
          <button type="button" disabled={!ready || !!error} onClick={take} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5">
            <Camera className="w-4 h-4" aria-hidden="true" /> Take picture
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Works with a USB camera, an intraoral camera that appears as a webcam, or your phone or tablet camera. Nothing is saved until you take the picture.</p>
      </div>
    </div>
  );
}
