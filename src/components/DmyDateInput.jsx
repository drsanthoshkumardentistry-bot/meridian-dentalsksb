import React, { useEffect, useState } from "react";
import { isoToDmy, maskDmy, dmyToIso } from "../dateInput.js";

/** Date field that shows dd/mm/yyyy (the Indian order). value and onChange use yyyy-mm-dd. max is yyyy-mm-dd. */
export default function DmyDateInput({ value, onChange, max, className = "", ariaLabel = "Date (dd/mm/yyyy)", id }) {
  const [text, setText] = useState(isoToDmy(value));
  const [problem, setProblem] = useState("");

  // Follow outside changes (for example loading another patient), but never overwrite what is being typed
  useEffect(() => {
    if (dmyToIso(text) !== (value || "")) setText(isoToDmy(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handle = (raw) => {
    const masked = maskDmy(raw);
    setText(masked);
    if (masked === "") { setProblem(""); onChange(""); return; }
    if (masked.length < 10) { setProblem(""); return; }
    const iso = dmyToIso(masked);
    if (!iso) { setProblem("That is not a real date. Use dd/mm/yyyy."); return; }
    if (max && iso > max) { setProblem("The date cannot be in the future."); return; }
    setProblem("");
    onChange(iso);
  };

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder="dd/mm/yyyy"
        maxLength={10}
        value={text}
        onChange={(e) => handle(e.target.value)}
        onBlur={() => { if (text && text.length < 10) setProblem("Type the full date as dd/mm/yyyy."); }}
        aria-invalid={problem ? "true" : undefined}
        className={className}
      />
      {problem ? <p role="alert" className="text-[11px] text-rose-600 mt-1">{problem}</p> : null}
    </>
  );
}
