import React, { useState } from "react";
import { Pill } from "lucide-react";
import { sellableItems, stockBillLine } from "../stock.js";

/** Pharmacy row on the invoice form: pick a stock item and a quantity, and it joins the bill at its selling price. */
export default function SellFromStock({ inventory, onAdd, newId, showToast }) {
  const items = sellableItems(inventory);
  const [id, setId] = useState("");
  const [qty, setQty] = useState("1");
  if (!items.length) return null;
  const add = () => {
    const item = items.find((i) => i.id === (id || items[0].id));
    const r = stockBillLine(item, qty, () => newId("LI"));
    if (r.error) { showToast(r.error); return; }
    onAdd(r.line);
    setQty("1");
  };
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-rule bg-enamel p-2.5" data-testid="sell-from-stock">
      <label className="min-w-0 flex-1 text-[11px] font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1"><Pill className="h-3 w-3" aria-hidden="true" /> Sell from stock</span>
        <select value={id || items[0].id} onChange={(e) => setId(e.target.value)} className="mt-0.5 w-full rounded-lg border border-rule bg-white px-2 py-1.5 text-xs text-slate-900">
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} (₹{i.price} each, {i.quantity} left)</option>)}
        </select>
      </label>
      <label className="w-20 text-[11px] font-semibold text-slate-600">Qty
        <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity to sell" className="mt-0.5 w-full rounded-lg border border-rule bg-white px-2 py-1.5 text-xs text-slate-900" />
      </label>
      <button type="button" onClick={add} className="rounded-lg bg-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white">Add to bill</button>
    </div>
  );
}
