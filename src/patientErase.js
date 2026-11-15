// Erasing a patient: the chart goes, their appointments go, and their name and contact details are taken off their
// invoices. The invoices themselves (numbers and amounts) stay, because a clinic has to keep its accounts.
export const ERASED_NAME = "Erased patient";

export const eraseFromRecords = ({ patientId, appointments = [], invoices = [] }) => {
  const id = String(patientId);
  const keepAppts = (Array.isArray(appointments) ? appointments : []).filter((a) => !a || String(a.patientId) !== id);
  let anonymised = 0;
  const inv = (Array.isArray(invoices) ? invoices : []).map((i) => {
    if (!i || String(i.patientId) !== id) return i;
    anonymised += 1;
    return { ...i, patient: ERASED_NAME, patientName: ERASED_NAME, phone: "", email: "", address: "", erased: true };
  });
  return { appointments: keepAppts, invoices: inv, removedAppointments: (Array.isArray(appointments) ? appointments.length : 0) - keepAppts.length, anonymisedInvoices: anonymised };
};
