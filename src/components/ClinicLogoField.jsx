import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { isLogoDataUrl, logoFromFile } from "../clinicLogo.js";

/** Practice Profile: pick the clinic logo. It is shown here and printed on prescriptions. */
export default function ClinicLogoField({ value, onChange }) {
  const input = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const has = isLogoDataUrl(value);

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    const r = await logoFromFile(file);
    setBusy(false);
    if (r.error) setError(r.error); else onChange(r.dataUrl);
  };

  return (
    <div data-testid="clinic-logo-field" className="flex items-center gap-3">
      <div className="w-20 h-20 rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
        {has ? <img src={value} alt="Clinic logo" className="max-w-full max-h-full object-contain" /> : <ImagePlus className="w-6 h-6 text-slate-400" aria-hidden="true" />}
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current && input.current.click()} disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-60">
            {busy ? "Preparing..." : has ? "Change logo" : "Add clinic logo"}
          </button>
          {has ? (
            <button type="button" onClick={() => onChange("")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          ) : null}
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg" className="hidden" data-testid="clinic-logo-input" onChange={pick} />
        <p className="text-[10px] text-slate-500">PNG or JPEG. It is shrunk to fit and printed at the top of prescriptions.</p>
        {error ? <p role="alert" className="text-[10px] text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
