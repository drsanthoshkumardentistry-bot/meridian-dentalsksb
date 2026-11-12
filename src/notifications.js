// Bell notifications (pure): low or out-of-stock items, items near expiry, and appointments coming up.
import { stockState } from "./stock.js";
import { diaryView } from "./diary.js";
import { dateKey } from "./reminders.js";

const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const tomorrowKey = (now) => dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

/** Returns [{ id, kind: "stock" | "appointment", tone: "red" | "amber" | "blue", text, to }] most urgent first. */
export const buildNotifications = ({ inventory = [], appointments = [], now = new Date(), showStock = true, showAppointments = true } = {}) => {
  inventory = (Array.isArray(inventory) ? inventory : []).filter(Boolean);
  appointments = (Array.isArray(appointments) ? appointments : []).filter(Boolean);
  const out = [];
  if (showAppointments) {
    const today = dateKey(now);
    const clock = hhmm(now);
    const upcoming = diaryView(appointments, { view: "upcoming" }, now);
    const todays = upcoming.filter((a) => a.date === today && String(a.time || "") >= clock);
    todays.slice(0, 5).forEach((a) => out.push({ id: `appt-${a.id || a.patientName}-${a.time}`, kind: "appointment", tone: "blue", text: `${a.time || "Today"}: ${a.patientName || "Patient"}${a.procedure ? `, ${a.procedure}` : ""}`, to: "Appointments Diary" }));
    if (todays.length > 5) out.push({ id: "appt-more", kind: "appointment", tone: "blue", text: `${todays.length - 5} more visits later today`, to: "Appointments Diary" });
    const tm = upcoming.filter((a) => a.date === tomorrowKey(now)).length;
    if (tm > 0) out.push({ id: "appt-tomorrow", kind: "appointment", tone: "blue", text: `${tm} ${tm === 1 ? "visit" : "visits"} tomorrow`, to: "Appointments Diary" });
  }
  if (showStock) {
    const stock = [];
    for (const it of inventory) {
      const s = stockState(it, now);
      if (s.out) stock.push({ id: `stock-${it.id || it.name}`, kind: "stock", tone: "red", text: `${it.name} is out of stock`, to: "Stock Maintenance", rank: 0 });
      else if (s.low) stock.push({ id: `stock-${it.id || it.name}`, kind: "stock", tone: "amber", text: `${it.name} is low (${it.quantity} left)`, to: "Stock Maintenance", rank: 1 });
      if (s.expired) stock.push({ id: `exp-${it.id || it.name}`, kind: "stock", tone: "red", text: `${it.name} has expired`, to: "Stock Maintenance", rank: 0 });
      else if (s.expiringSoon) stock.push({ id: `exp-${it.id || it.name}`, kind: "stock", tone: "amber", text: `${it.name} expires soon`, to: "Stock Maintenance", rank: 2 });
    }
    stock.sort((a, b) => a.rank - b.rank);
    out.unshift(...stock.map(({ rank, ...n }) => n));
  }
  return out;
};
