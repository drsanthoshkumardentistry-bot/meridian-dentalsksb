import React from "react";

export const MONEY_STEP = 10;

/** The next value after pressing up or down: moves by ₹10, never below zero, keeps paise tidy. */
export const stepMoney = (value, dir, step = MONEY_STEP) => {
  const n = Number(value);
  const base = Number.isFinite(n) ? n : 0;
  const next = Math.max(0, Math.round((base + dir * step) * 100) / 100);
  return String(next);
};

/**
 * A rupee amount box. Typing works as usual (paise allowed); the up and down arrows,
 * the buttons and the keyboard arrow keys change the amount by ₹10 each time.
 */
export default function MoneyInput({ value, onChange, className = "", max, ...rest }) {
  const wrapClass = (className.match(/(?:^|\s)((?:[a-z]+:)?(?:w-|col-span-)\S+)/g) || []).join(" ");
  const bump = (dir) => {
    let next = stepMoney(value, dir);
    if (max != null && Number(next) > Number(max)) next = String(max);
    onChange({ target: { value: next } });
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      bump(e.key === "ArrowUp" ? 1 : -1);
    }
  };
  const btn = "absolute right-1 flex h-4 w-5 items-center justify-center rounded text-[9px] leading-none text-slate-500 hover:bg-mist hover:text-ink";
  return (
    <div className={`relative min-w-0 ${wrapClass.includes("w-") ? "" : "w-full"} ${wrapClass}`}>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        max={max}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`${className} w-full pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        {...rest}
      />
      <button type="button" tabIndex={-1} aria-label="Add 10 rupees" onClick={() => bump(1)} className={`${btn} top-1/2 -translate-y-[110%]`}>▲</button>
      <button type="button" tabIndex={-1} aria-label="Take off 10 rupees" onClick={() => bump(-1)} className={`${btn} top-1/2 translate-y-[10%]`}>▼</button>
    </div>
  );
}
