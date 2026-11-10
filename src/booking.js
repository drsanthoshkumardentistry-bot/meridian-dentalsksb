import { dateKey } from "./reminders.js";

export const BOOKING_SERVICES = ["Check-up and consultation", "Scaling and polishing", "Tooth pain", "Filling", "Root canal", "Braces enquiry", "Other"];
export const bookingUrl = (origin, clinicId) => `${String(origin).replace(/\/$/, "")}/?book=${encodeURIComponent(clinicId)}`;

/** The public page doc. Only these fields are ever published. */
export const buildBookingPage = (profile = {}, clinicId, settings = {}) => ({
  clinicId,
  enabled: Boolean(settings.enabled),
  name: String(profile.name || "").slice(0, 80),
  address: String(profile.address || "").slice(0, 200),
  phone: String(profile.phone || "").slice(0, 20),
  doctor: String(profile.drName || "").slice(0, 80),
  services: BOOKING_SERVICES,
});

export const validateBookingRequest = (form = {}, now = new Date()) => {
  const name = String(form.name || "").trim();
  const phone = String(form.phone || "").replace(/\D/g, "").slice(-10);
  if (!name) return { ok: false, error: "Enter your name" };
  if (name.length > 80) return { ok: false, error: "Name is too long" };
  if (!/^[6-9]\d{9}$/.test(phone)) return { ok: false, error: "Enter a valid 10-digit mobile number" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date || "") || form.date < dateKey(now)) return { ok: false, error: "Choose today or a later date" };
  if (!["Morning", "Afternoon", "Evening"].includes(form.slot)) return { ok: false, error: "Choose a time of day" };
  return { ok: true, request: {
    name, phone, date: form.date, slot: form.slot,
    service: BOOKING_SERVICES.includes(form.service) ? form.service : "Other",
    note: String(form.note || "").trim().slice(0, 300),
  } };
};

export const buildBookingDoc = (request, clinicId, now = new Date()) => ({
  ...request, clinicId, status: "new", createdAt: now.toISOString(),
});

export const SLOT_TIMES = { Morning: "10:00", Afternoon: "14:00", Evening: "17:30" };

/** Turn a request into diary and patient records. */
export const requestToAppointment = (req, { newId, doctor, chair, patients = [] }) => {
  const existing = patients.find((p) => String(p.phone || "").replace(/\D/g, "").slice(-10) === req.phone);
  const patient = existing || null;
  return {
    patient,
    appointment: {
      id: newId("APT"), patientId: existing ? existing.id : "", patientName: req.name, phone: req.phone,
      date: req.date, time: SLOT_TIMES[req.slot] || "10:00", chair, doctor,
      procedure: req.service, status: "Confirmed", source: "online",
    },
  };
};
