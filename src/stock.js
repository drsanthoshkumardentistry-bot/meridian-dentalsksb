import { parseAnyDate } from "./reminders.js";

const DAY = 24 * 60 * 60 * 1000;
export const EXPIRY_WARN_DAYS = 30;
const at = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();

const wholeNumber = (v, fallback = 0) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Days until the expiry date (negative once expired); null without a usable date. */
export const daysToExpiry = (item, now = new Date()) => {
  const d = parseAnyDate(item?.expiry);
  return d ? Math.round((at(d) - at(now)) / DAY) : null;
};

/** Everything the screen needs to know about one item. */
export const stockState = (item = {}, now = new Date()) => {
  item = item || {};
  const qty = wholeNumber(item.quantity);
  const min = wholeNumber(item.minThreshold);
  const days = daysToExpiry(item, now);
  return {
    out: qty === 0,
    low: qty > 0 && qty <= min,
    expired: days !== null && days < 0,
    expiringSoon: days !== null && days >= 0 && days <= EXPIRY_WARN_DAYS,
    days
  };
};

/** Quantity can never go below zero. Keeps the saved status label in step. */
export const adjustStock = (item, delta) => {
  const quantity = Math.max(0, wholeNumber(item.quantity) + Math.trunc(Number(delta) || 0));
  return { ...item, quantity, status: quantity <= wholeNumber(item.minThreshold) ? "Low Stock" : "In Stock" };
};

/** Validate the add form. Returns { ok, item } or { ok: false, error }. */
export const buildStockItem = (form, id) => {
  const name = String(form.name || "").trim();
  if (!name) return { ok: false, error: "Item name is required" };
  const qty = Number(form.quantity === "" ? 0 : form.quantity);
  const min = Number(form.minThreshold === "" ? 0 : form.minThreshold);
  if (!Number.isFinite(qty) || qty < 0) return { ok: false, error: "Quantity cannot be negative" };
  if (!Number.isFinite(min) || min < 0) return { ok: false, error: "Reorder level cannot be negative" };
  const quantity = Math.floor(qty);
  const minThreshold = Math.floor(min);
  const price = Math.round(Number(form.price === "" || form.price == null ? 0 : form.price) * 100) / 100;
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Selling price cannot be negative" };
  const item = {
    id,
    name,
    category: form.category,
    quantity,
    unit: String(form.unit || "").trim(),
    minThreshold,
    status: quantity <= minThreshold ? "Low Stock" : "In Stock",
    ...(form.expiry ? { expiry: form.expiry } : {}),
    ...(price > 0 ? { price } : {})
  };
  return { ok: true, item };
};

export const stockSummary = (items = [], now = new Date()) => {
  const s = { total: items.length, out: 0, low: 0, expiring: 0, expired: 0 };
  for (const it of (Array.isArray(items) ? items : []).filter(Boolean)) {
    const st = stockState(it, now);
    if (st.out) s.out += 1;
    else if (st.low) s.low += 1;
    if (st.expired) s.expired += 1;
    else if (st.expiringSoon) s.expiring += 1;
  }
  return s;
};

/** view: all | reorder (out or low) | expiring (expired or soon). Items needing action come first. */
export const stockView = (items = [], { view = "all", query = "" } = {}, now = new Date()) => {
  const q = String(query).trim().toLowerCase();
  const found = q ? items.filter((i) => [i.name, i.category, i.unit].some((f) => String(f || "").toLowerCase().includes(q))) : items;
  if (view === "reorder") {
    return found
      .filter((i) => {
        const s = stockState(i, now);
        return s.out || s.low;
      })
      .sort((a, b) => wholeNumber(a.quantity) - wholeNumber(b.quantity));
  }
  if (view === "expiring") {
    return found
      .filter((i) => {
        const s = stockState(i, now);
        return s.expired || s.expiringSoon;
      })
      .sort((a, b) => daysToExpiry(a, now) - daysToExpiry(b, now));
  }
  return found;
};

/** A shopping list the clinic can send to a supplier. Empty string when nothing needs ordering. */
export const buildReorderMessage = ({ clinicName, items = [] }, now = new Date()) => {
  const need = items.filter((i) => {
    const s = stockState(i, now);
    return s.out || s.low;
  });
  if (!need.length) return "";
  const lines = need.map((i) => {
    const top = Math.max(wholeNumber(i.minThreshold) * 2 - wholeNumber(i.quantity), 1);
    return `- ${i.name}: ${wholeNumber(i.quantity)} left, please send ${top}${i.unit ? ` ${i.unit}` : ""}`;
  });
  return `Hello, this is ${clinicName || "our dental clinic"}. We would like to reorder:\n\n${lines.join("\n")}\n\nPlease confirm availability and price. Thank you.`;
};

/* Pharmacy: items with a selling price can be sold on a bill, and the stock drops when the bill is saved. */

/** Items that can be sold right now: a selling price and something on the shelf. */
export const sellableItems = (inventory = []) =>
  (Array.isArray(inventory) ? inventory : []).filter((i) => i && Number(i.price) > 0 && wholeNumber(i.quantity) > 0);

/** A bill line for selling `qty` of an item, or { error }. */
export const stockBillLine = (item, qty, makeId = () => "") => {
  const n = Math.floor(Number(qty));
  if (!item) return { error: "Choose an item" };
  if (!Number.isFinite(n) || n < 1) return { error: "Quantity must be at least 1" };
  if (n > wholeNumber(item.quantity)) return { error: `Only ${wholeNumber(item.quantity)} ${item.unit || "in stock"} of ${item.name} left` };
  const price = Number(item.price);
  if (!(price > 0)) return { error: `${item.name} has no selling price yet` };
  return { line: { id: makeId(), description: `${item.name} x ${n}`, amount: String(Math.round(price * n * 100) / 100), taxCategory: "therapeutic", stockId: item.id, stockQty: n } };
};

/** Takes the sold quantities off the shelf. Refuses when any item would go below zero. */
export const takeStockForBill = (inventory = [], items = []) => {
  const need = new Map();
  for (const it of items) if (it && it.stockId) need.set(it.stockId, (need.get(it.stockId) || 0) + wholeNumber(it.stockQty));
  if (!need.size) return { ok: true, inventory };
  for (const [id, qty] of need) {
    const item = inventory.find((x) => x.id === id);
    if (!item) return { ok: false, error: "An item on this bill is no longer in stock records" };
    if (qty > wholeNumber(item.quantity)) return { ok: false, error: `Only ${wholeNumber(item.quantity)} of ${item.name} left in stock` };
  }
  return { ok: true, inventory: inventory.map((x) => (need.has(x.id) ? adjustStock(x, -need.get(x.id)) : x)) };
};
