// What MeriDent AI knows about the app, so it can answer "how do I...?" questions. Keep this accurate and short.
export const HELP_KNOWLEDGE = `
MeriDent is a cloud dental practice management app for Indian clinics (www.meridiandentalos.com). It works in a browser and as an Android app.
Main menu: Dashboard, Appointments Diary, Patients & Odontogram, OPG & Diagnosis Studio, Billing & Invoices, MeriDent Connect, Reports, Stock Maintenance, Employee Roles & Roster, Practice Profile.
- Dashboard: today's numbers, a "Get your clinic set up" checklist (owner only), day-end summary, and patient birthdays with a greeting to send on WhatsApp.
- Practice Profile: clinic name, doctor name, state, Dental Council registration number, UPI ID, procedure fee list, online booking switch with a booking link and QR code, team logins and roles, activity log, data download and backup, and the MeriDent AI switch (owner or manager).
- Patients & Odontogram: add patients (name, 10-digit WhatsApp number, gender, age or date of birth; a guardian is required under 18), medical alert, conditions, allergies, tooth chart, treatment plans and estimates, visit notes, assessments, files. A patient's preferred language (English, Tamil, Hindi) controls the language of WhatsApp messages.
- Treatment plans: add treatments with tooth and amount, optional discount, send the estimate on WhatsApp, print it, or send an approval link the patient opens without logging in.
- Appointments Diary: book, move and cancel appointments; send a WhatsApp reminder. Patients can request a slot through the clinic's booking link if online booking is on.
- Billing & Invoices: create an invoice from a visit or plan, record payments, show the UPI QR, send payment reminders on WhatsApp. Each invoice can name the treating dentist for the earnings report.
- Reports: collection and dentist earnings reports.
- WhatsApp: MeriDent prepares the message and opens WhatsApp on the device. The clinic taps Send. Messages are sent only if the patient has agreed to WhatsApp messages.
- Roles: owner, manager, dentist, receptionist, with different permissions. The owner invites team members by email in Practice Profile.
- Data: each clinic's data is separate. Practice Profile has Download and transfer your data (backup, restore, CSV).
- MeriDent AI: optional drafting help. "Tidy with MeriDent AI" in Visit Notes, "Explain for patient" on a treatment plan. All AI text is a draft for the dentist to check.
- Sign-in: email and password, or Google.
Pricing: early access is free. Do not quote prices or dates.
`.trim();
